import {before,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRehearsalDatabase,rehearseCurrent} from '../../tools/fortius-inmuebles-restore-current.mjs';

let backup;
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
  // Model the reference synchronization performed by real record writes.
  await db.exec("select public.fortius_inmuebles_sync_references(collection,id,data) from public.fortius_inmuebles_records");
  const sql=await readFile(new URL('../../tools/fortius-inmuebles-owner-export.sql',import.meta.url),'utf8');
  backup=(await db.query(sql)).rows[0].backup;
 }finally{await db.close()}
});

test('restores the current schema with history, activity and document snapshots; rejects orphan relationships',async()=>{
  const source=structuredClone(backup);
  const result=await rehearseCurrent(backup);
  assert.equal(result.passed,true);assert.equal(Object.keys(result.tables).length,18);
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
