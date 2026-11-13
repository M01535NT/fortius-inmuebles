// REC-01: run the owner export (tools/fortius-inmuebles-owner-export.sql) over a direct
// Postgres connection, inside one READ ONLY, REPEATABLE READ transaction, so every table
// comes from the same snapshot. It never writes to the database.
//   FORTIUS_BACKUP_DB_URL=... node tools/fortius-inmuebles-owner-export.mjs OUTPUT.json
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ownerExport, ownerSchemaVersion } from './fortius-inmuebles-backup.mjs';

/** Versions of the migration files in the repository (the prefix before the first «_»). */
export async function repositoryMigrations(dir = new URL('../supabase/migrations/', import.meta.url)) {
  return (await readdir(dir)).filter(name => name.endsWith('.sql')).map(name => name.split('_')[0]).sort();
}

/**
 * REC-01 (13/11/2026): the restore rehearsal rebuilds the schema from the repository migrations, so
 * a snapshot taken while Supabase is still applying the migrations of a fresh merge (or from a base
 * with migrations the code does not know) fails later with a confusing difference. Compare first,
 * inside the same snapshot. Without supabase_migrations (local copies) there is nothing to compare.
 */
export async function checkMigrations(db, expected) {
  const exists = (await db.query("select to_regclass('supabase_migrations.schema_migrations') is not null as ok")).rows[0].ok;
  if (!exists) return { checked: false };
  const applied = new Set((await db.query('select version from supabase_migrations.schema_migrations')).rows.map(row => String(row.version)));
  const missing = expected.filter(version => !applied.has(version)), wanted = new Set(expected);
  const unknown = [...applied].filter(version => !wanted.has(version)).sort();
  if (missing.length) throw Error(`La base todavía no tiene ${missing.length} migración(es) del código (la primera: ${missing[0]}). Si acaba de integrarse un cambio en main, Supabase las está aplicando: vuelve a lanzar la copia en unos minutos.`);
  if (unknown.length) throw Error(`La base tiene ${unknown.length} migración(es) que el código no conoce (la primera: ${unknown[0]}). La copia se hace con el código de main al día.`);
  return { checked: true, migrations: expected.length };
}

/**
 * db must offer query(sql) on a single connection. Returns the validated export. With
 * options.migrations (the repository versions) the base must have exactly those migrations.
 */
export async function exportOwner(db, options = {}) {
  const sql = await readFile(new URL('./fortius-inmuebles-owner-export.sql', import.meta.url), 'utf8');
  await db.query('begin isolation level repeatable read read only');
  try {
    if (options.migrations) await checkMigrations(db, options.migrations);
    let backup = (await db.query(sql)).rows[0].backup;
    await db.query('commit');
    if (typeof backup === 'string') backup = JSON.parse(backup);
    return ownerExport(backup); // rejects missing, unexpected or partial tables
  } catch (error) {
    await db.query('rollback').catch(() => {});
    throw error;
  }
}

/**
 * TLS de la conexión. SEG-B15: con FORTIUS_BACKUP_DB_CA (el certificado raíz de Supabase en PEM) se
 * verifica el certificado del servidor y su nombre; sin él se cifra pero no se verifica, como antes.
 */
export function databaseSsl(dbUrl, env = process.env) {
  if (/127\.0\.0\.1|localhost/.test(dbUrl)) return false;
  const ca = env.FORTIUS_BACKUP_DB_CA?.trim();
  if (!ca) return { rejectUnauthorized: false };
  if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw Error('FORTIUS_BACKUP_DB_CA must be a PEM certificate');
  return { rejectUnauthorized: true, ca };
}

export async function main(args = process.argv.slice(2)) {
  const output = args[0], dbUrl = process.env.FORTIUS_BACKUP_DB_URL;
  if (!output) throw Error('Usage: FORTIUS_BACKUP_DB_URL=... node tools/fortius-inmuebles-owner-export.mjs OUTPUT.json');
  if (!dbUrl) throw Error('FORTIUS_BACKUP_DB_URL is required');
  const pg = (await import('pg')).default;
  const client = new pg.Client({ connectionString: dbUrl, ssl: databaseSsl(dbUrl) });
  await client.connect();
  if (!process.env.FORTIUS_BACKUP_DB_CA?.trim() && !/127\.0\.0\.1|localhost/.test(dbUrl)) console.warn('TLS sin verificar el certificado del servidor: falta FORTIUS_BACKUP_DB_CA');
  try {
    const backup = await exportOwner(client, { migrations: await repositoryMigrations() });
    await writeFile(resolve(output), JSON.stringify(backup), { flag: 'wx', mode: 0o600 });
    const rows = Object.values(backup.tables).reduce((n, list) => n + list.length, 0);
    // Counts only: logs of a public repository must never contain data.
    console.log(JSON.stringify({ exported: true, schemaVersion: ownerSchemaVersion(backup), tables: Object.keys(backup.tables).length, rows }));
  } finally { await client.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
