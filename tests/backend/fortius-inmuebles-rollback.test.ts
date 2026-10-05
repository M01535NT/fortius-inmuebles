import {afterAll,beforeAll,expect,test} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
let db:PGlite;let inverse:string;
const suffixes=['staff','records','record_references','rate_limits','record_revisions'];
async function initialize(){
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select null::uuid$$;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;`);
  for(const name of ['202609030001_fortius_inmuebles_backend.sql','202609030002_fortius_inmuebles_record_revisions.sql','202609060003_fortius_inmuebles_identity.sql','202609060004_fortius_inmuebles_content_identity.sql'])await db.exec(await readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'));
  await db.exec(`insert into public.mnt_records(collection,id,data) values('notas','keep','{"texto":"MNT Inmuebles"}'),('posts','p','{"slug":"stable"}');insert into public.mnt_record_revisions values('notas','deleted',4);`);
  inverse=await readFile(new URL('../../tools/fortius-inmuebles-rollback-identity.sql',import.meta.url),'utf8');
}
beforeAll(initialize);
afterAll(async()=>{await db?.close();});
async function expected(){
  await db.exec('drop table if exists pg_temp.mnt_expected_cutover_state;create temporary table mnt_expected_cutover_state(suffix text primary key,row_count bigint,checksum text)');
  for(const suffix of suffixes){const order=suffix==='staff'?'user_id':suffix==='rate_limits'?'key':suffix==='record_references'?'source_collection,source_id,field':'collection,id';await db.exec(`insert into pg_temp.mnt_expected_cutover_state select '${suffix}',count(*),md5(coalesce(jsonb_agg(${suffix==='records'?"to_jsonb(t)-'updated_at'":'to_jsonb(t)'} order by ${order}),'[]'::jsonb)::text) from public.mnt_${suffix} t`);}
}
test('refuses schema reversal without a verified expected-state preamble',async()=>{
  await expect(db.exec(inverse)).rejects.toThrow(/expected-state preamble/);await db.exec('rollback');
  expect((await db.query("select to_regclass('public.mnt_records') name")).rows[0]).toEqual({name:'mnt_records'});
});
test('refuses any postcutover write and new storage object',async()=>{
  await expected();await db.exec("update public.mnt_records set data=data where id='keep'");
  await expect(db.exec(inverse)).rejects.toThrow(/state changed/);await db.exec('rollback');
  await expected();await db.exec("insert into storage.objects(bucket_id,name) values('mnt-private','new.pdf')");
  await expect(db.exec(inverse)).rejects.toThrow(/storage objects/);await db.exec('rollback');
  await db.exec('delete from storage.objects');
});
test('refuses removing an unexpected legacy function instead of deleting it blindly',async()=>{
  await expected();
  await db.exec("create or replace function public.cota_public_records(p_collection text) returns table(data jsonb) language sql stable as $$select '{}'::jsonb$$");
  await expect(db.exec(inverse)).rejects.toThrow(/unexpected legacy/);await db.exec('rollback');
  await db.exec("create or replace function public.cota_public_records(p_collection text) returns table(data jsonb) language sql stable set search_path='' as $$select * from public.mnt_public_records(p_collection);$$");
});
test('inverse preserves OIDs ACLs data revisions buckets and slug protection without aliases',async()=>{
  await expected();
  const records=(await db.query('select * from public.mnt_records order by collection,id')).rows;
  const revisions=(await db.query('select * from public.mnt_record_revisions order by collection,id')).rows;
  const functions=(await db.query("select oid,replace(proname,'mnt_','cota_') name,proacl::text,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'mnt_') order by oid")).rows;
  await db.exec(inverse);
  expect((await db.query('select * from public.cota_records order by collection,id')).rows).toEqual(records);
  expect((await db.query('select * from public.cota_record_revisions order by collection,id')).rows).toEqual(revisions);
  expect((await db.query("select oid,proname name,proacl::text,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'cota_') order by oid")).rows).toEqual(functions);
  expect((await db.query("select oid from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'mnt_')")).rows).toEqual([]);
  expect((await db.query('select * from storage.buckets')).rows).toHaveLength(6);
  expect((await db.query("select policyname,roles,cmd from pg_policies where schemaname='storage' and tablename='objects'")).rows).toEqual([{policyname:'cota_storage_read',roles:['authenticated'],cmd:'SELECT'}]);
  await expect(db.exec(`update public.cota_records set data='{"slug":"changed"}' where id='p'`)).rejects.toMatchObject({code:'PT400'});
  for(const bucket of ['mnt-private','mnt-staging','cota-private','cota-staging'])expect((await db.query<{safe:boolean}>('select public.cota_public_url($1) safe',['/'+bucket+'/secret'])).rows[0].safe).toBe(false);
});
test('inverse also works after 005 has already removed the temporary wrapper',async()=>{
  await db.close();await initialize();
  await db.exec(await readFile(new URL('../../supabase/migrations/202609060005_retire_public_read_compatibility.sql',import.meta.url),'utf8'));
  await expected();await db.exec(inverse);
  expect((await db.query("select to_regprocedure('public.cota_public_records(text)') is not null ok")).rows[0]).toEqual({ok:true});
  expect((await db.query('select * from public.cota_records')).rows).toHaveLength(2);
});
