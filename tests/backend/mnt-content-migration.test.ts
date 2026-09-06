import {afterAll,beforeAll,expect,test} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
let db:PGlite;
let original:Record<string,unknown>[];
const member='40000000-0000-4000-8000-000000000001';
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select null::uuid$$;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text,name text);alter table storage.objects enable row level security;`);
  for(const name of ['202609030001_cota_backend.sql','202609030002_cota_record_revisions.sql','202609060003_mnt_identity.sql'])await db.exec(await readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'));
  const rows=[
    ['config','singleton',{nombreComercial:'Cota',email:'contacto@cota.mx',telefono:'+52 664 000 0000',whatsapp:'https://wa.me/526640000000'}],
    ['contenido','singleton',{seoTitle:'COTA | Método',text:'Cota. mascotas acotado COTAB COTA',url:'https://cota-eight.vercel.app/inventario/casa',nested:['COTA',['Cota'],{label:'COTA-004',key:'cota_records'}]}],
    ['archivos','arch01',{id:'arch01',url:'/descargas/checklist-venta-cota.pdf'}],
    ['notas','cota-id',{id:'cota-id',slug:'cota-slug',texto:'Sin cambios',asesorId:'cota-agent',email:'real@cota.mx',telefono:'+52 664 123 4567'}],
    ['posts','cota-post',{id:'cota-post',slug:'cota-articulo',titulo:'COTA: guía',contenido:'Texto'}],
  ];
  for(const [collection,id,data] of rows)await db.query('insert into public.mnt_records(collection,id,data) values($1,$2,$3::jsonb)',[collection,id,JSON.stringify(data)]);
  await db.query('insert into auth.users values($1)',[member]);
  await db.query("insert into public.mnt_staff(user_id,role) values($1,'admin')",[member]);
  await db.exec("insert into public.mnt_record_revisions values('notas','deleted',9)");
  original=(await db.query<Record<string,unknown>>('select * from public.mnt_records order by collection,id')).rows;
  await db.exec(await readFile(new URL('../../supabase/migrations/202609060004_mnt_content_identity.sql',import.meta.url),'utf8'));
});
afterAll(async()=>{await db?.close();});
test('rebrands standalone words recursively without damaging unrelated words or identities',async()=>{
  const row=(await db.query<{data:Record<string,unknown>}>('select data from public.mnt_records where collection=\'contenido\'')).rows[0].data;
  expect(row).toMatchObject({seoTitle:'MNT Inmuebles | Método',text:'MNT Inmuebles. mascotas acotado COTAB MNT Inmuebles',url:'https://mnt-inmuebles.vercel.app/inventario/casa',nested:['MNT Inmuebles',['MNT Inmuebles'],{label:'MNT-004',key:'mnt_records'}]});
  expect((await db.query<{data:Record<string,unknown>}>("select data from public.mnt_records where collection='posts'")).rows[0].data).toMatchObject({id:'cota-post',slug:'cota-articulo',titulo:'MNT Inmuebles: guía'});
});
test('clears only exact known fake config contacts and redirects the checklist',async()=>{
  expect((await db.query<{data:unknown}>("select data from public.mnt_records where collection='config'")).rows[0].data).toEqual({nombreComercial:'MNT Inmuebles',email:'',telefono:'',whatsapp:''});
  expect((await db.query<{data:unknown}>("select data from public.mnt_records where collection='archivos'")).rows[0].data).toEqual({id:'arch01',url:'/descargas/checklist-venta-mnt.pdf'});
});
test('unchanged rows keep exact versions and dates; changed rows advance once, tombstones survive',async()=>{
  const after=(await db.query<Record<string,unknown>>('select * from public.mnt_records order by collection,id')).rows;
  expect(after.map(r=>[r.collection,r.id])).toEqual(original.map(r=>[r.collection,r.id]));
  for(const [index,row]of after.entries()){
    if(row.collection==='notas')expect(row).toEqual(original[index]);
    else {expect(row.version).toBe(Number(original[index].version)+1);expect(row.created_at).toEqual(original[index].created_at);}
  }
  expect((await db.query<{last_version:number}>("select last_version::int from public.mnt_record_revisions where id='deleted'")).rows[0].last_version).toBe(9);
  expect((await db.query('select * from public.mnt_staff')).rows).toHaveLength(1);
});
test('leaves no transformer and retains legacy and current private URL exclusion',async()=>{
  expect((await db.query("select oid from pg_proc where proname='mnt_rebrand_json'")).rows).toEqual([]);
  for(const bucket of ['cota-private','cota-staging','mnt-private','mnt-staging'])expect((await db.query<{safe:boolean}>('select public.mnt_public_url($1) safe',['https://example.test/storage/v1/object/public/'+bucket+'/doc.pdf'])).rows[0].safe).toBe(false);
});
test('preserves confirmed contacts and is idempotent after brand substitutions',async()=>{
  await db.query("update public.mnt_records set data=$1::jsonb where collection='config'",[JSON.stringify({nombreComercial:'MNT Inmuebles',email:'real@cota.mx',telefono:'+52 664 123 4567',whatsapp:'https://wa.me/526641234567'})]);
  const before=(await db.query('select * from public.mnt_records order by collection,id')).rows;
  await db.exec(await readFile(new URL('../../supabase/migrations/202609060004_mnt_content_identity.sql',import.meta.url),'utf8'));
  expect((await db.query('select * from public.mnt_records order by collection,id')).rows).toEqual(before);
});
