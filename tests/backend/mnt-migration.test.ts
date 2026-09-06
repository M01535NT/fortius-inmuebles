import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

let db: PGlite;
let functionState: unknown;
let revisionState: unknown;
const functionSnapshot = String.raw`select oid,replace(proname,'cota_','mnt_') name,proacl::text,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace and proname like 'cota\_%' escape '\' order by oid`;
const member = "30000000-0000-4000-8000-000000000001";
const migration = new URL("../../supabase/migrations/202609060003_mnt_identity.sql", import.meta.url);
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${member}');`);
  for (const path of ["202609030001_cota_backend.sql", "202609030002_cota_record_revisions.sql"]) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${path}`, import.meta.url), "utf8"));
  }
  await db.query("insert into public.cota_staff(user_id,role) values ($1,'admin')", [member]);
  await db.query("insert into public.cota_records(collection,id,data,version) values ('notas','keep',$1,7)", [JSON.stringify({ id: "keep", titulo: "Conservar", texto: "Privado", actualizadoEl: "2026-09-05" })]);
  await db.exec("update public.cota_records set data=data where id='keep'; insert into public.cota_records(collection,id,data) values ('notas','deleted','{\"id\":\"deleted\",\"titulo\":\"Old\",\"texto\":\"Deleted\"}'); update public.cota_records set data=data where id='deleted'; delete from public.cota_records where id='deleted';");
  functionState = (await db.query(functionSnapshot)).rows;
  expect((functionState as unknown[]).length).toBeGreaterThan(10);
  revisionState = (await db.query("select * from public.cota_record_revisions order by collection,id")).rows;
  await db.exec(await readFile(migration, "utf8"));
});
afterAll(async () => { await db?.close(); });

test("rename preserves data, membership, revisions and removes old active SQL names", async () => {
  expect((await db.query<{ data: { texto: string }; version: number }>("select data,version::int from public.mnt_records where id='keep'")).rows[0]).toMatchObject({ data: { texto: "Privado" }, version: 2 });
  expect((await db.query<Record<string, unknown>>(functionSnapshot.replaceAll("cota", "mnt"))).rows.filter((r: Record<string, unknown>) => r.name !== 'mnt_protect_post_slug')).toEqual(functionState);
  expect((await db.query("select * from public.mnt_record_revisions order by collection,id")).rows).toEqual(revisionState);
  expect((await db.query("select * from public.mnt_staff")).rows).toHaveLength(1);
  expect((await db.query("select * from public.mnt_record_revisions where id='keep'")).rows).toHaveLength(1);
  expect((await db.query("select relname from pg_class where relnamespace='public'::regnamespace and relname like 'cota_%'")).rows).toEqual([]);
  expect((await db.query("select proname from pg_proc where pronamespace='public'::regnamespace and proname like 'cota_%'")).rows).toEqual([{proname:'cota_public_records'}]);
});

test("new RPC preserves staff authorization and stale revision rejection", async () => {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
  const data = { id: "keep", titulo: "Editada", texto: "Sigue privada", actualizadoEl: "2026-09-06" };
  try {
    const r = await db.query<{ r: { version: number } }>("select public.mnt_put_record('notas','keep',$1::jsonb,2) r", [JSON.stringify(data)]);
    expect(r.rows[0].r.version).toBe(3);
    await expect(db.query("select public.mnt_put_record('notas','keep',$1::jsonb,1)", [JSON.stringify(data)])).rejects.toMatchObject({ code: "PT409" });
    await expect(db.query("select * from public.mnt_record_revisions")).rejects.toMatchObject({ code: "42501" });
  } finally { await db.exec("reset role"); }
});

test("post slugs are unique and immutable through RPC and privileged updates", async () => {
  const post = { id: "p1", slug: "primer-articulo", titulo: "Primero", resumen: "Resumen", contenido: "Texto", estado: "borrador", actualizadoEl: "2026-09-06" };
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
  try {
    await db.query("select public.mnt_put_record('posts','p1',$1::jsonb,null)", [JSON.stringify(post)]);
    await expect(db.query("select public.mnt_put_record('posts','p2',$1::jsonb,null)", [JSON.stringify({ ...post, id: "p2" })])).rejects.toMatchObject({ code: "PT409" });
    await expect(db.query("select public.mnt_put_record('posts','p1',$1::jsonb,1)", [JSON.stringify({ ...post, slug: "otro" })])).rejects.toMatchObject({ code: "PT400" });
  } finally { await db.exec("reset role"); }
  await expect(db.query("update public.mnt_records set data=jsonb_set(data,'{slug}','\"otro\"') where collection='posts' and id='p1'")).rejects.toMatchObject({ code: "PT400" });
  await db.exec("set role anon");
  try {
    expect((await db.query("select * from public.mnt_public_records('posts')")).rows).toEqual([]);
    await expect(db.query("select * from public.mnt_records")).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("select public.mnt_put_record('posts','bad','{}',null)")).rejects.toMatchObject({ code: "42501" });
  } finally { await db.exec("reset role"); }
});

test("new storage buckets preserve visibility and limits", async () => {
  expect((await db.query("select id,public,file_size_limit::int from storage.buckets where id like 'mnt-%' order by id")).rows).toEqual([
    { id: "mnt-private", public: false, file_size_limit: 20971520 }, { id: "mnt-public", public: true, file_size_limit: 20971520 }, { id: "mnt-staging", public: false, file_size_limit: 20971520 },
  ]);
});

test('managed Storage policy is recreated atomically with the same read-only staff audience',async()=>{
  const policies=(await db.query<{policyname:string;roles:string[];cmd:string;qual:string}>("select policyname,roles,cmd,qual from pg_policies where schemaname='storage' and tablename='objects'")).rows;
  expect(policies).toHaveLength(1);
  expect(policies[0]).toMatchObject({policyname:'mnt_storage_read',roles:['authenticated'],cmd:'SELECT'});
  expect(policies[0].qual).toContain('mnt_is_staff');
  expect(policies[0].qual).toContain('mnt-private');
  expect(policies[0].qual).not.toContain('mnt-staging');
  const sql=await readFile(migration,'utf8');
  expect(sql).toContain("where schemaname='public' and policyname");
  expect(sql).toContain('drop policy cota_storage_read on storage.objects');
  expect(sql).toContain('create policy mnt_storage_read on storage.objects for select to authenticated');
  expect(sql).not.toMatch(/alter\s+table\s+storage\.objects\s+owner/i);
});

test("public projections exclude legacy and new private or staging URLs", async () => {
  for (const bucket of ["cota-private","cota-staging","mnt-private","mnt-staging"]) {
    expect((await db.query<{safe:boolean}>("select public.mnt_public_url($1) safe", ["https://example.test/storage/v1/object/public/"+bucket+"/document.pdf"])).rows[0].safe).toBe(false);
  }
  for(const url of ["//evil.test/file", "javascript:alert(1)", "/api/admin/files/1"]) expect((await db.query<{safe:boolean}>("select public.mnt_public_url($1) safe",[url])).rows[0].safe).toBe(false);
});

test("deleted identities retain concurrency revisions after migration", async () => {
  await db.query("insert into public.mnt_records(collection,id,data) values ('notas','deleted',$1)", [JSON.stringify({id:"deleted",titulo:"Recreated",texto:"New"})]);
  expect((await db.query<{version:number}>("select version::int from public.mnt_records where id='deleted'")).rows[0].version).toBe(3);
});

test('temporary old public RPC has identical anon projection and no old write surface',async()=>{
  await db.exec(`insert into public.mnt_records(collection,id,data) values('config','singleton','{"nombreComercial":"MNT Inmuebles"}')`);
  await db.exec('set role anon');
  try {
    const current=(await db.query("select * from public.mnt_public_records('config')")).rows;
    expect(current).toHaveLength(1);
    expect((await db.query("select * from public.cota_public_records('config')")).rows).toEqual(current);
    for(const collection of ['notas','leads','clientes','archivos'])expect((await db.query('select * from public.cota_public_records($1)',[collection])).rows).toEqual([]);
    await expect(db.query("select public.cota_put_record('notas','keep','{}',3)")).rejects.toMatchObject({code:'42883'});
  } finally {await db.exec('reset role');}
  expect((await db.query("select prosecdef from pg_proc where oid='public.cota_public_records(text)'::regprocedure")).rows[0]).toEqual({prosecdef:false});
});

test('005 retires only the temporary read compatibility API after deployment',async()=>{
  await db.exec(await readFile(new URL('../../supabase/migrations/202609060005_retire_public_read_compatibility.sql',import.meta.url),'utf8'));
  expect((await db.query("select proname from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'cota_')")).rows).toEqual([]);
  expect((await db.query("select * from public.mnt_public_records('config')")).rows).toHaveLength(1);
});
