import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

let db: PGlite;
const admin = "51000000-0000-4000-8000-000000000001";
const own = "51000000-0000-4000-8000-000000000002";
const other = "51000000-0000-4000-8000-000000000003";
const expediente = "51000000-0000-4000-8000-000000000010";
const draft = "51000000-0000-4000-8000-000000000011";

async function asUser<T>(uid: string | null, action: () => Promise<T>) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]);
  try { return await action(); } finally { await db.exec("reset role"); }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente propio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}'),
    ('clientes','c-other','{"id":"c-other","nombre":"Cliente ajeno","telefono":"6641234567","tipo":"propietario","asesorId":"other","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${expediente}','c-own','own','EXP-1');
    insert into public.fortius_inmuebles_formato_drafts(id,expediente_id,formato_id,data) values ('${draft}','${expediente}','18','{}');`);
});
afterAll(async () => { await db?.close(); });


it("elimina y restaura sin perder documentos y bloquea su acceso mientras está eliminado", async () => {
  const emission="51000000-0000-4000-8000-000000000020";
  await db.query("insert into public.fortius_inmuebles_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)",[emission,draft,"a".repeat(64),expediente+"/"+emission+".pdf",admin]);
  const original=(await db.query("select * from public.fortius_inmuebles_formato_emissions where id=$1",[emission])).rows;
  await asUser(own,async()=>{
    expect((await db.query("update public.fortius_inmuebles_expedientes set deleted_at=now(),version=2 where id=$1 and version=1 returning deleted_by",[expediente])).rows).toEqual([{deleted_by:own}]);
    expect((await db.query("select id from public.fortius_inmuebles_expedientes where deleted_at is null")).rows).toEqual([]);
    expect((await db.query("select id from public.fortius_inmuebles_formato_drafts")).rows).toEqual([]);
    expect((await db.query("select id from public.fortius_inmuebles_formato_emissions")).rows).toEqual([]);
    expect((await db.query("update public.fortius_inmuebles_expedientes set deleted_at=null,version=2 where id=$1 and version=1 returning id",[expediente])).rows).toEqual([]);
  });
  await asUser(admin,async()=>{
    expect((await db.query("select public.fortius_inmuebles_can_access_expediente($1) ok",[expediente])).rows).toEqual([{ok:false}]);
    expect((await db.query("select id from public.fortius_inmuebles_formato_drafts")).rows).toEqual([]);
  });
  await asUser(other,async()=>{
    expect((await db.query("update public.fortius_inmuebles_expedientes set deleted_at=null,version=3 where id=$1 returning id",[expediente])).rows).toEqual([]);
  });
  await expect(db.query("insert into public.fortius_inmuebles_formato_emissions(draft_id,snapshot,sha256,path,created_by) values ($1,'{}',$2,$3,$4)",[draft,"b".repeat(64),expediente+"/51000000-0000-4000-8000-000000000021.pdf",admin])).rejects.toMatchObject({code:"PT409"});
  await asUser(own,async()=>{
    await db.query("update public.fortius_inmuebles_expedientes set deleted_at=null,version=3 where id=$1 and version=2",[expediente]);
    expect((await db.query("select deleted_at,deleted_by,version::int from public.fortius_inmuebles_expedientes where id=$1",[expediente])).rows).toEqual([{deleted_at:null,deleted_by:null,version:3}]);
    expect((await db.query("select * from public.fortius_inmuebles_formato_emissions where id=$1",[emission])).rows).toEqual(original);
    expect((await db.query("select id from public.fortius_inmuebles_formato_drafts")).rows).toEqual([{id:draft}]);
  });
});
it("rechaza eliminación ajena, anónima y versión obsoleta",async()=>{
  await asUser(other,async()=>expect((await db.query("update public.fortius_inmuebles_expedientes set deleted_at=now(),version=4 where id=$1 returning id",[expediente])).rows).toEqual([]));
  await asUser(null,async()=>{await expect(db.query("update public.fortius_inmuebles_expedientes set deleted_at=now(),version=4 where id=$1",[expediente])).rejects.toMatchObject({code:"42501"});});
  await asUser(own,async()=>{await expect(db.query("update public.fortius_inmuebles_expedientes set deleted_at=now(),version=1 where id=$1",[expediente])).rejects.toMatchObject({code:"PT409"});});
});
