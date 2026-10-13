import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as backupTools from '../../tools/fortius-inmuebles-backup.mjs';

async function fixture() {
  const parent = await mkdtemp(join(tmpdir(), 'fortius-recovery-test-'));
  const root = join(parent, 'source');
  await mkdir(root);
  const bytes = Buffer.from('synthetic document bytes');
  const sha256 = backupTools.sha256(bytes);
  const owner = {
    format: 'mnt-owner-export-v1', prefix: 'fortius_inmuebles',
    tables: Object.fromEntries(backupTools.currentSuffixes.map(s => [`fortius_inmuebles_${s}`, []])),
  };
  owner.tables.fortius_inmuebles_formato_emissions = [{ path: 'dossier/emission.pdf', sha256 }];
  const dbBytes = Buffer.from(JSON.stringify(owner));
  const file = { file: 'document.bin', bytes: bytes.length, sha256 };
  const manifest = {
    format: 'mnt-backup-v1', prefix: 'fortius_inmuebles',
    files: [file, { file: 'database.json', bytes: dbBytes.length, sha256: backupTools.sha256(dbBytes) }],
    objects: [{ ...file, bucket: 'fortius-inmuebles-expedientes', path: 'dossier/emission.pdf', public: false }],
    buckets: [{ id: 'fortius-inmuebles-expedientes', public: false }],
    database: { complete: true, file: 'database.json' },
  };
  await writeFile(join(root, 'document.bin'), bytes);
  await writeFile(join(root, 'database.json'), dbBytes);
  const save = () => writeFile(join(root, 'manifest.json'), JSON.stringify(manifest));
  await save();
  return { parent, root, manifest, owner, bytes, save, close: () => rm(parent, { recursive: true, force: true }) };
}

test('rejects a complete database snapshot whose emitted document is absent from object inventory', async () => {
  const f = await fixture();
  try {
    f.manifest.objects = [];
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /referenced object missing/i);
  } finally { await f.close(); }
});

test('reconciles the document fingerprint against the database rather than just the file manifest', async () => {
  const f = await fixture();
  try {
    const changed = Buffer.from('different but internally consistent bytes');
    const entry = f.manifest.files[0];
    entry.bytes = changed.length; entry.sha256 = backupTools.sha256(changed);
    Object.assign(f.manifest.objects[0], entry);
    await writeFile(join(f.root, entry.file), changed);
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /database object fingerprint/i);
  } finally { await f.close(); }
});

test('rejects an object not covered by the hashed files list and private bucket privacy drift', async () => {
  const f = await fixture();
  try {
    const originals = structuredClone(f.manifest.files);
    f.manifest.files = f.manifest.files.filter(x => x.file !== 'document.bin');
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /object.*file inventory/i);
    f.manifest.files = originals;
    f.manifest.buckets[0].public = true;
    f.manifest.objects[0].public = true;
    await f.save();
    await assert.rejects(backupTools.verifyBackup(f.root), /private bucket/i);
  } finally { await f.close(); }
});

test('accepts reconciled bytes and copies them into a fresh isolated directory without overwriting a target', async () => {
  const f = await fixture();
  try {
    await backupTools.verifyBackup(f.root);
    assert.equal(typeof backupTools.restoreBackupObjects, 'function', 'isolated object restoration must exist');
    const target = join(f.parent, 'restored');
    const result = await backupTools.restoreBackupObjects(f.root, target);
    assert.equal(result.objects, 1);
    assert.equal(result.productionWrites, 0);
    assert.equal(result.storageServiceRecovery, 'not_checked');
    const restored = JSON.parse(await readFile(join(target, 'objects.json'), 'utf8'));
    assert.deepEqual(await readFile(join(target, restored.objects[0].file)), f.bytes);
    assert.equal(restored.objects[0].bucket, 'fortius-inmuebles-expedientes');
    await assert.rejects(backupTools.restoreBackupObjects(f.root, target), /EEXIST/);
    await assert.rejects(backupTools.restoreBackupObjects(f.root, f.root), /isolated target/i);
  } finally { await f.close(); }
});

test('rejects a file inventory filesystem link that escapes the backup even when its bytes match', async () => {
  const f = await fixture();
  try {
    await rm(join(f.root, 'document.bin'));
    if (process.platform === 'win32') {
      // Directory junctions exercise realpath escape without requiring file-symlink privileges.
      const outside = join(f.parent, 'outside');
      await mkdir(outside);
      await writeFile(join(outside, 'document.bin'), f.bytes);
      await symlink(outside, join(f.root, 'linked'), 'junction');
      f.manifest.files[0].file = 'linked/document.bin';
      f.manifest.objects[0].file = 'linked/document.bin';
      await f.save();
    } else {
      await writeFile(join(f.parent, 'outside.bin'), f.bytes);
      await symlink(join(f.parent, 'outside.bin'), join(f.root, 'document.bin'));
    }
    assert.deepEqual(await readFile(join(f.root, f.manifest.files[0].file)), f.bytes);
    await assert.rejects(backupTools.verifyBackup(f.root), /unsafe manifest path/i);
  } finally { await f.close(); }
});
