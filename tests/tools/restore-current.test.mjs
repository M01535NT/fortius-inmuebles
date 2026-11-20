import {before,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRehearsalDatabase,rehearseCurrent,restoreCurrentInto} from '../../tools/fortius-inmuebles-restore-current.mjs';
import {directorySuffixes,panelSuffixes} from '../../tools/fortius-inmuebles-backup.mjs';
import {seedPanel} from '../../tools/fortius-inmuebles-synthetic-backup.mjs';

let backup,seeded;
const panel=[...panelSuffixes];
// Schema v7: the lists (kept from the migrations when a backup predates them) and the contact history.
const v7=[...directorySuffixes];
const v7Empty=['persona_contactos'];
const adminId='51000000-0000-4000-8000-000000000001';
const apps=['app_runs','app_run_versions','app_files','app_shares','integration_jobs','integration_artifacts','integration_pages','signature_events'];
const expedienteId='51000000-0000-4000-8000-000000000010';
before(async()=>{
 const db=await createRehearsalDatabase();
 try{
  await db.exec(`insert into auth.users values ('51000000-0000-4000-8000-000000000001');
  insert into public.fortius_inmuebles_staff(user_id,role) values ('51000000-0000-4000-8000-000000000001','admin');
  insert into public.fortius_inmuebles_user_preferences(user_id,data,version) values ('51000000-0000-4000-8000-000000000001','{"densidad":"compacta","leidos":["aviso-1"]}',2);
  insert into public.fortius_inmuebles_records(collection,id,data) values
  ('asesores','a','{"id":"a","nombre":"Prueba","cargo":"Asesor","iniciales":"PP","activo":true}'),
  ('clientes','c','{"id":"c","nombre":"Sintético","telefono":"6641234567","tipo":"propietario","asesorId":"a","notas":"","creadoEl":"2026-10-10","actualizadoEl":"2026-10-10"}');
  insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('51000000-0000-4000-8000-000000000010','c','a','SYNTHETIC');
  insert into public.fortius_inmuebles_formato_drafts(id,expediente_id,formato_id,data) values ('51000000-0000-4000-8000-000000000011','51000000-0000-4000-8000-000000000010','18','{}');
  insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by) values ('51000000-0000-4000-8000-000000000010','nota','Nota sintética','51000000-0000-4000-8000-000000000001');
  insert into public.fortius_inmuebles_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ('51000000-0000-4000-8000-000000000012','51000000-0000-4000-8000-000000000011','{"documento":"Sintético"}',repeat('a',64),'51000000-0000-4000-8000-000000000010/51000000-0000-4000-8000-000000000012.pdf','51000000-0000-4000-8000-000000000001');`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",['51000000-0000-4000-8000-000000000001']);
  await db.query("select public.fortius_inmuebles_put_record('tareas','linked-task',$1::jsonb,null)",[JSON.stringify({id:'linked-task',titulo:'Revisión sintética',categoria:'documentacion',estado:'pendiente',prioridad:'normal',pasos:[],expedienteId,clienteId:'c',asesorId:'a'})]);

  await db.exec(`insert into public.fortius_inmuebles_app_runs(id,slug,title,owner_id,expediente_id,context,input,result) values
   ('52000000-0000-4000-8000-000000000001','ocr','Original sintético','51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000010','{"expedienteId":"51000000-0000-4000-8000-000000000010"}','{"storagePath":"51000000-0000-4000-8000-000000000001/52000000-0000-4000-8000-000000000003.pdf"}','{"kind":"ocr","jobId":"52000000-0000-4000-8000-000000000005"}');
   update public.fortius_inmuebles_app_runs set version=2,title='Revisión sintética',deleted_at=now() where id='52000000-0000-4000-8000-000000000001';
   insert into public.fortius_inmuebles_file_uploads(bucket,path,uploaded_by,record_id) values ('fortius-inmuebles-private','51000000-0000-4000-8000-000000000001/52000000-0000-4000-8000-000000000003.pdf','51000000-0000-4000-8000-000000000001','apps:51000000-0000-4000-8000-000000000010');
   insert into public.fortius_inmuebles_file_uploads(bucket,path,uploaded_by,record_id) values ('fortius-inmuebles-private','51000000-0000-4000-8000-000000000001/52000000-0000-4000-8000-000000000004.pdf','51000000-0000-4000-8000-000000000001','apps:51000000-0000-4000-8000-000000000010');
   insert into public.fortius_inmuebles_app_files(id,owner_id,expediente_id,name,path,mime,size_bytes,sha256) values
   ('52000000-0000-4000-8000-000000000003','51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000010','original.pdf','51000000-0000-4000-8000-000000000001/52000000-0000-4000-8000-000000000003.pdf','application/pdf',100,repeat('b',64)),
   ('52000000-0000-4000-8000-000000000004','51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000010','resultado.pdf','51000000-0000-4000-8000-000000000001/52000000-0000-4000-8000-000000000004.pdf','application/pdf',200,repeat('c',64));
   insert into public.fortius_inmuebles_app_shares(file_id,token_hash,owner_id,expires_at,revoked) values ('52000000-0000-4000-8000-000000000004',repeat('d',64),'51000000-0000-4000-8000-000000000001',now()+interval '1 day',true);
   insert into public.fortius_inmuebles_integration_jobs(id,owner_id,expediente_id,slug,idempotency_key,input_hash,state,reserved_cents,charged_cents,settled_at,pricing,result,provider_kind,provider_id,provider_status,context) values
   ('52000000-0000-4000-8000-000000000005','51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000010','ocr','53000000-0000-4000-8000-000000000001',repeat('e',64),'completed',125,121,now(),'{"fx":20,"tax":0.16}','{"pageCount":2}',null,null,null,'{"expedienteId":"51000000-0000-4000-8000-000000000010"}'),
   ('52000000-0000-4000-8000-000000000006','51000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000010','firmas','53000000-0000-4000-8000-000000000002',repeat('f',64),'reconciliation',300,null,null,'{"fx":20,"tax":0.16}','{"status":"completed"}','submission',100,'completed','{}');
   insert into public.fortius_inmuebles_integration_pages(job_id,file_name,page,text) values
   ('52000000-0000-4000-8000-000000000005','original.pdf',1,'Texto original sintético'),('52000000-0000-4000-8000-000000000005','original.pdf',2,'Segunda página sintética');
   select public.fortius_apps_correct_pages('52000000-0000-4000-8000-000000000005',1,'[{"page":1,"text":"Texto corregido sintético"}]');
   insert into public.fortius_inmuebles_integration_artifacts(job_id,kind,name,storage_path,sha256,size_bytes,mime_type) values
   ('52000000-0000-4000-8000-000000000005','original','original.pdf','52000000-0000-4000-8000-000000000005/original/hash',repeat('a',64),100,'application/pdf'),
   ('52000000-0000-4000-8000-000000000006','signed','firmado.pdf','52000000-0000-4000-8000-000000000006/signed/hash',repeat('b',64),200,'application/pdf'),
   ('52000000-0000-4000-8000-000000000006','audit','evidencia.pdf','52000000-0000-4000-8000-000000000006/audit/hash',repeat('c',64),300,'application/pdf');
   insert into public.fortius_inmuebles_signature_events(hash,job_id,event_type,event_at,processed_at) values
   (repeat('1',64),'52000000-0000-4000-8000-000000000006','submission.completed',now(),now());`);
  const interview=(await db.query("select public.fortius_inmuebles_start_intake($1,'vender',$2::jsonb,$3) r",['54000000-0000-4000-8000-000000000010',JSON.stringify({tipo:'cliente',id:'c'}),expedienteId])).rows[0].r;
  await db.query("select public.fortius_inmuebles_save_intake($1,1,$2::jsonb,true)",[interview.id,JSON.stringify({fecha:'2026-10-13',objetivo:'Objetivo de prueba',plazo:'Tres meses',zona:'Tijuana',tipoInmueble:'casa',relacion:'propietario',ocupacion:'por_aclarar',documentos:'Por aclarar',alertas:'por_aclarar',estadoCivil:'soltero',presupuestoEstado:'por_definir',privacidad:'presentado',siguienteAccion:'Revisar documentos',siguienteFecha:'2030-10-20'})]);
  await db.exec(`insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('51000000-0000-4000-8000-000000000001','a');
   insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id) values ('c','a');`);
  // Panel by matters (schema v6): every table, written through the panel's own functions and tables.
  seeded=await seedPanel(db,adminId);
  // Model the reference synchronization performed by real record writes.
  await db.exec("select public.fortius_inmuebles_sync_references(collection,id,data) from public.fortius_inmuebles_records");
  const sql=await readFile(new URL('../../tools/fortius-inmuebles-owner-export.sql',import.meta.url),'utf8');
  backup=(await db.query(sql)).rows[0].backup;
 }finally{await db.close()}
});

test('restores the current schema with history, activity and document snapshots; rejects orphan relationships',async()=>{
  const source=structuredClone(backup);
  const result=await rehearseCurrent(backup);
  assert.equal(result.passed,true);assert.equal(Object.keys(result.tables).length,68);
  assert.equal(result.tables.formato_drafts.rows,1);assert.equal(result.tables.formato_emissions.rows,1);assert.equal(result.tables.expediente_actividad.rows,4);assert.equal(result.tables.interviews.rows,1);assert.ok(result.tables.record_history.rows>0);
  const broken=structuredClone(backup);broken.tables.fortius_inmuebles_formato_drafts[0].expediente_id='51000000-0000-4000-8000-000000000099';
  await assert.rejects(rehearseCurrent(broken),/foreign key/i);
  const missingAdvisor=structuredClone(backup);
  missingAdvisor.tables.fortius_inmuebles_records.find(r=>r.collection==='clientes').data.asesorId='missing-adviser';
  await assert.rejects(rehearseCurrent(missingAdvisor),/foreign key|reference inventory/i);
  const missingInventory=structuredClone(backup);
  missingInventory.tables.fortius_inmuebles_record_references=[];
  await assert.rejects(rehearseCurrent(missingInventory),/reference inventory/i);
  assert.deepEqual(backup,source);
});

test('recomputes and checks a linked task column without mutating the owner export',async()=>{
 const source=structuredClone(backup);
 const linked=backup.tables.fortius_inmuebles_records.find(row=>row.id==='linked-task');
 assert.equal(linked.task_expediente_id,expedienteId);
 const result=await rehearseCurrent(backup);
 assert.equal(result.passed,true);assert.equal(result.tables.records.exactContentAndDates,true);
 assert.deepEqual(backup,source);
});

test('accepts an older backup without calculated columns and retains exact source JSON and dates',async()=>{
 const legacy=structuredClone(backup);
 for(const row of legacy.tables.fortius_inmuebles_records)delete row.task_expediente_id;
 const source=structuredClone(legacy);
 const result=await rehearseCurrent(legacy);
 assert.equal(result.passed,true);assert.equal(result.tables.records.exactContentAndDates,true);
 assert.deepEqual(legacy,source);
 const changedDate=structuredClone(legacy);
 changedDate.tables.fortius_inmuebles_records.find(row=>row.id==='linked-task').created_at='2026-10-13T00:00:00Z';
 await assert.rejects(rehearseCurrent(changedDate),/Restored content differs: records/i);
 const missingWritable=structuredClone(legacy);
 delete missingWritable.tables.fortius_inmuebles_records.find(row=>row.id==='linked-task').data;
 await assert.rejects(rehearseCurrent(missingWritable),/not-null|Restored content differs/i);
});

test('rejects an adulterated calculated task reference even though the true target exists',async()=>{
 const tampered=structuredClone(backup);
 tampered.tables.fortius_inmuebles_records.find(row=>row.id==='linked-task').task_expediente_id=null;
 const source=structuredClone(tampered);
 await assert.rejects(rehearseCurrent(tampered),/Restored (?:generated )?content differs: records/i);
 assert.deepEqual(tampered,source);
});

test('revalidates the calculated foreign key even when an older backup omits that column',async()=>{
 const orphan=structuredClone(backup);
 for(const row of orphan.tables.fortius_inmuebles_records)delete row.task_expediente_id;
 orphan.tables.fortius_inmuebles_records.find(row=>row.id==='linked-task').data.expedienteId='51000000-0000-4000-8000-000000000099';
 const source=structuredClone(orphan);
 await assert.rejects(rehearseCurrent(orphan),/foreign key/i);
 assert.deepEqual(orphan,source);
});


test('exports and restores app originals, output files, versions, OCR corrections, signature evidence and the budget ledger',async()=>{
 assert.equal(backup.schema_version,7);
 const counts={app_runs:1,app_run_versions:2,app_files:2,app_shares:1,integration_jobs:2,integration_artifacts:3,integration_pages:4,signature_events:1};
 for(const [name,count] of Object.entries(counts))assert.equal(backup.tables['fortius_inmuebles_'+name]?.length,count,name);
 const original=structuredClone(backup),result=await rehearseCurrent(backup);
 for(const [name,count] of Object.entries(counts)){assert.equal(result.tables[name].rows,count);assert.equal(result.tables[name].exactContentAndDates,true);}
 for(const [parent,child] of [['expedientes','app_runs'],['app_runs','app_run_versions'],['app_files','app_shares'],['integration_jobs','integration_pages'],['integration_jobs','integration_artifacts'],['integration_jobs','signature_events']])assert.ok(result.restoreOrder.indexOf(parent)<result.restoreOrder.indexOf(child),parent+' before '+child);
 assert.equal(result.sourceSchemaVersion,7);assert.deepEqual(result.emptyTablesAdded,[]);assert.deepEqual(backup,original);
});

test('restores the historical 18-table backup while reporting only the new empty tables and preserving the source',async()=>{
 const old=structuredClone(backup);delete old.schema_version;for(const name of [...apps,'interviews','expediente_archivos','expediente_datos','ia_lecturas','user_preferences',...panel,...v7])delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.sourceSchemaVersion,1);assert.deepEqual([...result.emptyTablesAdded].sort(),[...apps,"interviews",'expediente_archivos','expediente_datos','ia_lecturas','user_preferences',...panel,...v7Empty].sort());
 for(const name of apps)assert.equal(result.tables[name].rows,0);
 assert.deepEqual(old,original);
});

