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

// Fixed names for the panel's synthetic files, so their paths are stable between runs.
export const SYNTHETIC_PANEL = {
  consulta: '5e000000-0000-4000-8000-000000000030',
  carga: '5e000000-0000-4000-8000-000000000031',
  cargaDescartada: '5e000000-0000-4000-8000-000000000032',
  foto: '5e000000-0000-4000-8000-000000000033',
  medio: '5e000000-0000-4000-8000-000000000034',
};

// Seeds every table of the panel (schema v6) through its real functions and tables, as the given
// director. Returns the synthetic files the rows point to, with the bucket each one lives in.
// Only for in-memory rehearsal databases: it sets the request identity on the connection.
export async function seedPanel(db, adminId) {
  const ids = SYNTHETIC_PANEL;
  const q = async (sql, params = []) => (await db.query(sql, params)).rows;
  const one = async (sql, params) => (await q(sql, params))[0];
  const files = [];
  const file = (bucket, path, label, mime) => {
    const bytes = mime === 'application/pdf' ? pdf(label) : Buffer.from(`Ensayo del panel (${mime}): ${label}. Sin datos reales.`);
    files.push({ bucket, path, bytes, mime });
    return { bytes, sha: sha256(bytes) };
  };
  await q("select set_config('request.jwt.claim.sub',$1,false)", [adminId]);
  // A call captured live, with a file sent during the call and another one discarded.
  const consulta = await one(`insert into public.fortius_inmuebles_consultas(id,quien_nombre,que_pasa,otras_personas,documentos_pedir,responsable_id,es_ejemplo)
    values ($1,'Persona de ensayo','Quiere vender una casa heredada (ensayo).','[{"nombre":"Heredera de ensayo","papel":"heredero"}]',
    '[{"nombre":"Escritura","grupo":"inmueble"},{"nombre":"Identificación"}]',$2,true) returning id,version`, [ids.consulta, adminId]);
  const carga = `consultas/${consulta.id}/${ids.carga}.pdf`, cargaFile = file('fortius-inmuebles-expedientes', carga, 'identificacion enviada en la consulta', 'application/pdf');
  const descartada = `consultas/${consulta.id}/${ids.cargaDescartada}.pdf`, descartadaFile = file('fortius-inmuebles-expedientes', descartada, 'archivo descartado', 'application/pdf');
  await q(`insert into public.fortius_inmuebles_cargas_por_acomodar(usuario_id,consulta_id,path,nombre_original,mime,byte_length,sha256,estado) values
    ($1,$2,$3,'identificacion.pdf','application/pdf',$4,$5,'por_acomodar'),($1,$2,$6,'repetido.pdf','application/pdf',$7,$8,'descartado')`,
  [adminId, consulta.id, carga, cargaFile.bytes.length, cargaFile.sha, descartada, descartadaFile.bytes.length, descartadaFile.sha]);
  // Opening the matter creates people, matter, sections, property, documents (with the call's file), plan, tasks, folios and history.
  const abierto = (await one(`select public.fortius_inmuebles_abrir_asunto_desde_consulta($1,$2,'Asunto de ensayo','{revisar,comercializar}',
    '{inmueble,interesados,situacion,documentos,opinion,honorarios}','propietario','{"nombre":"Casa de ensayo","tipo":"casa","operacion":"venta"}'::jsonb,
    '[{"nombre":"Revisar","tareas":[{"titulo":"Pedir la escritura","quien":"cliente","dias":3}]}]'::jsonb) r`, [consulta.id, consulta.version])).r;
  const asunto = abierto.id, persona = abierto.persona_id, inmueble = abierto.inmueble_id;
  const heredera = (await one(`select persona_id from public.fortius_inmuebles_asunto_personas where asunto_id=$1 and papel='heredero'`, [asunto])).persona_id;
  await q(`insert into public.fortius_inmuebles_persona_datos_legales(persona_id,nombre_completo,estado_civil) values ($1,'Persona de ensayo completa','soltero')`, [persona]);
  const duplicada = (await one(`insert into public.fortius_inmuebles_personas(nombre,responsable_id,es_ejemplo) values ('Persona de ensayo (repetida)',$1,true) returning id`, [adminId])).id;
  await q('select public.fortius_inmuebles_unir_personas($1,$2)', [duplicada, persona]);
  await q('insert into public.fortius_inmuebles_asunto_miembros(asunto_id,usuario_id,porcentaje) values ($1,$2,50)', [asunto, adminId]);
  const biblioteca = (await one(`insert into public.fortius_inmuebles_biblioteca(clase,nombre,descripcion,es_ejemplo) values ('que_hacer','Guía de ensayo','Solo para el ensayo',true) returning id`)).id;
  await q(`insert into public.fortius_inmuebles_plan_etapas(asunto_id,nombre,orden,biblioteca_id,biblioteca_version) values ($1,'Etapa de la guía',2,$2,1)`, [asunto, biblioteca]);
  // An own section in gallery view, with a photo in the private bucket.
  const propio = (await one(`insert into public.fortius_inmuebles_apartados(asunto_id,clave,nombre,vista,orden) values ($1,'propio','Fotos de la visita','galeria',80) returning id`, [asunto])).id;
  const foto = `asuntos/${asunto}/${ids.foto}.jpg`;
  file('fortius-inmuebles-expedientes', foto, 'foto de la visita', 'image/jpeg');
  await q(`insert into public.fortius_inmuebles_apartado_filas(apartado_id,asunto_id,datos,foto_path) values ($1,$2,'{"texto":"Fachada"}',$3),($1,$2,'{"texto":"Sin foto"}',null)`, [propio, asunto, foto]);
  // A photo uploaded to the public bucket and a linked video that has no file.
  const medio = `panel/inmuebles/${inmueble}/${ids.medio}.jpg`, medioFile = file('fortius-inmuebles-public', medio, 'foto publica del inmueble', 'image/jpeg');
  await q(`insert into public.fortius_inmuebles_inmueble_medios(inmueble_id,tipo,url,path,nombre,mime,byte_length,alt) values
    ($1,'foto',$2,$3,'fachada.jpg','image/jpeg',$4,'Fachada'),($1,'video','https://video.ensayo.test/casa',null,null,null,null,null)`,
  [inmueble, 'https://ensayo.supabase.test/storage/v1/object/public/fortius-inmuebles-public/' + medio, medio, medioFile.bytes.length]);
  const { version } = await one('select version from public.fortius_inmuebles_inmuebles where id=$1', [inmueble]);
  await q(`update public.fortius_inmuebles_inmuebles set precio=2500000,moneda='MXN',version=$2 where id=$1`, [inmueble, version]);
  await q(`insert into public.fortius_inmuebles_inmueble_datos_legales(inmueble_id,folio_real,clave_catastral) values ($1,'FR-ENSAYO','CC-ENSAYO')`, [inmueble]);
  const interesado = (await one(`insert into public.fortius_inmuebles_interesados(asunto_id,persona_id,nota) values ($1,$2,'Interesada de ensayo') returning id`, [asunto, heredera])).id;
  await q('insert into public.fortius_inmuebles_interesado_inmuebles(interesado_id,inmueble_id,asunto_id) values ($1,$2,$3)', [interesado, inmueble, asunto]);
  await q('insert into public.fortius_inmuebles_ofertas(interesado_id,asunto_id,inmueble_id,monto) values ($1,$2,$3,2300000)', [interesado, asunto, inmueble]);
  await q(`insert into public.fortius_inmuebles_solicitudes(lead_id,nombre,mensaje,inmueble_id,asunto_id,persona_id,interesado_id,asignada_a,es_ejemplo) values
    ('ensayo-lead-1','Solicitud de ensayo','Me interesa (ensayo)',$1,$2,$3,$4,$5,true)`, [inmueble, asunto, heredera, interesado, adminId]);
  const tarea = (await one('select id from public.fortius_inmuebles_tareas where asunto_id=$1 limit 1', [asunto])).id;
  await q(`insert into public.fortius_inmuebles_situacion_puntos(asunto_id,clase,texto,tarea_id) values ($1,'por_averiguar','¿Hay testamento?',$2)`, [asunto, tarea]);
  const opinion = (await one(`insert into public.fortius_inmuebles_opiniones(asunto_id,analisis) values ($1,'Análisis de ensayo') returning id`, [asunto])).id;
  await q(`insert into public.fortius_inmuebles_opinion_puntos(opinion_id,asunto_id,texto,tarea_id) values ($1,$2,'Tramitar la sucesión',$3)`, [opinion, asunto, tarea]);
  const presupuesto = (await one('insert into public.fortius_inmuebles_presupuestos(asunto_id,paga_persona_id) values ($1,$2) returning id', [asunto, persona])).id;
  const concepto = (await one(`insert into public.fortius_inmuebles_presupuesto_conceptos(presupuesto_id,asunto_id,concepto,monto,inmueble_id) values ($1,$2,'Honorarios de ensayo',15000,$3) returning id`, [presupuesto, asunto, inmueble])).id;
  await q('insert into public.fortius_inmuebles_cobros(asunto_id,concepto_id,paga_persona_id,monto) values ($1,$2,$3,5000)', [asunto, concepto, persona]);
  await q(`insert into public.fortius_inmuebles_ligas_cliente(asunto_id,token_hash,expira_el) values ($1,$2,now()+interval '7 days')`, [asunto, sha256('liga de ensayo')]);
  await q(`insert into public.fortius_inmuebles_trabajos(asunto_id,clase,tipo,nombre,persona_id,inmueble_id) values ($1,'herramienta','credito','Cálculo de ensayo',$2,$3)`, [asunto, persona, inmueble]);
  await q(`select public.fortius_inmuebles_anotar_historial('asunto',$1::text,$1::uuid,'nota','Anotación de ensayo')`, [asunto]);
  return { asunto, persona, inmueble, consulta: consulta.id, files };
}

export async function buildSyntheticBackup(target) {
  const root = resolve(target);
  await mkdir(dirname(root), { recursive: true });
  await mkdir(root); // refuses an existing destination
  const s = SYNTHETIC;
  const emissionBytes = pdf('emision formato 18'), clientBytes = pdf('documento del cliente');
  const emissionPath = `${s.expedienteOwn}/${s.emission}.pdf`, clientPath = `${s.expedienteOther}/cliente/${s.clientFile}.pdf`;
  const db = await createRehearsalDatabase();
  let owner, buckets, panel;
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
    panel = await seedPanel(db, s.admin.id);
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
  const objects = [['fortius-inmuebles-expedientes', emissionPath, emissionBytes, 'application/pdf'], ['fortius-inmuebles-expedientes', clientPath, clientBytes, 'application/pdf'],
    ...panel.files.map(f => [f.bucket, f.path, f.bytes, f.mime])];
  for (const [bucket, path, bytes, mime] of objects) {
    const entry = await save(`objects/${String(manifest.objects.length + 1).padStart(8, '0')}.bin`, bytes);
    manifest.objects.push({ ...entry, bucket, path, mime, public: buckets.find(b => b.id === bucket).public });
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
