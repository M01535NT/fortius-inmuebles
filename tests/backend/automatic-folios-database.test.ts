import { afterAll,beforeAll,expect,it } from 'vitest';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { propiedades } from '../fixtures/propiedades';
const user='70000000-0000-4000-8000-000000000001';
let db:PGlite;
const property=(slug:string,codigo='')=>({...propiedades[0],slug,codigo,asesorId:'',publicada:false,demo:false});
async function save(slug:string,codigo='',version:number|null=null){return (await db.query<{record:{data:{codigo:string},version:number}}>("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3::bigint) as record",[slug,JSON.stringify(property(slug,codigo)),version])).rows[0].record;}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role;grant all on storage.objects to anon,authenticated,service_role;
 insert into auth.users values('${user}');`);
 const dir=new URL('../../supabase/migrations/',import.meta.url);const files=(await readdir(dir)).filter(n=>n.endsWith('.sql')).sort();
 for(const file of files.filter(n=>!n.includes('_automatic_folios')))await db.exec(await readFile(new URL(file,dir),'utf8'));
 await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values('${user}','admin');
 insert into public.fortius_inmuebles_records(collection,id,data) values
 ('asesores','folio-adviser','{"id":"folio-adviser","nombre":"Asesor ficticio","cargo":"Asesor","iniciales":"AF","activo":true}'),
 ('clientes','folio-client','{"id":"folio-client","nombre":"Cliente ficticio","telefono":"6641234567","tipo":"propietario","asesorId":"folio-adviser","notas":"","creadoEl":"2026-10-13","actualizadoEl":"2026-10-13"}');
 set role authenticated;select set_config('request.jwt.claim.sub','${user}',false);`);
 await save('legacy-property','FORTIUS-000042');
 await db.exec("select public.fortius_inmuebles_delete_record('propiedades','legacy-property',1)");
 await save('retained-property','CLIENTE-ANTIGUO');
 await db.exec("reset role");
 for(const file of files.filter(n=>n.includes('_automatic_folios')))await db.exec(await readFile(new URL(file,dir),'utf8'));
 await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${user}',false);`);
});
afterAll(async()=>{await db?.close();});
it('assigns a property code after a retired number and preserves legacy identifiers',async()=>{
 const first=await save('automatic-one');expect(first.data.codigo).toBe('FORTIUS-000043');
 expect((await save('retained-property','CLIENTE-ANTIGUO',1)).data.codigo).toBe('CLIENTE-ANTIGUO');
 await db.exec("select public.fortius_inmuebles_delete_record('propiedades','automatic-one',1)");
 expect((await save('automatic-two')).data.codigo).toBe('FORTIUS-000044');
});
it('serializes queued property creation and assigns different server values',async()=>{
 const values=await Promise.all([save('parallel-one'),save('parallel-two')]);
 expect(new Set(values.map(v=>v.data.codigo)).size).toBe(2);expect(values.every(v=>/^FORTIUS-\d{6,}$/.test(v.data.codigo))).toBe(true);
});
it('assigns expediente folios without user input while preserving existing and deleted ones',async()=>{
 await db.exec("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id,folio) values('folio-client','folio-adviser','EXP-000020')");
 const first=(await db.query<{folio:string}>("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id) values('folio-client','folio-adviser') returning folio")).rows[0];
 expect(first.folio).toBe('EXP-000021');
 await db.exec("update public.fortius_inmuebles_expedientes set deleted_at=clock_timestamp(),version=version+1 where folio='EXP-000021'");
 const next=(await db.query<{folio:string}>("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id) values('folio-client','folio-adviser') returning folio")).rows[0];
 expect(next.folio).toBe('EXP-000022');
});
it('cannot invoke the internal generators directly from staff or anonymous sessions',async()=>{
 await expect(db.query('select public.fortius_inmuebles_next_property_code()')).rejects.toMatchObject({code:'42501'});
 await db.exec('reset role;set role anon');
 await expect(db.query('select public.fortius_inmuebles_next_property_code()')).rejects.toMatchObject({code:'42501'});
 await expect(db.query("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id) values('folio-client','folio-adviser')")).rejects.toMatchObject({code:'42501'});
 await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${user}',false);`);
});

it('does not truncate folios when numbering passes six digits', async () => {
 await save('million-property', 'fortius-999999');
 expect((await save('million-next')).data.codigo).toBe('FORTIUS-1000000');
 await db.exec("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id,folio) values('folio-client','folio-adviser','exp-999999')");
 expect((await db.query<{folio:string}>("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id) values('folio-client','folio-adviser') returning folio")).rows[0].folio).toBe('EXP-1000000');
});
