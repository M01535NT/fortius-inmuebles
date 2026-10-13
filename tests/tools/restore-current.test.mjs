import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRehearsalDatabase,rehearseCurrent} from '../../tools/fortius-inmuebles-restore-current.mjs';

test('restores the current schema with history, activity and document snapshots; rejects orphan relationships',async()=>{
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
  // Model the reference synchronization performed by real record writes.
  await db.exec("select public.fortius_inmuebles_sync_references(collection,id,data) from public.fortius_inmuebles_records");
  const sql=await readFile(new URL('../../tools/fortius-inmuebles-owner-export.sql',import.meta.url),'utf8');
  const {backup}= (await db.query(sql)).rows[0];
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
 }finally{await db.close()}
});
