// REC-01: full recovery rehearsal into an ISOLATED Supabase project (never production).
// Steps, each timed: migrations → synthetic backup → Auth accounts → database → Storage
// → access checks with two synthetic identities and without a session.
// Usage:
//   node --env-file=RUTA_ENV_RECUPERACION tools/fortius-inmuebles-recovery-rehearsal.mjs --confirm-target REF [--backup DIR]
// Environment: FORTIUS_RECOVERY_SUPABASE_URL, FORTIUS_RECOVERY_ANON_KEY,
// FORTIUS_RECOVERY_SERVICE_ROLE_KEY and FORTIUS_RECOVERY_DB_URL (owner connection string).
// Requires the `pg` package (dev dependency). Nothing here reads production credentials.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ownerExport, verifyBackup } from './fortius-inmuebles-backup.mjs';
import { databaseSsl } from './fortius-inmuebles-owner-export.mjs';
import { restoreCurrentInto } from './fortius-inmuebles-restore-current.mjs';
import { assertIsolatedTarget, PRODUCTION_PROJECT_REF, restoreStorageToService } from './fortius-inmuebles-restore-storage.mjs';
import { buildSyntheticBackup, SYNTHETIC } from './fortius-inmuebles-synthetic-backup.mjs';

/** The owner connection string must point at the confirmed isolated project only. */
export function assertIsolatedDatabaseUrl(dbUrl, ref) {
  let url;
  try { url = new URL(dbUrl); } catch { throw Error('Invalid recovery database URL'); }
  const text = decodeURIComponent(url.username) + '@' + url.hostname;
  if (text.includes(PRODUCTION_PROJECT_REF)) throw Error('Recovery database URL points at production');
  if (ref !== 'local' && !text.includes(ref)) throw Error('Recovery database URL does not belong to the confirmed target');
  return true;
}

/** Expected visibility per identity, from the synthetic fixture. */
export const ACCESS_EXPECTATIONS = {
  admin: { fortius_inmuebles_expedientes: 2, fortius_inmuebles_formato_emissions: 1, fortius_inmuebles_expediente_archivos: 1 },
  editor: { fortius_inmuebles_expedientes: 1, fortius_inmuebles_formato_emissions: 1, fortius_inmuebles_expediente_archivos: 0 },
  anon: { fortius_inmuebles_expedientes: 0, fortius_inmuebles_formato_emissions: 0, fortius_inmuebles_expediente_archivos: 0 },
};

/** Compare what each session sees; tables denied outright count as zero rows. */
export async function checkAccess(sessions, manifest) {
  const results = {}, failures = [];
  for (const [who, client] of Object.entries(sessions)) {
    results[who] = {};
    for (const [table, expected] of Object.entries(ACCESS_EXPECTATIONS[who])) {
      const { data, error } = await client.from(table).select('id');
      const seen = error ? 0 : data.length;
      results[who][table] = { expected, seen, denied: Boolean(error) };
      if (seen !== expected) failures.push(`${who}:${table} expected ${expected}, saw ${seen}`);
    }
    // Expediente documents are served by the server after the table check; no session
    // may download them straight from Storage.
    for (const object of manifest.objects.filter(o => !o.public)) {
      const { data, error } = await client.storage.from(object.bucket).download(object.path);
      if (!error && data) failures.push(`${who}: direct Storage download of a private object`);
    }
  }
  return { passed: failures.length === 0, results, failures };
}

async function connect(dbUrl) {
  let pg;
  try { pg = (await import('pg')).default; } catch { throw Error('The pg package is required: npm install -D pg'); }
  const client = new pg.Client({ connectionString: dbUrl, ssl: databaseSsl(dbUrl, { FORTIUS_BACKUP_DB_CA: process.env.FORTIUS_RECOVERY_DB_CA }) });
  await client.connect();
  return { query: (sql, params) => client.query(sql, params), exec: sql => client.query(sql), close: () => client.end() };
}

