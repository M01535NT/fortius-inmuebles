import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSyntheticBackup, SYNTHETIC } from '../../tools/fortius-inmuebles-synthetic-backup.mjs';
import { verifyBackup } from '../../tools/fortius-inmuebles-backup.mjs';
import { rehearseCurrent } from '../../tools/fortius-inmuebles-restore-current.mjs';
import { planStorageRestore } from '../../tools/fortius-inmuebles-restore-storage.mjs';

test('builds a complete current synthetic backup that verifies, rehearses and plans a Storage restore', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'fortius-synthetic-'));
  try {
    const root = join(parent, 'backup');
    const result = await buildSyntheticBackup(root);
    assert.equal(result.tables, 30);
    const manifest = await verifyBackup(root);
    assert.equal(manifest.synthetic, true);
    assert.equal(manifest.database.schemaVersion, 4);
    // Production bucket identities, not the historical mnt-* names the migrations create.
    assert.ok(manifest.buckets.every(b => b.id.startsWith('fortius-')));
    assert.equal(manifest.buckets.find(b => b.id === 'fortius-inmuebles-public').public, true);
    const owner = JSON.parse(await readFile(join(root, manifest.database.file), 'utf8'));
    assert.deepEqual(owner.tables.fortius_inmuebles_staff.map(s => s.user_id).sort(), [SYNTHETIC.admin.id, SYNTHETIC.editor.id]);
    const rehearsal = await rehearseCurrent(owner);
    assert.equal(rehearsal.passed, true);
    assert.equal(rehearsal.tables.expediente_archivos.rows, 1);
    const plan = await planStorageRestore(root);
    assert.equal(plan.objects, 2);
    await assert.rejects(buildSyntheticBackup(root), /EEXIST/);
  } finally { await rm(parent, { recursive: true, force: true }); }
});
