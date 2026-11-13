// REC-01: restore the Storage part of a verified backup into an ISOLATED Supabase project.
// It never targets production: the target ref must differ from the production ref and from
// the source environment, and the operator must repeat it with --confirm-target.
// Order: apply the repository migrations to the isolated project first (they create the
// buckets and storage.objects policies), then run this tool, then the database rehearsal.
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readBackupFile, sha256, verifyBackup } from './fortius-inmuebles-backup.mjs';

export const PRODUCTION_PROJECT_REF = 'qkkirjzhviqwvuqjnmei';

function projectRef(url) {
  let host;
  try { host = new URL(url).hostname; } catch { throw Error('Invalid recovery target URL'); }
  if (host === '127.0.0.1' || host === 'localhost') return 'local';
  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(host);
  if (!match) throw Error('Recovery target must be a Supabase project or a local Supabase stack');
  return match[1];
}

/** Refuse any target that could be production or the environment the backup came from. */
export function assertIsolatedTarget({ targetUrl, sourceUrl, confirmTarget }) {
  const ref = projectRef(targetUrl);
  if (ref === PRODUCTION_PROJECT_REF) throw Error('Refusing to restore into the production project');
  if (sourceUrl) {
    let sourceRef = null;
    try { sourceRef = projectRef(sourceUrl); } catch { /* an unrelated source URL is not a match */ }
    if (sourceRef === ref && ref !== 'local') throw Error('Refusing to restore into the source project');
  }
  if (!confirmTarget || confirmTarget !== ref) throw Error('Confirm the isolated target with --confirm-target ' + ref);
  return ref;
}

const bucketSettings = bucket => ({
  public: bucket.public,
  fileSizeLimit: bucket.file_size_limit ?? null,
  allowedMimeTypes: bucket.allowed_mime_types ?? null,
});
const sameList = (a, b) => JSON.stringify([...(a ?? [])].sort()) === JSON.stringify([...(b ?? [])].sort());

/** Offline summary of what a restore would create; needs no credentials. */
export async function planStorageRestore(directory) {
  const manifest = await verifyBackup(directory);
  const objects = manifest.objects ?? [];
  return {
    buckets: (manifest.buckets ?? []).map(bucket => ({
      id: bucket.id, public: bucket.public,
      objects: objects.filter(object => object.bucket === bucket.id).length,
      bytes: objects.filter(object => object.bucket === bucket.id).reduce((n, o) => n + o.bytes, 0),
    })),
    objects: objects.length,
    bytes: objects.reduce((n, o) => n + o.bytes, 0),
    databaseComplete: manifest.database?.complete ?? false,
  };
}

async function bucketIsEmpty(client, id) {
  const { data, error } = await client.storage.from(id).list('', { limit: 1 });
  if (error) throw Error('Target bucket listing failed: ' + id);
  return data.length === 0;
}

/**
 * Upload every verified object into the isolated target, then read each one back and
 * compare SHA-256 and size. Existing target buckets must be empty; their settings are
 * aligned with the backup. With an anon client, private objects must be denied to it.
 */