export async function main(args = process.argv.slice(2)) {
  const arg = name => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const env = process.env, url = env.FORTIUS_RECOVERY_SUPABASE_URL;
  const anonKey = env.FORTIUS_RECOVERY_ANON_KEY, serviceKey = env.FORTIUS_RECOVERY_SERVICE_ROLE_KEY, dbUrl = env.FORTIUS_RECOVERY_DB_URL;
  if (!url || !anonKey || !serviceKey || !dbUrl) throw Error('Recovery environment incomplete: URL, anon key, service key and DB URL are required');
  const ref = assertIsolatedTarget({ targetUrl: url, sourceUrl: env.NEXT_PUBLIC_SUPABASE_URL, confirmTarget: arg('--confirm-target') });
  assertIsolatedDatabaseUrl(dbUrl, ref);
  const runDir = resolve('tmp/rec01', `ensayo-${ref}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  await mkdir(runDir, { recursive: true });
  const timings = {}, report = { format: 'fortius-recovery-rehearsal-v1', targetRef: ref, startedAt: new Date().toISOString(), productionWrites: 0, timings };
  const step = async (name, fn) => { const t = Date.now(); try { return await fn(); } finally { timings[name] = Date.now() - t; } };
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const service = createClient(url, serviceKey, options);
  const db = await connect(dbUrl);
  try {
    report.migrations = await step('migrations', async () => {
      const existing = (await db.query("select count(*)::int n from pg_tables where schemaname='public' and tablename like any(array['fortius_inmuebles_%','mnt_%','cota_%'])")).rows[0].n;
      if (existing) throw Error('Target already has application tables; use a fresh project');
      const dir = new URL('../supabase/migrations/', import.meta.url);
      const files = (await readdir(dir)).filter(n => n.endsWith('.sql')).sort();
      for (const file of files) {
        try { await db.exec(await readFile(new URL(file, dir), 'utf8')); } catch (error) { throw Error(`Migration failed: ${file}: ${error.message}`); }
      }
      return { applied: files.length };
    });
    const backupDir = arg('--backup') ? resolve(arg('--backup')) : resolve(runDir, 'backup-sintetico');
    if (!arg('--backup')) await step('syntheticBackup', () => buildSyntheticBackup(backupDir));
    const manifest = await verifyBackup(backupDir);
    const owner = ownerExport(JSON.parse(await readFile(resolve(backupDir, manifest.database.file), 'utf8')));
    report.backup = { dir: backupDir, synthetic: Boolean(manifest.synthetic), objects: manifest.objects.length };
    const passwords = {};
    report.auth = await step('auth', async () => {
      if (!manifest.synthetic) return { created: 0, note: 'Non-synthetic backup: accounts must be created by the provider procedure' };
      for (const who of ['admin', 'editor']) {
        passwords[who] = randomBytes(18).toString('base64url'); // kept in memory only
        const { error } = await service.auth.admin.createUser({ id: SYNTHETIC[who].id, email: SYNTHETIC[who].email, password: passwords[who], email_confirm: true });
        if (error) throw Error(`Synthetic account creation failed (${who}): ${error.message}`);
      }
      return { created: 2, emailsSent: 0 };
    });
    report.database = await step('database', () => restoreCurrentInto(db, owner, { target: 'service' }));
    report.storage = await step('storage', () => restoreStorageToService(backupDir, service, { anonClient: createClient(url, anonKey, options), targetRef: ref }));
    if (manifest.synthetic) {
      report.access = await step('access', async () => {
        const sessions = { anon: createClient(url, anonKey, options) };
        for (const who of ['admin', 'editor']) {
          const client = createClient(url, anonKey, options);
          const { error } = await client.auth.signInWithPassword({ email: SYNTHETIC[who].email, password: passwords[who] });
          if (error) throw Error(`Synthetic sign-in failed (${who})`);
          sessions[who] = client;
        }
        return checkAccess(sessions, manifest);
      });
    }
    report.passed = Boolean(report.database?.passed && report.storage?.passed && (report.access?.passed ?? true));
  } catch (error) {
    report.passed = false;
    report.error = error.message;
  } finally {
    await db.close();
    report.completedAt = new Date().toISOString();
    timings.total = Date.parse(report.completedAt) - Date.parse(report.startedAt);
    await writeFile(resolve(runDir, 'informe.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  }
  console.log(JSON.stringify({ passed: report.passed, targetRef: ref, error: report.error, timings, access: report.access?.failures, report: resolve(runDir, 'informe.json') }));
  if (!report.passed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
