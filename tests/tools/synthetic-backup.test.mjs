import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSyntheticBackup, SYNTHETIC, SYNTHETIC_PANEL } from '../../tools/fortius-inmuebles-synthetic-backup.mjs';
import { directorySuffixes, panelSuffixes, verifyBackup } from '../../tools/fortius-inmuebles-backup.mjs';
import { createRehearsalDatabase, rehearseCurrent, restoreCurrentInto } from '../../tools/fortius-inmuebles-restore-current.mjs';
import { planStorageRestore } from '../../tools/fortius-inmuebles-restore-storage.mjs';

test('builds a complete current synthetic backup that verifies, rehearses and plans a Storage restore', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'fortius-synthetic-'));
  try {
    const root = join(parent, 'backup');
    const result = await buildSyntheticBackup(root);
    assert.equal(result.tables, 68);
    const manifest = await verifyBackup(root);
    assert.equal(manifest.synthetic, true);
    assert.equal(manifest.database.schemaVersion, 7);
    // Production bucket identities, not the historical mnt-* names the migrations create.
    assert.ok(manifest.buckets.every(b => b.id.startsWith('fortius-')));
    assert.equal(manifest.buckets.find(b => b.id === 'fortius-inmuebles-public').public, true);
    const owner = JSON.parse(await readFile(join(root, manifest.database.file), 'utf8'));
    assert.deepEqual(owner.tables.fortius_inmuebles_staff.map(s => s.user_id).sort(), [SYNTHETIC.admin.id, SYNTHETIC.editor.id]);
    const rehearsal = await rehearseCurrent(owner);
    assert.equal(rehearsal.passed, true);
    assert.equal(rehearsal.tables.expediente_archivos.rows, 1);
    // Every panel table carries synthetic rows, written through the panel's own functions.
    for (const name of [...panelSuffixes, ...directorySuffixes]) assert.ok(manifest.database.counts['fortius_inmuebles_' + name] > 0, name);
    assert.equal(rehearsal.tables.documento_archivos.rows, 1);
    assert.equal(rehearsal.tables.cargas_por_acomodar.rows, 2);
    // The call's file, the discarded one, the section photo (private) and the property photo (public).
    const panelObjects = manifest.objects.filter(o => o.path.startsWith('consultas/') || o.path.startsWith('asuntos/') || o.path.startsWith('panel/'));
    assert.equal(panelObjects.length, 4);
    assert.ok(panelObjects.some(o => o.path.endsWith(SYNTHETIC_PANEL.carga + '.pdf') && !o.public));
    assert.ok(panelObjects.some(o => o.bucket === 'fortius-inmuebles-public' && o.public && o.path.endsWith(SYNTHETIC_PANEL.medio + '.jpg')));
    const plan = await planStorageRestore(root);
    assert.equal(plan.objects, 6);
    await assert.rejects(buildSyntheticBackup(root), /EEXIST/);
  } finally { await rm(parent, { recursive: true, force: true }); }
});

test('service mode loads into a migrated empty database only when its Auth accounts exist, and never merges', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'fortius-synthetic-service-'));
  const db = await createRehearsalDatabase();
  try {
    const root = join(parent, 'backup');
    await buildSyntheticBackup(root);
    const manifest = await verifyBackup(root);
    const owner = JSON.parse(await readFile(join(root, manifest.database.file), 'utf8'));
    await assert.rejects(restoreCurrentInto(db, owner, { target: 'service' }), /Auth accounts.*2 missing/);
    await db.query('insert into auth.users(id) values ($1),($2)', [SYNTHETIC.admin.id, SYNTHETIC.editor.id]);
    const result = await restoreCurrentInto(db, owner, { target: 'service' });
    assert.equal(result.passed, true);
    assert.equal(result.target, 'service');
    // The freshly migrated target only had the Biblioteca starter guides; the backup's copy replaced them.
    assert.equal(result.starterRowsReplaced, 16);
    // The migrations' lists were replaced by the backup's copy, which carries a value the director added.
    assert.ok(result.listRowsReplaced > 0);
    assert.equal(result.tables.catalogo_valores.rows, owner.tables.fortius_inmuebles_catalogo_valores.length);
    assert.equal(result.tables.biblioteca.rows, owner.tables.fortius_inmuebles_biblioteca.length);
    assert.equal((await db.query('select count(*)::int n from public.fortius_inmuebles_expedientes')).rows[0].n, 2);
    await assert.rejects(restoreCurrentInto(db, owner, { target: 'service' }), /not empty/);
    await assert.rejects(restoreCurrentInto(db, owner, { target: 'production' }), /Unknown restore target/);
  } finally { await db.close(); await rm(parent, { recursive: true, force: true }); }
});