test('rejects broken app relationships, missing version history and adulterated generated OCR search data',async()=>{
 for(const [table,column] of [['app_run_versions','run_id'],['app_shares','file_id'],['integration_artifacts','job_id'],['integration_pages','job_id'],['signature_events','job_id'],['integration_jobs','expediente_id']]){
  const orphan=structuredClone(backup);orphan.tables['fortius_inmuebles_'+table][0][column]='59999999-0000-4000-8000-000000000099';
  await assert.rejects(rehearseCurrent(orphan),/foreign key/i,table);
 }
 const history=structuredClone(backup);history.tables.fortius_inmuebles_app_run_versions=[];await assert.rejects(rehearseCurrent(history),/app.*version/i);
 const generated=structuredClone(backup);generated.tables.fortius_inmuebles_integration_pages[0].search="'tampered':1";
 await assert.rejects(rehearseCurrent(generated),/generated content differs: integration_pages/);
 const oldGenerated=structuredClone(backup);for(const row of oldGenerated.tables.fortius_inmuebles_integration_pages)delete row.search;
 assert.equal((await rehearseCurrent(oldGenerated)).passed,true);
});


test('direct database rehearsal rejects app files without their matching claimed upload provenance',async()=>{
 for(const alter of [
  owner=>{owner.tables.fortius_inmuebles_file_uploads=[];},
  owner=>{owner.tables.fortius_inmuebles_file_uploads[0].record_id='apps:independent';},
  owner=>{owner.tables.fortius_inmuebles_file_uploads[0].uploaded_by='51000000-0000-4000-8000-000000000099';},
  owner=>{owner.tables.fortius_inmuebles_file_uploads[0].bucket='fortius-inmuebles-public';},
 ]){
  const invalid=structuredClone(backup);alter(invalid);const original=structuredClone(invalid);
  await assert.rejects(rehearseCurrent(invalid),/app.*(?:provenance|receipt)/i);assert.deepEqual(invalid,original);
 }
});

