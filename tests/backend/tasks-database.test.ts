import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
let db: PGlite;
let functions: unknown;
const member = "30000000-0000-4000-8000-000000000001";
const snapshot = "select oid,proname,proacl::text,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace and proname in ('mnt_validate_record','mnt_put_record','mnt_delete_record','mnt_public_records') order by oid";
const base = { id:"t1",titulo:"Seguimiento",categoria:"leads",estado:"pendiente",prioridad:"normal",descripcion:"",pasos:[] };
async function put(data:Record<string,unknown>, version:number|null=null,collection="tareas") { return (await db.query<{r:{data:Record<string,unknown>;version:number}}>("select public.mnt_put_record($1,$2,$3::jsonb,$4) r",[collection,data.id,JSON.stringify(data),version])).rows[0].r; }
beforeAll(async()=>{
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${member}');`);
  const dir = new URL("../../supabase/migrations/",import.meta.url);
  for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')&&!f.includes('mnt_tasks')).sort()) await db.exec(await readFile(new URL(file,dir),'utf8'));
  functions=(await db.query(snapshot)).rows;
  await db.exec(await readFile(new URL('202609230006_mnt_tasks.sql',dir),'utf8'));
  await db.query("insert into public.mnt_staff(user_id,role) values ($1,'editor')",[member]);
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[member]);
});
afterAll(async()=>{await db?.close();});
test('tasks migration preserves existing function OIDs and grants',async()=>{expect((await db.query(snapshot)).rows).toEqual(functions);});
test('task history is authoritative, notes append once, completion and reopen are stamped',async()=>{
  const first=await put({...base,historial:[{texto:'injected'}],creadoEl:'fake',nuevaNota:'Primera nota'});
  expect(first.data.creadoEl).not.toBe('fake'); expect(first.data.nuevaNota).toBeUndefined();
  expect(first.data.historial).toMatchObject([{accion:'creada',actorId:member},{accion:'nota',texto:'Primera nota'}]);
  const done=await put({...base,estado:'completada',historial:[],completadoPor:'fake'},1);
  expect(done.data.completadoPor).toBe(member); expect(done.data.completadoEl).toBeTruthy();
  expect(done.data.historial).toHaveLength(3);
  const reopened=await put({...base,historial:[]},2);
  expect(reopened.data.completadoEl).toBeUndefined(); expect(reopened.data.completadoPor).toBeUndefined(); expect(reopened.data.historial).toHaveLength(4);
  await expect(put(base,1)).rejects.toMatchObject({code:'PT409'});
});
test('direct RPC rejects malformed tasks and missing references',async()=>{
  for(const patch of [{vence:'2026-02-30'},{estado:'en-espera'},{titulo:''},{prioridad:'bad'},{pasos:[{id:'p',texto:'P',hecho:'false'}]},{leadId:'absent'}]) await expect(put({...base,id:'invalid',...patch})).rejects.toMatchObject({code:'PT400'});
});
test('task reference deletion protection and legacy events stay operational',async()=>{
  await put({id:'a1',nombre:'Asesor',cargo:'',iniciales:'A',activo:true},null,'asesores');
  await put({...base,id:'linked',asesorId:'a1'});
  await expect(db.query("select public.mnt_delete_record('asesores','a1',1)")).rejects.toMatchObject({code:'PT409'});
  await put({id:'e1',titulo:'Visita',fecha:'2026-09-23',tipo:'visita'},null,'eventos');
  await db.query("select public.mnt_delete_record('tareas','linked',1)");
  const recreated=await put({...base,id:'linked'}); expect(recreated.version).toBe(2);
});
test('all task reference kinds retain foreign key guards',async()=>{
  await db.exec('reset role');
  for(const [collection,id] of [['leads','lead-ref'],['clientes','client-ref'],['propiedades','property-ref']]) await db.query('insert into public.mnt_records(collection,id,data) values($1,$2,$3::jsonb)',[collection,id,JSON.stringify({id})]);
  await db.exec('set role authenticated');
  await put({...base,id:'all-refs',leadId:'lead-ref',clienteId:'client-ref',propiedadSlug:'property-ref'});
  for(const [collection,id] of [['leads','lead-ref'],['clientes','client-ref'],['propiedades','property-ref']]) await expect(db.query('select public.mnt_delete_record($1,$2,1)',[collection,id])).rejects.toMatchObject({code:'PT409'});
  await expect(db.query("select public.mnt_delete_record('tareas','all-refs',2)")).rejects.toMatchObject({code:'PT409'});
});
test('private tasks never project publicly and unauthorized users cannot write',async()=>{
  await db.exec('reset role; set role anon');
  expect((await db.query("select * from public.mnt_public_records('tareas')")).rows).toEqual([]);
  await expect(put({...base,id:'denied'})).rejects.toMatchObject({code:'42501'});
  await expect(db.query('select * from public.mnt_records')).rejects.toMatchObject({code:'42501'});
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',false)");
  await expect(put({...base,id:'denied'})).rejects.toMatchObject({code:'PT403'});
});
