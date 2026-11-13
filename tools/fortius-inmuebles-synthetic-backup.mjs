// REC-01: build a complete, verifiable SYNTHETIC backup for recovery rehearsals.
// No network and no credentials: the data is seeded into an in-memory PostgreSQL with
// the repository migrations, exported with the owner export SQL, and paired with
// synthetic object bytes whose fingerprints match the database rows.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRehearsalDatabase } from './fortius-inmuebles-restore-current.mjs';
import { currentSchemaVersion, ownerSchemaVersion, sha256, verifyBackup } from './fortius-inmuebles-backup.mjs';

// Fixed synthetic identities so the rehearsal can recreate them in the target Auth.
export const SYNTHETIC = {
  admin: { id: '5e000000-0000-4000-8000-000000000001', email: 'admin.ensayo@fortius.test', role: 'admin' },
  editor: { id: '5e000000-0000-4000-8000-000000000002', email: 'asesor.ensayo@fortius.test', role: 'editor', asesorId: 'ensayo-asesor-a' },
  expedienteOwn: '5e000000-0000-4000-8000-000000000010',
  expedienteOther: '5e000000-0000-4000-8000-000000000020',
  draft: '5e000000-0000-4000-8000-000000000011',
  emission: '5e000000-0000-4000-8000-000000000012',
  clientFile: '5e000000-0000-4000-8000-000000000021',
};

const pdf = label => Buffer.from(`%PDF-1.4\n% Ensayo de recuperacion Fortius: ${label}. Documento sintetico, sin datos reales.\n%%EOF\n`);