test('restores UTC timestamps with microseconds independently of the workstation timezone',async()=>{
 const db=await createRehearsalDatabase();
 try { assert.equal((await db.query('show timezone')).rows[0].TimeZone,'UTC'); }
 finally { await db.close(); }
 const source=structuredClone(backup);
 source.tables.fortius_inmuebles_staff[0].created_at='2026-09-03T11:28:21.663459+00:00';
 const original=structuredClone(source);
 const result=await rehearseCurrent(source);
 assert.equal(result.passed,true);
 assert.equal(result.tables.staff.exactContentAndDates,true);
 assert.deepEqual(source,original);
});

test('restores historical counterpart evidence but rejects an orphan JSON relationship',async()=>{
 const source=structuredClone(backup),target=structuredClone(source.tables.fortius_inmuebles_expedientes[0]);
 target.id='51000000-0000-4000-8000-000000000099';target.folio='SYNTHETIC-TARGET';source.tables.fortius_inmuebles_expedientes.push(target);
 source.tables.fortius_inmuebles_expedientes[0].flujo={version:1,ruta:'captacion',estado:'pausada',motivo:'Histórico',requisitos:{},contraparteId:target.id};
 const original=structuredClone(source);assert.equal((await rehearseCurrent(source)).passed,true);assert.deepEqual(source,original);
 source.tables.fortius_inmuebles_expedientes[0].flujo.contraparteId='51000000-0000-4000-8000-000000000088';
 await assert.rejects(rehearseCurrent(source),/counterpart reference is missing/);
});

