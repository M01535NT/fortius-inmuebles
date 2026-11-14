import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  Revisión de Calidad sobre los archivos públicos quitados de un inmueble: no se retira un archivo
  que algo todavía usa.
  - C-59: más de 1000 registros (aquí 20 000 y 5000 fichas de relleno; se mide el tiempo). La base revisa todo; ya no se lee por partes desde la API.
  - C-60: una ficha comercial guardada en Herramientas (app_runs.input.photoUrls) cuenta como uso.
*/
let db: PGlite;
const owner = "59000000-0000-4000-8000-000000000001";
const needle = (path: string) => `fortius-inmuebles-public/${path}`;
const url = (path: string) => `https://ejemplo.supabase.co/storage/v1/object/public/${needle(path)}`;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text,created_at timestamptz default now(),updated_at timestamptz default now());
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${owner}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(dir)).filter(item => item.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(name, dir), "utf8"));
  // Datos de ensayo directos, sin las reglas de guardado.
  await db.exec("set session_replication_role = replica");
  await db.query(`insert into public.fortius_inmuebles_records(collection,id,data)
    select 'tareas','t'||g, jsonb_build_object('titulo','Tarea de ejemplo '||g) from generate_series(1,20000) g`);
  await db.query(`insert into public.fortius_inmuebles_app_runs(owner_id,slug,title,input,context)
    select '${owner}','ficha-comercial','Ficha de relleno '||g, jsonb_build_object('photoUrls', jsonb_build_array('https://ejemplo.supabase.co/otra/'||g||'.jpg')),'{}'::jsonb from generate_series(1,5000) g`);
  await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values ('propiedades','otra',$1::jsonb),('propiedades','casa',$2::jsonb)", [
    JSON.stringify({ galeria: [{ src: url("inmuebles/casa/compartida.jpg") }] }),
    JSON.stringify({ galeria: [{ src: url("inmuebles/casa/a.jpg") }] }),
  ]);
  await db.query("insert into public.fortius_inmuebles_record_history(collection,record_id,action,snapshot,version) values ('propiedades','casa','UPDATE',$1::jsonb,1),('propiedades','vieja','DELETE',$2::jsonb,3)", [
    JSON.stringify({ galeria: [{ src: url("inmuebles/casa/version-propia.jpg") }] }),
    JSON.stringify({ galeria: [{ src: url("inmuebles/casa/en-eliminados.jpg") }] }),
  ]);
  await db.query("insert into public.fortius_inmuebles_app_runs(owner_id,slug,title,input,context) values ($1,'ficha-comercial','Ficha de ejemplo',$2::jsonb,'{}'::jsonb)", [
    owner, JSON.stringify({ photoUrls: [url("inmuebles/casa/en-ficha.jpg")] }),
  ]);
  await db.exec(`insert into storage.objects(bucket_id,name,updated_at) values
    ('fortius-inmuebles-private','retirados/inmuebles/casa/vieja.jpg',now()-interval '31 days'),
    ('fortius-inmuebles-private','retirados/inmuebles/casa/reciente.jpg',now()-interval '29 days'),
    ('fortius-inmuebles-private','expedientes/otro/viejo.pdf',now()-interval '90 days'),
    ('fortius-inmuebles-public','retirados/no-es-privado.jpg',now()-interval '90 days');`);
  await db.exec("set session_replication_role = origin");
});
afterAll(async () => { await db?.close(); });

const inUse = async (paths: string[], role = "service_role") => {
  await db.exec(`set role ${role}`);
  try {
    return (await db.query<{ r: string[] }>("select public.fortius_inmuebles_public_files_in_use($1::text[], 'casa') r", [paths.map(needle)])).rows[0].r.sort();
  } finally { await db.exec("reset role"); }
};

it("ve los usos más allá de 1000 registros, en fichas de Herramientas y en Eliminados", async () => {
  const start = performance.now();
  expect(await inUse(["inmuebles/casa/compartida.jpg", "inmuebles/casa/en-ficha.jpg", "inmuebles/casa/en-eliminados.jpg", "inmuebles/casa/libre.jpg"]))
    .toEqual([needle("inmuebles/casa/compartida.jpg"), needle("inmuebles/casa/en-eliminados.jpg"), needle("inmuebles/casa/en-ficha.jpg")]);
  const ms = performance.now() - start;
  console.info(`archivos en uso: ${Math.round(ms)} ms con 20 000 registros y 5000 fichas`);
  expect(ms).toBeLessThan(3000);
});

it("no cuenta el propio inmueble ni sus versiones anteriores", async () => {
  expect(await inUse(["inmuebles/casa/a.jpg", "inmuebles/casa/version-propia.jpg"])).toEqual([]);
});

it("solo el servidor puede preguntar", async () => {
  await expect(inUse(["inmuebles/casa/a.jpg"], "authenticated")).rejects.toThrow(/permission denied/);
});

it("lista para borrar solo lo retirado hace más de 30 días en el almacenamiento privado", async () => {
  await db.exec("set role service_role");
  try {
    expect((await db.query<{ r: string }>("select r from public.fortius_inmuebles_retired_public_files_due(100) r")).rows.map(row => row.r)).toEqual(["retirados/inmuebles/casa/vieja.jpg"]);
    // Sin inmueble propio (la purga): cuenta los usos de todos los inmuebles.
    expect((await db.query<{ r: string[] }>("select public.fortius_inmuebles_public_files_in_use($1::text[], null) r", [[needle("inmuebles/casa/a.jpg")]])).rows[0].r).toEqual([needle("inmuebles/casa/a.jpg")]);
  } finally { await db.exec("reset role"); }
  await db.exec("set role authenticated");
  try { await expect(db.query("select public.fortius_inmuebles_retired_public_files_due(100)")).rejects.toThrow(/permission denied/); }
  finally { await db.exec("reset role"); }
});
