import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as backupTools from '../../tools/fortius-inmuebles-backup.mjs';
import { assertIsolatedTarget, planStorageRestore, restoreStorageToService, PRODUCTION_PROJECT_REF } from '../../tools/fortius-inmuebles-restore-storage.mjs';

const ISOLATED = 'abcdefghijklmnopqrst';

// In-memory stand-in for the supabase-js Storage API surface the tool uses.
function fakeStorage({ buckets = [], corrupt = null, failUpload = null, anonReadable = false } = {}) {
  const state = { buckets: new Map(buckets.map(b => [b.id, { ...b }])), objects: new Map(), writes: 0 };
  const key = (bucket, path) => bucket + '\u0000' + path;
  const storage = {
    listBuckets: async () => ({ data: [...state.buckets.values()], error: null }),
    getBucket: async id => (state.buckets.has(id) ? { data: state.buckets.get(id), error: null } : { data: null, error: { message: 'not found' } }),
    createBucket: async (id, o) => { state.writes++; state.buckets.set(id, { id, public: o.public, file_size_limit: o.fileSizeLimit, allowed_mime_types: o.allowedMimeTypes }); return { data: { name: id }, error: null }; },
    updateBucket: async (id, o) => { state.writes++; Object.assign(state.buckets.get(id), { public: o.public, file_size_limit: o.fileSizeLimit, allowed_mime_types: o.allowedMimeTypes }); return { data: {}, error: null }; },
    from: bucket => ({
      list: async () => ({ data: [...state.objects.keys()].filter(k => k.startsWith(bucket + '\u0000')).map(k => ({ name: k })), error: null }),
      upload: async (path, bytes, o) => {
        if (failUpload === path) return { data: null, error: { message: 'denied' } };
        if (!state.buckets.has(bucket)) return { data: null, error: { message: 'no bucket' } };
        if (state.objects.has(key(bucket, path)) && !o.upsert) return { data: null, error: { message: 'exists' } };
        state.writes++;
        const stored = Buffer.from(bytes);
        if (corrupt === path) stored[0] ^= 1;
        state.objects.set(key(bucket, path), stored);
        return { data: { path }, error: null };
      },
      download: async path => {
        const bytes = state.objects.get(key(bucket, path));
        return bytes ? { data: new Blob([bytes]), error: null } : { data: null, error: { message: 'not found' } };
      },
    }),
  };
  const anon = { storage: { from: bucket => ({ download: async path => {
    const bytes = state.objects.get(key(bucket, path));
    if (!anonReadable || !bytes) return { data: null, error: { message: 'denied' } };
    return { data: new Blob([bytes]), error: null };
  } }) } };
  return { client: { storage }, anon, state };
}

async function backupFixture() {
  const parent = await mkdtemp(join(tmpdir(), 'fortius-storage-restore-'));
  const root = join(parent, 'backup');
  await mkdir(root);
  const manifest = { format: 'mnt-backup-v1', prefix: 'fortius_inmuebles', files: [], objects: [], database: { complete: false },
    buckets: [
      { id: 'fortius-inmuebles-expedientes', public: false, file_size_limit: 20971520, allowed_mime_types: ['application/pdf'] },
      { id: 'fortius-inmuebles-public', public: true, file_size_limit: 20971520, allowed_mime_types: ['image/webp'] },
    ] };
  for (const [bucket, path, mime] of [
    ['fortius-inmuebles-expedientes', 'exp/emision.pdf', 'application/pdf'],
    ['fortius-inmuebles-expedientes', 'exp/firmado.pdf', 'application/pdf'],
    ['fortius-inmuebles-public', 'inmueble/foto.webp', 'image/webp'],
  ]) {
    const bytes = Buffer.from('Synthetic bytes for ' + path);
    const entry = { file: `objects/${String(manifest.objects.length + 1).padStart(8, '0')}.bin`, bytes: bytes.length, sha256: backupTools.sha256(bytes) };
    await mkdir(join(root, 'objects'), { recursive: true });
    await writeFile(join(root, entry.file), bytes);
    manifest.files.push(entry);
    manifest.objects.push({ ...entry, bucket, path, mime, public: bucket.endsWith('-public') });
  }
  await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest));
  return { root, manifest, close: () => rm(parent, { recursive: true, force: true }) };
}

