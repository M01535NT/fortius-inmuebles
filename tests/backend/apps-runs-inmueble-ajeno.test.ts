import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  BUG-C40: `fortius_inmuebles_guard_app_run()` (20261014002133_apps_runs.sql) comprueba que el
  inmueble del contexto exista con un `exists(select … from fortius_inmuebles_records …)` que corre
  con la RLS de quien llama (la función no es SECURITY DEFINER). Desde la política restrictiva de
  20261113120000_propiedades_por_asesor.sql un asesor no ve los inmuebles de otro, así que guardar
  un trabajo de Herramientas ligado a un inmueble ajeno (la ficha comercial, una operación de compra
  sobre el inmueble de un compañero) falla con PT400 «Inmueble no disponible».
*/
let db: PGlite;
const own = "55000000-0000-4000-8000-000000000002";
const other = "55000000-0000-4000-8000-000000000003";
const inmueble = { slug: "ajeno", codigo: "AJENO", titulo: "Local ficticio de ensayo", tipo: "local", operacion: "renta", precio: { modalidad: "consulta" }, zona: "Prueba", direccionAproximada: "Prueba", descripcion: ["Prueba"], ficha: {}, amenidades: [], galeria: [], asesorId: "other", creditoDisponible: false, puntosDeInteres: [] };

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
    insert into auth.users values ('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
      ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
      ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');`);
  await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values ('propiedades','ajeno',$1::jsonb)", [JSON.stringify(inmueble)]);
});
afterAll(async () => { await db?.close(); });

async function guardar(uid: string) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try {
    return await db.query("insert into public.fortius_inmuebles_app_runs(slug,title,input,context) values ('ficha-comercial','Ficha de ensayo','{}'::jsonb,'{\"inmuebleId\":\"ajeno\"}'::jsonb) returning id");
  } finally { await db.exec("reset role"); }
}

it("el asesor dueño guarda un trabajo ligado a su inmueble", async () => {
  await expect(guardar(other)).resolves.toBeTruthy();
});

it("otro asesor también puede guardar un trabajo ligado a ese inmueble (la ficha comercial lo admite)", async () => {
  await expect(guardar(own)).resolves.toBeTruthy();
});