test('restores complete schema v2 as 26 preserved tables plus empty interviews',async()=>{
 const old=structuredClone(backup);old.schema_version=2;for(const name of ['interviews','expediente_archivos','expediente_datos','ia_lecturas','user_preferences',...panel,...v7])delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.sourceSchemaVersion,2);assert.deepEqual(result.emptyTablesAdded,['interviews','expediente_archivos','expediente_datos','ia_lecturas','user_preferences',...panel,...v7Empty]);assert.equal(result.tables.interviews.rows,0);assert.deepEqual(old,original);
});
test('restores complete schema v3 adding only the empty client document tables',async()=>{
 const old=structuredClone(backup);old.schema_version=3;for(const name of ['expediente_archivos','expediente_datos','ia_lecturas','user_preferences',...panel,...v7])delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.sourceSchemaVersion,3);assert.deepEqual(result.emptyTablesAdded,['expediente_archivos','expediente_datos','ia_lecturas','user_preferences',...panel,...v7Empty]);assert.equal(result.tables.expediente_archivos.rows,0);assert.deepEqual(old,original);
});
test('restores complete schema v4 adding only the empty user preferences table',async()=>{
 const old=structuredClone(backup);old.schema_version=4;for(const name of ['user_preferences',...panel,...v7])delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.sourceSchemaVersion,4);assert.deepEqual(result.emptyTablesAdded,['user_preferences',...panel,...v7Empty]);assert.equal(result.tables.user_preferences.rows,0);assert.deepEqual(old,original);
});
test('restores complete schema v5 adding only the empty panel tables',async()=>{
 const old=structuredClone(backup);old.schema_version=5;for(const name of [...panel,...v7])delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.sourceSchemaVersion,5);assert.deepEqual(result.emptyTablesAdded,[...panel,...v7Empty]);
 // Empty means empty: not even the Biblioteca starter guides of the migrations stay behind.
 for(const name of panel)assert.equal(result.tables[name].rows,0,name);
 assert.equal(result.starterRowsReplaced,16);assert.deepEqual(old,original);
});
test('restores a version 6 copy already saved, keeping the lists of the migrations and an empty contact history',async()=>{
 const old=structuredClone(backup);old.schema_version=6;for(const name of v7)delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.passed,true);assert.equal(result.sourceSchemaVersion,6);
 assert.deepEqual(result.emptyTablesAdded,v7Empty);assert.equal(result.tables.persona_contactos.rows,0);
 // Without lists the restored panel could not save anything: the migrations' lists stay, and nobody's values are among them.
 assert.deepEqual(result.listsKeptFromMigrations,['catalogo_valores','catalogos']);assert.equal(result.listRowsReplaced,0);
 for(const name of ['catalogos','catalogo_valores']){assert.equal(result.tables[name].keptFromMigrations,true,name);assert.ok(result.tables[name].rows>0,name);}
 for(const name of panel)assert.deepEqual(result.tables[name],{rows:old.tables['fortius_inmuebles_'+name].length,exactContentAndDates:true},name);
 assert.deepEqual(old,original);
});
test('restores the lists and the contact history of a version 7 copy exactly, including a value the director added',async()=>{
 const db=await createRehearsalDatabase();
 try{
  const result=await restoreCurrentInto(db,structuredClone(backup));
  assert.deepEqual(result.listsKeptFromMigrations,[]);assert.ok(result.listRowsReplaced>0);
  for(const name of v7){
   assert.ok(backup.tables['fortius_inmuebles_'+name].length>0,name);
   assert.deepEqual(result.tables[name],{rows:backup.tables['fortius_inmuebles_'+name].length,exactContentAndDates:true},name);
  }
  // The lists are the backup's, once: not the migrations' copy plus the backup's.
  assert.equal((await db.query('select count(*)::int n from public.fortius_inmuebles_catalogo_valores')).rows[0].n,backup.tables.fortius_inmuebles_catalogo_valores.length);
  assert.equal((await db.query("select count(*)::int n from public.fortius_inmuebles_catalogo_valores where clave='feria_ensayo' and creado_por is not null")).rows[0].n,1);
 }finally{await db.close();}
 // Without one of its tables a v7 export is incomplete, not an older backup.
 for(const name of v7){
  const missing=structuredClone(backup);delete missing.tables['fortius_inmuebles_'+name];
  await assert.rejects(rehearseCurrent(missing),/Incomplete owner backup tables/,name);
 }
 const orphan=structuredClone(backup);orphan.tables.fortius_inmuebles_persona_contactos[0].persona_id='59999999-0000-4000-8000-000000000099';
 await assert.rejects(rehearseCurrent(orphan),/foreign key/i);
});
test('restores every panel table exactly and lets the history and the folios keep numbering',async()=>{
 for(const name of panel)assert.ok(backup.tables['fortius_inmuebles_'+name].length>0,name);
 // Retired tables of the old panel model are neither exported nor restored.
 for(const name of ['pendientes','notas_internas','bandeja','movimientos','documentos'])assert.equal(Object.hasOwn(backup.tables,'fortius_inmuebles_'+name),false,name);
 const db=await createRehearsalDatabase();
 try{
  const result=await restoreCurrentInto(db,structuredClone(backup));
  for(const name of panel)assert.deepEqual(result.tables[name],{rows:backup.tables['fortius_inmuebles_'+name].length,exactContentAndDates:true},name);
  // The Biblioteca keeps the backup's copy of the starter guides once, not twice.
  assert.equal((await db.query('select count(*)::int n from public.fortius_inmuebles_biblioteca')).rows[0].n,backup.tables.fortius_inmuebles_biblioteca.length);
  const antes=(await db.query('select max(id)::int m from public.fortius_inmuebles_historial')).rows[0].m;
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[adminId]);
  const nuevo=(await db.query("select public.fortius_inmuebles_anotar_historial('asunto',$1::text,$1::uuid,'nota','Después de restaurar')::int n",[seeded.asunto])).rows[0].n;
  assert.ok(nuevo>antes);
  // A new matter takes the next folio after the restored ones and reserves it in the book.
  const restored=backup.tables.fortius_inmuebles_folios.filter(f=>f.serie==='EXP').map(f=>Number(f.numero));
  assert.ok(restored.length>0);
  const folio=(await db.query("insert into public.fortius_inmuebles_asuntos(nombre,responsable_id) values ('Después de restaurar',$1) returning folio",[adminId])).rows[0].folio;
  assert.equal(Number(folio.slice(4)),Math.max(...restored)+1);
  assert.equal((await db.query('select count(*)::int n from public.fortius_inmuebles_folios where folio=$1',[folio])).rows[0].n,1);
 }finally{await db.close();}
 // Without one of the panel tables a v6 export is incomplete, not an older backup.
 for(const name of ['asuntos','documento_archivos','historial']){
  const missing=structuredClone(backup);delete missing.tables['fortius_inmuebles_'+name];
  await assert.rejects(rehearseCurrent(missing),/Incomplete owner backup tables/,name);
 }
});
test('restores the panel parents before their dependents, apart from the known cycles',async()=>{
 const db=await createRehearsalDatabase();
 try{
  const fks=(await db.query(`select replace(conrelid::regclass::text,'public.fortius_inmuebles_','') child,replace(confrelid::regclass::text,'public.fortius_inmuebles_','') parent
   from pg_constraint where contype='f' and connamespace='public'::regnamespace and confrelid<>conrelid and confrelid::regclass::text like 'public.fortius_inmuebles_%'`)).rows;
  // Each pair is closed by a key in the other direction; the restorer revalidates every key at the end.
  const cycles=new Set(['asuntos>consultas','consultas>solicitudes','inmuebles>inmueble_medios','asunto_documentos>trabajos','interesados>solicitudes','records>expedientes']);
  const order=(await rehearseCurrent(backup)).restoreOrder;
  for(const {child,parent} of fks){
   if(cycles.has(child+'>'+parent))continue;
   assert.ok(order.indexOf(parent)<order.indexOf(child),parent+' before '+child);
  }
 }finally{await db.close();}
});
test('restores each user preferences exactly after staff and rejects a v5 export without them',async()=>{
 const result=await rehearseCurrent(backup);
 assert.deepEqual(result.tables.user_preferences,{rows:1,exactContentAndDates:true});
 assert.equal(backup.tables.fortius_inmuebles_user_preferences[0].version,2);
 assert.ok(result.restoreOrder.indexOf('staff')<result.restoreOrder.indexOf('user_preferences'));
 // A current export without the table is incomplete, not an older backup.
 const missing=structuredClone(backup);delete missing.tables.fortius_inmuebles_user_preferences;
 await assert.rejects(rehearseCurrent(missing),/Incomplete owner backup tables/);
});
test('rejects orphan panel relationships, including the ones closed in a cycle',async()=>{
 const first=table=>backup.tables['fortius_inmuebles_'+table][0];
 assert.ok(first('documento_archivos').path.startsWith('consultas/'));assert.equal(first('documento_archivos').sha256.length,64);
 for(const [table,column] of [['documento_archivos','documento_id'],['cargas_por_acomodar','consulta_id'],['asunto_personas','persona_id'],['inmueble_medios','inmueble_id'],
  ['cobros','concepto_id'],['interesado_inmuebles','interesado_id'],['persona_uniones','destino_id'],['asuntos','consulta_id'],['inmuebles','portada_id'],['historial','asunto_id']]){
  const orphan=structuredClone(backup);orphan.tables['fortius_inmuebles_'+table][0][column]='59999999-0000-4000-8000-000000000099';
  const original=structuredClone(orphan);
  await assert.rejects(rehearseCurrent(orphan),/foreign key/i,table+'.'+column);
  assert.deepEqual(orphan,original);
 }
});
test('rejects a version 6 export that omits interview snapshots',async()=>{
 const missing=structuredClone(backup);delete missing.tables.fortius_inmuebles_interviews;
 await assert.rejects(rehearseCurrent(missing),/Incomplete owner backup tables/);
});
