import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// Plaza o conjunto (DEC-32 y DEC-33): la plaza se guarda como inmueble y un local suelto la referencia.
let db: PGlite;
const member = "40000000-0000-4000-8000-000000000001";
const adviser = { id: "plaza-adviser", nombre: "Ana", cargo: "Asesora", iniciales: "AA", activo: true };
const base = { codigo: "", titulo: "Inmueble", operacion: "venta", precio: { modalidad: "consulta" }, zona: "Tijuana", direccionAproximada: "Zona Río", descripcion: ["Ejemplo"], ficha: {}, amenidades: [], galeria: [{ src: "/ejemplo.webp", alt: "Ejemplo" }], documentos: [], asesorId: "plaza-adviser", creditoDisponible: false, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-10-28", demo: true, publicada: true };
async function put(collection: string, id: string, data: Record<string, unknown>) {
  return (await db.query<{ r: { data: Record<string, unknown> } }>("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,null) r", [collection, id, JSON.stringify(data)])).rows[0].r;
}
const property = (slug: string, extra: Record<string, unknown>) => put("propiedades", slug, { ...base, slug, codigo: slug.toUpperCase(), ...extra });

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
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'admin')", [member]);
  // Solo en esta base en memoria: publicar sin la captación autorizada que exige el flujo real.
  await db.exec("alter table public.fortius_inmuebles_records disable trigger fortius_01_guard_guided_publication");
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
  await put("asesores", adviser.id, adviser);
});
afterAll(async () => { await db?.close(); });

test("a plaza is saved as a property and a loose local keeps its plaza in the public projection", async () => {
  await property("plaza-ejemplo", { tipo: "plaza", titulo: "Plaza de ejemplo" });
  const local = await property("local-ejemplo", { tipo: "local", conjunto: "plaza-ejemplo" });
  expect(local.data.conjunto).toBe("plaza-ejemplo");
  await db.exec("reset role; set role anon");
  try {
    const rows = (await db.query<{ data: Record<string, unknown> }>("select data from public.fortius_inmuebles_public_records('propiedades')")).rows.map((row) => row.data);
    expect(rows.find((row) => row.slug === "plaza-ejemplo")).toMatchObject({ tipo: "plaza" });
    expect(rows.find((row) => row.slug === "local-ejemplo")).toMatchObject({ tipo: "local", conjunto: "plaza-ejemplo" });
    expect(rows.find((row) => row.slug === "plaza-ejemplo")).not.toHaveProperty("conjunto");
  } finally { await db.exec("reset role; set role authenticated"); }
});

test("a malformed plaza reference, or a plaza inside another plaza, is rejected", async () => {
  for (const extra of [{ tipo: "local", conjunto: { slug: "plaza-ejemplo" } }, { tipo: "local", conjunto: "../plaza" }, { tipo: "plaza", conjunto: "plaza-ejemplo" }]) {
    await expect(property("local-invalido", extra)).rejects.toMatchObject({ code: "PT400", message: "Plaza o conjunto inválido" });
  }
});
