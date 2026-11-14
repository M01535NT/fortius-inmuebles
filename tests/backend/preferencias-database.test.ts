import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// UX-02 y UX-05: cada quien ve y cambia solo sus preferencias; nadie las borra ni lee las ajenas.
let db: PGlite;
const ana = "30000000-0000-4000-8000-000000000021", beto = "30000000-0000-4000-8000-000000000022", fuera = "30000000-0000-4000-8000-000000000023";
const as = (user: string) => db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
const T = "public.fortius_inmuebles_user_preferences";

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${ana}'),('${beto}'),('${fuera}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'editor'),($2,'editor')", [ana, beto]);
  await db.exec("set role authenticated");
});
afterAll(async () => { await db?.close(); });

test("cada quien crea, lee y actualiza solo su fila", async () => {
  await as(ana);
  await db.query(`insert into ${T}(user_id,data,version) values ($1,'{"bandeja":{"leidos":{"k":"2026-11-14T00:00:00Z"}}}',1)`, [ana]);
  await expect(db.query(`insert into ${T}(user_id,data) values ($1,'{}')`, [beto])).rejects.toThrow();
  await as(beto);
  expect((await db.query(`select * from ${T}`)).rows).toEqual([]);
  expect((await db.query(`update ${T} set data='{}' where user_id=$1 returning user_id`, [ana])).rows).toEqual([]);
  await as(ana);
  expect((await db.query(`update ${T} set data='{"x":1}', version=2 where user_id=$1 and version=1 returning version`, [ana])).rows).toEqual([{ version: 2 }]);
  expect((await db.query(`delete from ${T} where user_id=$1`, [ana]).catch(e => e)) instanceof Error).toBe(true);
});

test("sin ser del equipo no hay preferencias, y solo se guardan objetos acotados", async () => {
  await as(fuera);
  await expect(db.query(`insert into ${T}(user_id,data) values ($1,'{}')`, [fuera])).rejects.toThrow();
  await as(beto);
  await expect(db.query(`insert into ${T}(user_id,data) values ($1,'[]')`, [beto])).rejects.toThrow();
  await expect(db.query(`insert into ${T}(user_id,data) values ($1,$2::jsonb)`, [beto, JSON.stringify({ big: "x".repeat(70_000) })])).rejects.toThrow();
});
