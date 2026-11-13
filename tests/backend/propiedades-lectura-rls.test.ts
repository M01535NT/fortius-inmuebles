import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  BUG-C09 (COR-23, DEC-43): el recorte de lo privado de los inmuebles de otros asesores (llaves,
  preparación, avisos a compradores, datos del aliado) solo ocurre en /api/admin/collections.
  La RLS de lectura (`record_visible`) deja ver el registro completo, así que un asesor con su propio
  token (cookie de sesión) lo lee directo de PostgREST: select data from fortius_inmuebles_records.
  La migración 20261112160000 dice que la regla «vive en la base para que valga por cualquier camino».
*/
let db: PGlite;
const admin = "54000000-0000-4000-8000-000000000001";
const own = "54000000-0000-4000-8000-000000000002";
const other = "54000000-0000-4000-8000-000000000003";
async function asUser<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
const privado = {
  llaves: { estado: "en_oficina", nota: "Caja fuerte, combinación ficticia 0000" },
  preparacion: { nota: "Seguimiento interno ficticio" },
  avisosCompradores: [{ nota: "Aviso interno ficticio" }],
  aliado: { nombre: "Aliado ficticio", contacto: "6640000000", porcentaje: 1.5, autorizacion: "ficticia" },
};
const inmueble = { slug: "ajeno", codigo: "AJENO", titulo: "Local ficticio de ensayo", tipo: "local", operacion: "renta", precio: { modalidad: "consulta" }, zona: "Prueba", direccionAproximada: "Prueba", descripcion: ["Prueba"], ficha: {}, amenidades: [], galeria: [], asesorId: "other", creditoDisponible: false, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-11-12", demo: true, publicada: false, ...privado };

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
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
      ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
      ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');`);
  await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values ('propiedades','ajeno',$1::jsonb)", [JSON.stringify(inmueble)]);
});
afterAll(async () => { await db?.close(); });

const leer = () => db.query<{ data: Record<string, unknown> }>("select data from public.fortius_inmuebles_records where collection='propiedades' and id='ajeno'").then(r => r.rows);

it("el asesor dueño y el director leen el seguimiento privado del inmueble", async () => {
  for (const uid of [other, admin]) {
    const rows = await asUser(uid, leer);
    expect(rows[0]?.data).toMatchObject({ llaves: privado.llaves, aliado: privado.aliado });
  }
});

it("otro asesor no lee directo de la base el seguimiento privado de un inmueble ajeno", async () => {
  const rows = await asUser(own, leer).catch(() => []);
  for (const row of rows) {
    for (const key of ["llaves", "preparacion", "avisosCompradores"]) expect(row.data).not.toHaveProperty(key);
    expect(row.data.aliado ?? {}).not.toHaveProperty("contacto");
    expect(row.data.aliado ?? {}).not.toHaveProperty("porcentaje");
    expect(row.data.aliado ?? {}).not.toHaveProperty("autorizacion");
  }
});
