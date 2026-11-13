import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { projectTeamProperty } from "@/lib/backend/validation";

// SEG-A1 (auditoría del 13/11/2026, COR-23, DEC-43): el recorte de los inmuebles ajenos vive en la base,
// no solo en el servidor del panel. Un asesor no puede leer por la API de datos lo privado de otro.
let db: PGlite;
const director = "56000000-0000-4000-8000-000000000001", ana = "56000000-0000-4000-8000-000000000002", beto = "56000000-0000-4000-8000-000000000003";
const sinCuenta = "56000000-0000-4000-8000-000000000004";
async function as<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const put = (data: Record<string, unknown>) =>
  db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,null)", [data.slug, JSON.stringify(data)]);
const direct = () => db.query<{ id: string; data: Record<string, unknown> }>("select id,data from public.fortius_inmuebles_records where collection='propiedades' order by id");
const team = (id: string | null = null) => db.query<{ id: string; data: Record<string, unknown>; version: number }>("select * from public.fortius_inmuebles_team_properties($1)", [id]);
const property = (slug: string, asesorId: string, extra: Record<string, unknown> = {}) => ({
  slug, codigo: `ENSAYO-${slug.toUpperCase()}`, titulo: "Casa de ensayo", tipo: "casa", operacion: "venta", precio: { modalidad: "publico", monto: 3000000, moneda: "MXN" },
  zona: "Ensayo", direccionAproximada: "Ensayo", descripcion: ["Ejemplo"], ficha: {}, amenidades: [],
  galeria: [{ src: "/hero/casa-ejemplo.jpg", alt: "Fachada" }, { src: "https://ejemplo.supabase.co/storage/v1/object/sign/fortius-inmuebles-private/x.jpg?token=t", alt: "Privada" }],
  asesorId, creditoDisponible: false, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-11-13", demo: true, publicada: false,
  llaves: { ubicacion: "Oficina de ensayo" }, ...extra,
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
    insert into auth.users values ('${director}'),('${ana}'),('${beto}'),('${sinCuenta}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${director}','admin'),('${ana}','editor'),('${beto}','editor'),('${sinCuenta}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
      ('asesores','ana','{"id":"ana","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
      ('asesores','beto','{"id":"beto","nombre":"Beto","cargo":"Asesor","iniciales":"BB","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${ana}','ana'),('${beto}','beto');`);
  await as(ana, () => put(property("de-ana", "ana")));
  await as(beto, () => put(property("de-beto", "beto")));
});
afterAll(async () => { await db?.close(); });

describe("lectura de inmuebles por asesor", () => {
  it("la lectura directa solo trae los propios", async () => {
    expect((await as(ana, direct)).rows.map(row => row.id)).toEqual(["de-ana"]);
    expect((await as(beto, direct)).rows.map(row => row.id)).toEqual(["de-beto"]);
    expect((await as(sinCuenta, direct)).rows).toEqual([]);
  });

  it("el director sigue leyendo todo directo", async () => {
    expect((await as(director, direct)).rows.map(row => row.id)).toEqual(["de-ana", "de-beto"]);
  });

  it("la lectura del equipo trae los ajenos recortados igual que el servidor del panel", async () => {
    const rows = (await as(ana, () => team())).rows;
    expect(rows.map(row => row.id).sort()).toEqual(["de-ana", "de-beto"]);
    const own = rows.find(row => row.id === "de-ana")!, other = rows.find(row => row.id === "de-beto")!;
    expect(own.data.llaves).toEqual({ ubicacion: "Oficina de ensayo" });
    expect(own.data.galeria).toHaveLength(2);
    const full = (await as(director, () => team("de-beto"))).rows[0].data;
    expect(other.data).toEqual(projectTeamProperty(full));
    expect(other.data).not.toHaveProperty("llaves");
    expect(other.data.galeria).toEqual([{ src: "/hero/casa-ejemplo.jpg", alt: "Fachada" }]);
  });

  it("de un compartido ajeno solo queda la inmobiliaria", async () => {
    const shared = { ...property("de-beto", "beto"), origen: "compartido", aliado: { inmobiliaria: "Aliada de ensayo", contacto: "Contacto de ensayo", porcentaje: 50 } };
    const view = (await db.query<{ v: Record<string, unknown> }>("select public.fortius_inmuebles_team_property_view($1::jsonb) v", [JSON.stringify(shared)])).rows[0].v;
    expect(view.aliado).toEqual({ inmobiliaria: "Aliada de ensayo" });
    expect(view).toEqual(projectTeamProperty(shared));
  });

  it("un id pide un solo inmueble; sin sesión del personal no hay nada", async () => {
    expect((await as(ana, () => team("de-beto"))).rows.map(row => row.id)).toEqual(["de-beto"]);
    await db.exec("set role anon");
    try { await expect(team()).rejects.toThrow(); } finally { await db.exec("reset role"); }
  });

  it("el asesor sigue guardando su inmueble con la política nueva", async () => {
    const version = (await as(director, () => team("de-ana"))).rows[0].version;
    await as(ana, () => db.query("select public.fortius_inmuebles_put_record('propiedades','de-ana',$1::jsonb,$2)", [JSON.stringify(property("de-ana", "ana", { titulo: "Casa de ensayo editada" })), version]));
    expect((await as(ana, direct)).rows[0].data.titulo).toBe("Casa de ensayo editada");
  });
});