export async function buildSyntheticBackup(target) {
  const root = resolve(target);
  await mkdir(dirname(root), { recursive: true });
  await mkdir(root); // refuses an existing destination
  const s = SYNTHETIC;
  const emissionBytes = pdf('emision formato 18'), clientBytes = pdf('documento del cliente');
  const emissionPath = `${s.expedienteOwn}/${s.emission}.pdf`, clientPath = `${s.expedienteOther}/cliente/${s.clientFile}.pdf`;
  const db = await createRehearsalDatabase();
  let owner, buckets;
  try {
    await db.query('insert into auth.users(id) values ($1),($2)', [s.admin.id, s.editor.id]);
    await db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'admin'),($2,'editor')", [s.admin.id, s.editor.id]);
    await db.query(`insert into public.fortius_inmuebles_records(collection,id,data) values
      ('asesores',$1,$2::jsonb),('asesores','ensayo-asesor-b',$3::jsonb),
      ('clientes','ensayo-cliente-a',$4::jsonb),('clientes','ensayo-cliente-b',$5::jsonb)`, [
      s.editor.asesorId,
      JSON.stringify({ id: s.editor.asesorId, nombre: 'Asesor de ensayo A', cargo: 'Asesor', iniciales: 'EA', activo: true }),
      JSON.stringify({ id: 'ensayo-asesor-b', nombre: 'Asesor de ensayo B', cargo: 'Asesor', iniciales: 'EB', activo: true }),
      JSON.stringify({ id: 'ensayo-cliente-a', nombre: 'Cliente de ensayo A', telefono: '6640000001', tipo: 'propietario', asesorId: s.editor.asesorId, notas: '', creadoEl: '2026-11-12', actualizadoEl: '2026-11-12' }),
      JSON.stringify({ id: 'ensayo-cliente-b', nombre: 'Cliente de ensayo B', telefono: '6640000002', tipo: 'propietario', asesorId: 'ensayo-asesor-b', notas: '', creadoEl: '2026-11-12', actualizadoEl: '2026-11-12' }),
    ]);
    await db.query('insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ($1,$2)', [s.editor.id, s.editor.asesorId]);
    await db.query(`insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values
      ($1,'ensayo-cliente-a',$2,'ENSAYO-A'),($3,'ensayo-cliente-b','ensayo-asesor-b','ENSAYO-B')`, [s.expedienteOwn, s.editor.asesorId, s.expedienteOther]);
    await db.query("insert into public.fortius_inmuebles_formato_drafts(id,expediente_id,formato_id,data) values ($1,$2,'18','{}')", [s.draft, s.expedienteOwn]);
    await db.query("insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by) values ($1,'nota','Nota de ensayo',$2)", [s.expedienteOwn, s.admin.id]);
    await db.query(`insert into public.fortius_inmuebles_formato_emissions(id,draft_id,snapshot,sha256,path,created_by)
      values ($1,$2,'{"documento":"Ensayo"}',$3,$4,$5)`, [s.emission, s.draft, sha256(emissionBytes), emissionPath, s.admin.id]);
    await db.query(`insert into public.fortius_inmuebles_expediente_archivos(id,expediente_id,titulo,nombre_original,mime,byte_length,sha256,path,uploaded_by)
      values ($1,$2,'Identificación de ensayo','identificacion.pdf','application/pdf',$3,$4,$5,$6)`,
    [s.clientFile, s.expedienteOther, clientBytes.length, sha256(clientBytes), clientPath, s.admin.id]);
    await db.exec('select public.fortius_inmuebles_sync_references(collection,id,data) from public.fortius_inmuebles_records');
    const sql = await readFile(new URL('./fortius-inmuebles-owner-export.sql', import.meta.url), 'utf8');
    owner = (await db.query(sql)).rows[0].backup;
    // Migrations still create the historical mnt-* buckets; production renamed them with
    // tools/fortius-inmuebles-storage-identity.mjs. Mirror that mapping, as production has it.
    buckets = (await db.query(`select case when id like 'mnt-%' then 'fortius-inmuebles-'||substr(id,5) else id end as id,
      public,file_size_limit,allowed_mime_types from storage.buckets where id like 'mnt-%' or id='fortius-app-integrations' order by 1`)).rows
      .map(bucket => ({ ...bucket, name: bucket.id }));
  } finally { await db.close(); }
  if (typeof owner === 'string') owner = JSON.parse(owner);
  if (ownerSchemaVersion(owner) !== currentSchemaVersion) throw Error('Synthetic export is not the current schema');
  const manifest = { format: 'mnt-backup-v1', prefix: 'fortius_inmuebles', synthetic: true, startedAt: new Date().toISOString(), files: [], objects: [], buckets, database: { complete: false } };
  const save = async (file, bytes) => {
    const path = resolve(root, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, { flag: 'wx' });
    const entry = { file, bytes: bytes.length, sha256: sha256(bytes) };
    manifest.files.push(entry);
    return entry;
  };
  const dbEntry = await save('database-owner.json', Buffer.from(JSON.stringify(owner, null, 2)));
  manifest.database = { complete: true, file: dbEntry.file, schemaVersion: ownerSchemaVersion(owner), counts: Object.fromEntries(Object.entries(owner.tables).map(([name, rows]) => [name, rows.length])) };
  for (const [bucket, path, bytes] of [['fortius-inmuebles-expedientes', emissionPath, emissionBytes], ['fortius-inmuebles-expedientes', clientPath, clientBytes]]) {
    const entry = await save(`objects/${String(manifest.objects.length + 1).padStart(8, '0')}.bin`, bytes);
    manifest.objects.push({ ...entry, bucket, path, mime: 'application/pdf', public: buckets.find(b => b.id === bucket).public });
  }
  await save('buckets.json', Buffer.from(JSON.stringify(buckets, null, 2)));
  manifest.completedAt = new Date().toISOString();
  manifest.counts = { buckets: buckets.length, objects: manifest.objects.length, bytes: manifest.objects.reduce((n, o) => n + o.bytes, 0) };
  await writeFile(resolve(root, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  await verifyBackup(root);
  return { backup: root, synthetic: true, ...manifest.counts, tables: Object.keys(owner.tables).length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const target = process.argv[2];
  if (!target) { console.error('Usage: node tools/fortius-inmuebles-synthetic-backup.mjs NEW_BACKUP_DIR'); process.exitCode = 1; }
  else buildSyntheticBackup(target).then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
}
