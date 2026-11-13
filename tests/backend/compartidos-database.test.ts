import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// PUB-02 (RP-95, DEC-40): un inmueble compartido por otra inmobiliaria se publica sin captación,
// con la inmobiliaria ligada y su autorización escrita adjunta, y lo publica el director.
let db: PGlite;
const director = "55000000-0000-4000-8000-000000000001", ana = "55000000-0000-4000-8000-000000000002";
const authorization = `${director}/55000000-0000-4000-8000-0000000000aa.pdf`;
async function as<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const put = (data: Record<string, unknown>, version: number | null) =>
  db.query<{ r: { version: number; data: Record<string, unknown> } }>("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3) r", [data.slug, JSON.stringify(data), version]);
const versionOf = async (id: string) => (await db.query<{ version: number }>("select version from public.fortius_inmuebles_records where collection='propiedades' and id=$1", [id])).rows[0].version;
const aliado = (extra: Record<string, unknown> = {}) => ({ inmobiliaria: "Inmobiliaria Aliada de Ensayo", contacto: "Contacto de ensayo", porcentaje: 50,
  autorizacion: { path: authorization, nombre: "autorizacion.pdf", fecha: "2026-11-12", firmante: "Gerente de ensayo" }, ...extra });
const property = (slug: string, extra: Record<string, unknown> = {}) => ({
  slug, codigo: `ENSAYO-${slug.toUpperCase()}`, titulo: "Casa compartida de ensayo", tipo: "casa", operacion: "venta", precio: { modalidad: "publico", monto: 3000000, moneda: "MXN" },
  zona: "Ensayo", direccionAproximada: "Ensayo", descripcion: ["Ejemplo"], ficha: {}, amenidades: [], galeria: [{ src: "/hero/casa-ejemplo.jpg", alt: "Fachada" }],
  asesorId: "ana", creditoDisponible: false, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-11-12", demo: true, publicada: false,
  origen: "compartido", aliado: aliado(), ...extra,
});

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${director}'),('${ana}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${director}','admin'),('${ana}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('asesores','ana','{"id":"ana","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${ana}','ana');
    insert into public.fortius_inmuebles_file_uploads(bucket,path,uploaded_by) values ('fortius-inmuebles-private','${authorization}','${director}');`);
  await as(ana, async () => {
    await put(property("compartida"), null);
    await put(property("sin-autorizacion", { aliado: aliado({ autorizacion: undefined }) }), null);
  });
});
afterAll(async () => { await db?.close(); });

describe("publicar un compartido", () => {
  it("el asesor lo da de alta, pero no lo publica", async () => {
    await as(ana, async () => {
      await expect(put(property("compartida", { publicada: true }), await versionOf("compartida"))).rejects.toMatchObject({ code: "PT403" });
    });
  });

  it("sin autorización adjunta no se publica, ni con un archivo que no se subió", async () => {
    await as(director, async () => {
      await expect(put(property("sin-autorizacion", { publicada: true, aliado: aliado({ autorizacion: undefined }) }), await versionOf("sin-autorizacion"))).rejects.toMatchObject({ code: "PT409" });
      const forged = aliado({ autorizacion: { path: `${director}/55000000-0000-4000-8000-0000000000bb.pdf`, fecha: "2026-11-12", firmante: "Gerente de ensayo" } });
      await expect(put(property("sin-autorizacion", { publicada: true, aliado: forged }), await versionOf("sin-autorizacion"))).rejects.toMatchObject({ code: "PT409" });
    });
  });

  it("el director lo publica con la inmobiliaria y su autorización, sin captación", async () => {
    await as(director, async () => { await put(property("compartida", { publicada: true }), await versionOf("compartida")); });
  });

  it("el sitio dice con quién colabora y no muestra contacto, porcentaje ni autorización", async () => {
    await db.exec("set role anon");
    try {
      const rows = (await db.query<{ data: Record<string, unknown> }>("select data from public.fortius_inmuebles_public_records('propiedades')")).rows.map(row => row.data);
      const shared = rows.find(row => row.slug === "compartida");
      expect(shared).toMatchObject({ colaboracion: "Inmobiliaria Aliada de Ensayo" });
      expect(JSON.stringify(shared)).not.toMatch(/Contacto de ensayo|Gerente de ensayo|autorizacion|porcentaje|aliado/);
      expect(rows.find(row => row.slug === "sin-autorizacion")).toBeUndefined();
    } finally { await db.exec("reset role"); }
  });
});

it("los datos de la inmobiliaria se validan en la base", async () => {
  await as(director, async () => {
    await expect(put(property("mala", { origen: "prestado" }), null)).rejects.toMatchObject({ message: "Origen del inmueble inválido" });
    await expect(put(property("mala", { aliado: aliado({ porcentaje: 140 }) }), null)).rejects.toMatchObject({ message: "Datos de la inmobiliaria aliada inválidos" });
  });
});
