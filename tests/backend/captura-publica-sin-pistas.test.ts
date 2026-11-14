import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// C-43 (pendientes): la captura del sitio no revela inmuebles no publicados ni acepta letras en el teléfono.
let db: PGlite;
const propiedad = (slug: string, publicada: boolean) => ({
  slug, codigo: slug.toUpperCase(), titulo: `Casa ficticia ${slug}`, tipo: "casa", operacion: "venta", precio: { modalidad: "consulta" }, zona: "Prueba",
  direccionAproximada: "Prueba", descripcion: ["Prueba"], ficha: {}, amenidades: [], puntosDeInteres: [], asesorId: "luis", creditoDisponible: false,
  galeria: publicada ? [{ src: "https://example.com/casa.jpg", alt: "Fachada de ejemplo" }] : [], estado: "disponible",
  ...(publicada ? { publicada: true, publicadaEl: "2026-11-01" } : {}),
});

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
    ('asesores','luis','{"id":"luis","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}');`);
  // Los requisitos para publicar (captación autorizada, etc.) no son lo que se prueba aquí.
  await db.exec("set session_replication_role = replica");
  for (const [slug, publicada] of [["publicada", true], ["oculta", false]] as const)
    await db.query("insert into public.fortius_inmuebles_records(collection,id,data) values ('propiedades',$1,$2::jsonb)", [slug, JSON.stringify(propiedad(slug, publicada))]);
  await db.exec("set session_replication_role = origin");
});
afterAll(async () => { await db?.close(); });

let visitor = 0;
async function capturar(data: Record<string, unknown>) {
  const result = await db.query<{ id: string }>("select public.fortius_inmuebles_capture_lead($1::jsonb,$2) as id",
    [JSON.stringify({ nombre: "Visitante de ensayo", origen: "interes-propiedad", ...data }), `visitante-${visitor++}`]);
  const id = result.rows[0].id;
  return (await db.query<{ data: Record<string, unknown> }>("select data from public.fortius_inmuebles_records where collection='leads' and id=$1", [id])).rows[0].data;
}

it("un inmueble publicado se liga y el prospecto va a su asesor", async () => {
  const lead = await capturar({ telefono: "664 100 0001", propiedadSlug: "publicada" });
  expect(lead).toMatchObject({ propiedadSlug: "publicada", asesorId: "luis" });
});

it("uno no publicado o inexistente se descarta sin error y sin asignar asesor", async () => {
  for (const [slug, telefono] of [["oculta", "664 100 0002"], ["no-existe", "664 100 0003"]]) {
    const lead = await capturar({ telefono, propiedadSlug: slug });
    expect(lead.propiedadSlug, slug).toBeUndefined();
    expect(lead.asesorId, slug).toBeUndefined();
  }
});

it("el teléfono con letras y el origen manual se rechazan", async () => {
  await expect(capturar({ telefono: "llamame 1234567" })).rejects.toThrow(/Datos de contacto inválidos/);
  await expect(capturar({ telefono: "664 100 0004", origen: "manual" })).rejects.toThrow(/Datos de contacto inválidos/);
  expect(await capturar({ telefono: "+52 (664) 100-0005" })).toMatchObject({ estado: "nuevo" });
});
