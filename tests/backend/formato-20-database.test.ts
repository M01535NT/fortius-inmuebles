import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { FORMATOS } from "@/lib/formatos/catalog";

/* Las migraciones 20261113150000, 20261113161000, 20261113170000 y 20261113171000 agregan los formatos 20 a 23 sin quitar ninguno de los que ya existían. */
let db: PGlite;
const exp = "59000000-0000-4000-8000-000000000020";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente de ejemplo","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio,operacion) values ('${exp}','c-own','own','EXP-FORMATO-20','renta');`);
});
afterAll(async () => { await db?.close(); });

const crear = (formato: string) => db.query("insert into public.fortius_inmuebles_formato_drafts(expediente_id,formato_id) values ($1,$2)", [exp, formato]);

it("acepta el 20 y todos los formatos del catálogo, uno por uno", async () => {
  const ids = FORMATOS.map(f => f.id);
  expect(ids).toEqual(expect.arrayContaining(["20", "21", "22", "23"]));
  for (const id of ids) await expect(crear(id), id).resolves.toBeTruthy();
});

it("sigue rechazando un formato que no existe, con una sola restricción sobre formato_id", async () => {
  await expect(crear("24")).rejects.toThrow(/formato_id_check/);
  const checks = await db.query<{ n: number }>("select count(*)::int n from pg_constraint where conrelid='public.fortius_inmuebles_formato_drafts'::regclass and contype='c' and pg_get_constraintdef(oid) like '%formato_id%'");
  expect(checks.rows[0].n).toBe(1);
});
