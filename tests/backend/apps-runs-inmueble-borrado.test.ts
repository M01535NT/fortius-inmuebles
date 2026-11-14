import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  BUG-C50: `fortius_inmuebles_guard_app_run()` (20261114110000) vuelve a comprobar las referencias del
  contexto en cada UPDATE, también en «Mover a Eliminados» (PATCH /api/admin/apps/runs/[id], que solo
  cambia `deleted_at` y `version`). Si el inmueble ligado ya se eliminó, el trabajo sigue en «Trabajos
  guardados», pero no se puede eliminar: responde PT400 «Inmueble no disponible».
*/
let db: PGlite;
const own = "56000000-0000-4000-8000-000000000002";
const inmueble = { slug: "propio", codigo: "PROPIO", titulo: "Casa ficticia de ensayo", tipo: "casa", operacion: "venta", precio: { modalidad: "consulta" }, zona: "Prueba", direccionAproximada: "Prueba", descripcion: ["Prueba"], ficha: {}, amenidades: [], galeria: [], asesorId: "own", creditoDisponible: false, puntosDeInteres: [] };

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${own}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${own}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own');`);
  await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values ('propiedades','propio',$1::jsonb)", [JSON.stringify(inmueble)]);
});
afterAll(async () => { await db?.close(); });

async function como<T>(fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [own]);
  try { return await fn(); } finally { await db.exec("reset role"); }
}

it("un trabajo ligado a un inmueble que después se eliminó se puede mandar a Eliminados", async () => {
  const creado = await como(() => db.query<{ id: string }>("insert into public.fortius_inmuebles_app_runs(slug,title,input,context) values ('ficha-comercial','Ficha de ensayo','{}'::jsonb,'{\"inmuebleId\":\"propio\"}'::jsonb) returning id"));
  const id = creado.rows[0].id;
  await db.exec("delete from public.fortius_inmuebles_records where collection='propiedades' and id='propio'");
  await expect(como(() => db.query("update public.fortius_inmuebles_app_runs set version=version+1, deleted_at=now() where id=$1 returning id", [id]))).resolves.toBeTruthy();
});