test('refuses production, the source project and an unconfirmed target', () => {
  const prod = `https://${PRODUCTION_PROJECT_REF}.supabase.co`, target = `https://${ISOLATED}.supabase.co`;
  assert.throws(() => assertIsolatedTarget({ targetUrl: prod, confirmTarget: PRODUCTION_PROJECT_REF }), /production/i);
  assert.throws(() => assertIsolatedTarget({ targetUrl: target, sourceUrl: target, confirmTarget: ISOLATED }), /source project/i);
  assert.throws(() => assertIsolatedTarget({ targetUrl: target, sourceUrl: prod }), /confirm/i);
  assert.throws(() => assertIsolatedTarget({ targetUrl: target, sourceUrl: prod, confirmTarget: 'otherrefotherrefothe' }), /confirm/i);
  assert.throws(() => assertIsolatedTarget({ targetUrl: 'https://example.com', confirmTarget: 'x' }), /Supabase project/i);
  assert.equal(assertIsolatedTarget({ targetUrl: target, sourceUrl: prod, confirmTarget: ISOLATED }), ISOLATED);
  assert.equal(assertIsolatedTarget({ targetUrl: 'http://127.0.0.1:54321', sourceUrl: prod, confirmTarget: 'local' }), 'local');
});

test('plans offline and restores every object with bucket privacy, read-back hashes and timings', async () => {
  const f = await backupFixture();
  try {
    const plan = await planStorageRestore(f.root);
    assert.equal(plan.objects, 3);
    assert.deepEqual(plan.buckets.map(b => [b.id, b.objects]), [['fortius-inmuebles-expedientes', 2], ['fortius-inmuebles-public', 1]]);
    // Migrations already created the private bucket, empty and with drifted settings.
    const { client, anon, state } = fakeStorage({ buckets: [{ id: 'fortius-inmuebles-expedientes', public: true, file_size_limit: 1, allowed_mime_types: [] }] });
    let tick = 0;
    const report = await restoreStorageToService(f.root, client, { anonClient: anon, targetRef: ISOLATED, clock: () => (tick += 5) });
    assert.equal(report.passed, true);
    assert.equal(report.storageServiceRecovery, 'verified');
    assert.equal(report.privateDenial, 'verified');
    assert.equal(report.objects, 3);
    assert.deepEqual(report.buckets.map(b => b.action), ['aligned', 'created']);
    assert.equal(state.buckets.get('fortius-inmuebles-expedientes').public, false);
    assert.ok(report.durationsMs.total > 0 && report.durationsMs.upload >= 0 && report.durationsMs.readback >= 0);
    assert.ok(report.notCovered.some(item => /Auth/.test(item)));
  } finally { await f.close(); }
});

test('refuses a non-empty target bucket before writing anything', async () => {
  const f = await backupFixture();
  try {
    const { client, state } = fakeStorage({ buckets: [{ id: 'fortius-inmuebles-public', public: true }] });
    await client.storage.from('fortius-inmuebles-public').upload('ajeno.webp', Buffer.from('x'), { upsert: false });
    const before = state.writes;
    await assert.rejects(restoreStorageToService(f.root, client), /not empty/i);
    assert.equal(state.writes, before);
  } finally { await f.close(); }
});

test('fails when a restored object differs, an upload is denied or a private object is readable anonymously', async () => {
  const f = await backupFixture();
  try {
    await assert.rejects(restoreStorageToService(f.root, fakeStorage({ corrupt: 'exp/firmado.pdf' }).client), /differ/i);
    await assert.rejects(restoreStorageToService(f.root, fakeStorage({ failUpload: 'exp/emision.pdf' }).client), /upload failed/i);
    const leaky = fakeStorage({ anonReadable: true });
    await assert.rejects(restoreStorageToService(f.root, leaky.client, { anonClient: leaky.anon }), /anonymous access/i);
  } finally { await f.close(); }
});

test('does not touch the target when the backup fails verification', async () => {
  const f = await backupFixture();
  try {
    await writeFile(join(f.root, f.manifest.objects[0].file), 'tampered');
    const { client, state } = fakeStorage();
    await assert.rejects(restoreStorageToService(f.root, client), /integrity/i);
    assert.equal(state.writes, 0);
  } finally { await f.close(); }
});