export async function restoreStorageToService(directory, client, { anonClient = null, targetRef = 'unknown', clock = () => Date.now() } = {}) {
  const started = clock();
  const root = resolve(directory);
  const manifest = await verifyBackup(root);
  const objects = manifest.objects ?? [];
  const buckets = manifest.buckets ?? [];
  const listed = await client.storage.listBuckets();
  if (listed.error) throw Error('Target bucket listing failed');
  const existing = new Map(listed.data.map(bucket => [bucket.id, bucket]));
  const bucketReport = [];
  // Check every bucket before writing anything: a non-empty target is never merged.
  for (const bucket of buckets) {
    if (existing.has(bucket.id) && !(await bucketIsEmpty(client, bucket.id))) {
      throw Error('Target bucket is not empty: ' + bucket.id);
    }
  }
  for (const bucket of buckets) {
    const wanted = bucketSettings(bucket), current = existing.get(bucket.id);
    if (!current) {
      const { error } = await client.storage.createBucket(bucket.id, wanted);
      if (error) throw Error('Target bucket creation failed: ' + bucket.id);
      bucketReport.push({ id: bucket.id, public: bucket.public, action: 'created' });
      continue;
    }
    const drift = current.public !== wanted.public
      || (current.file_size_limit ?? null) !== wanted.fileSizeLimit
      || !sameList(current.allowed_mime_types, wanted.allowedMimeTypes);
    if (drift) {
      const { error } = await client.storage.updateBucket(bucket.id, wanted);
      if (error) throw Error('Target bucket update failed: ' + bucket.id);
    }
    bucketReport.push({ id: bucket.id, public: bucket.public, action: drift ? 'aligned' : 'reused' });
  }
  const uploadStarted = clock();
  for (const object of objects) {
    const bytes = await readBackupFile(root, object.file);
    if (bytes.length !== object.bytes || sha256(bytes) !== object.sha256) throw Error('Source object changed after verification');
    const { error } = await client.storage.from(object.bucket).upload(object.path, bytes, {
      contentType: object.mime || 'application/octet-stream', upsert: false,
    });
    if (error) throw Error('Target upload failed for object ' + object.file);
  }
  const verifyStarted = clock();
  const mismatches = [];
  for (const object of objects) {
    const { data, error } = await client.storage.from(object.bucket).download(object.path);
    if (error || !data) { mismatches.push({ file: object.file, reason: 'missing' }); continue; }
    const bytes = Buffer.from(await data.arrayBuffer());
    if (bytes.length !== object.bytes || sha256(bytes) !== object.sha256) mismatches.push({ file: object.file, reason: 'hash' });
  }
  if (mismatches.length) throw Error('Restored objects differ from the backup: ' + mismatches.length);
  for (const bucket of buckets) {
    const { data, error } = await client.storage.getBucket(bucket.id);
    if (error || !data || data.public !== bucket.public) throw Error('Restored bucket privacy differs: ' + bucket.id);
  }
  let privateDenial = 'not_checked';
  if (anonClient) {
    for (const object of objects.filter(candidate => !candidate.public)) {
      const { data, error } = await anonClient.storage.from(object.bucket).download(object.path);
      if (!error && data) throw Error('Anonymous access reached a private restored object');
    }
    privateDenial = 'verified';
  }
  const finished = clock();
  return {
    passed: true,
    targetRef,
    productionWrites: 0,
    storageServiceRecovery: 'verified',
    privateDenial,
    buckets: bucketReport,
    objects: objects.length,
    bytes: objects.reduce((n, o) => n + o.bytes, 0),
    durationsMs: { total: finished - started, upload: verifyStarted - uploadStarted, readback: finished - verifyStarted },
    notCovered: [
      'Object owner (storage.objects.owner_id) is not preserved: uploads use the recovery service role',
      'storage.objects policies come from the migrations applied to the target, not from this tool',
      'Auth users, passwords and sessions are not restored',
    ],
  };
}

export async function main(args = process.argv.slice(2)) {
  const arg = name => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const directory = args.find((value, index) => !value.startsWith('--') && !['--confirm-target'].includes(args[index - 1]));
  if (!directory) throw Error('Usage: fortius-inmuebles-restore-storage.mjs BACKUP_DIR (--plan | --confirm-target PROJECT_REF)');
  if (args.includes('--plan')) {
    console.log(JSON.stringify(await planStorageRestore(directory)));
    return;
  }
  const targetUrl = process.env.FORTIUS_RECOVERY_SUPABASE_URL, key = process.env.FORTIUS_RECOVERY_SERVICE_ROLE_KEY;
  if (!targetUrl || !key) throw Error('Recovery target environment missing: FORTIUS_RECOVERY_SUPABASE_URL and FORTIUS_RECOVERY_SERVICE_ROLE_KEY');
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && key === process.env.SUPABASE_SERVICE_ROLE_KEY) throw Error('Recovery key equals the source service key');
  const targetRef = assertIsolatedTarget({ targetUrl, sourceUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, confirmTarget: arg('--confirm-target') });
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const client = createClient(targetUrl, key, options);
  const anonKey = process.env.FORTIUS_RECOVERY_ANON_KEY;
  const anonClient = anonKey ? createClient(targetUrl, anonKey, options) : null;
  const report = await restoreStorageToService(directory, client, { anonClient, targetRef });
  const file = resolve(directory, `storage-restore-${targetRef}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ passed: report.passed, targetRef, objects: report.objects, bytes: report.bytes, privateDenial: report.privateDenial, durationsMs: report.durationsMs }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
