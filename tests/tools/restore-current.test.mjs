import {before,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRehearsalDatabase,rehearseCurrent} from '../../tools/fortius-inmuebles-restore-current.mjs';

let backup;
const apps=['app_runs','app_run_versions','app_files','app_shares','integration_jobs','integration_artifacts','integration_pages','signature_events'];
const expedienteId='51000000-0000-4000-8000-000000000010';
before(async()=>{
 const db=await createRehearsalDatabase();
 try{
  await db.exec(`insert into auth.users values ('51000000-0000-4000-8000-000000000001');
  insert into public.fortius_inmuebles_staff(user_id,role) values ('51000000-0000-4000-8000-000000000001','admin');
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
  // Model the reference synchronization performed by real record writes.
  await db.exec("select public.fortius_inmuebles_sync_references(collection,id,data) from public.fortius_inmuebles_records");
  const sql=await readFile(new URL('../../tools/fortius-inmuebles-owner-export.sql',import.meta.url),'utf8');
  backup=(await db.query(sql)).rows[0].backup;
 }finally{await db.close()}
});

test('restores the current schema with history, activity and document snapshots; rejects orphan relationships',async()=>{
  const source=structuredClone(backup);
  const result=await rehearseCurrent(backup);
  assert.equal(result.passed,true);assert.equal(Object.keys(result.tables).length,26);
  assert.equal(result.tables.formato_drafts.rows,1);assert.equal(result.tables.formato_emissions.rows,1);assert.equal(result.tables.expediente_actividad.rows,1);assert.ok(result.tables.record_history.rows>0);
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
 assert.equal(backup.schema_version,2);
 const counts={app_runs:1,app_run_versions:2,app_files:2,app_shares:1,integration_jobs:2,integration_artifacts:3,integration_pages:4,signature_events:1};
 for(const [name,count] of Object.entries(counts))assert.equal(backup.tables['fortius_inmuebles_'+name]?.length,count,name);
 const original=structuredClone(backup),result=await rehearseCurrent(backup);
 for(const [name,count] of Object.entries(counts)){assert.equal(result.tables[name].rows,count);assert.equal(result.tables[name].exactContentAndDates,true);}
 for(const [parent,child] of [['expedientes','app_runs'],['app_runs','app_run_versions'],['app_files','app_shares'],['integration_jobs','integration_pages'],['integration_jobs','integration_artifacts'],['integration_jobs','signature_events']])assert.ok(result.restoreOrder.indexOf(parent)<result.restoreOrder.indexOf(child),parent+' before '+child);
 assert.equal(result.sourceSchemaVersion,2);assert.deepEqual(result.emptyTablesAdded,[]);assert.deepEqual(backup,original);
});

test('restores the historical 18-table backup while reporting only the new empty tables and preserving the source',async()=>{
 const old=structuredClone(backup);delete old.schema_version;for(const name of apps)delete old.tables['fortius_inmuebles_'+name];
 const original=structuredClone(old),result=await rehearseCurrent(old);
 assert.equal(result.sourceSchemaVersion,1);assert.deepEqual([...result.emptyTablesAdded].sort(),[...apps].sort());
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
