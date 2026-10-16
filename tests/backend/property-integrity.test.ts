import { afterAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { propiedades } from "../fixtures/propiedades";
import { parseRecord, projectPublic } from "@/lib/backend/validation";

const sample = propiedades[0];
const rental = { ...sample, slug: "renta-prueba", codigo: "REN-01", operacion: "renta" as const, estado: "rentada" as const };
const sale = { ...sample, slug: "venta-prueba", codigo: "VEN-01", operacion: "venta" as const, estado: "vendida" as const };

test("rental status survives admin validation and public projection; mismatched operation statuses fail", () => {
  expect(parseRecord("propiedades", rental.slug, rental).estado).toBe("rentada");
  expect(projectPublic("propiedades", [{ ...rental, publicada: true }])[0]?.estado).toBe("rentada");
  expect(() => parseRecord("propiedades", rental.slug, { ...rental, estado: "vendida" })).toThrow();
  expect(() => parseRecord("propiedades", sale.slug, { ...sale, estado: "rentada" })).toThrow();
});

let db: PGlite;
const member = "40000000-0000-4000-8000-000000000001";
const filename = new URL("../../supabase/migrations/20261005062000_fortius_inmuebles_property_integrity.sql", import.meta.url);
const property = (slug: string, codigo: string, operacion = "venta", estado = "disponible") => ({ ...sample, slug, codigo, operacion, estado, asesorId: "", publicada: false });
async function save(slug: string, data: unknown, version: number | null = null) {
  return db.query<{ record: { data: Record<string, unknown>; version: number } }>("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,$3::bigint) as record", [slug, JSON.stringify(data), version]);
}
async function initDb() {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role; grant all on storage.objects to anon, authenticated, service_role;
    insert into auth.users values ('${member}');`);
  for (const name of ["202609030001_fortius_inmuebles_backend.sql", "202609030002_fortius_inmuebles_record_revisions.sql", "202609060003_fortius_inmuebles_identity.sql", "20261005035035_fortius_inmuebles_identity.sql"]) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  await db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'admin')", [member]);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
  await save("legacy-one", property("legacy-one", "INM-2026-0001"));
  await save("legacy-two", property("legacy-two", "INM-2026-0001"));
  await db.exec("reset role");
  await db.exec(await readFile(filename, "utf8"));
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
}
afterAll(async () => { await db?.close(); });

test("database keeps old duplicates reviewable but rejects new case-insensitive duplicates", async () => {
  await initDb();
  const old = await db.query<{ data: { codigo: string } }>("select data from public.fortius_inmuebles_records where collection='propiedades' and id like 'legacy-%'");
  expect(old.rows.map(row => row.data.codigo)).toEqual(["INM-2026-0001", "INM-2026-0001"]);
  await expect(save("third", property("third", " inm-2026-0001 "))).rejects.toMatchObject({ code: "PT409" });
  await expect(save("legacy-two", property("legacy-two", "INM-2026-0001", "renta", "rentada"), 1)).resolves.toBeTruthy();
  await expect(save("legacy-two", property("legacy-two", "INM-2026-0002", "renta", "rentada"), 2)).resolves.toBeTruthy();
  await expect(save("third", property("third", "INM-2026-0001"))).rejects.toMatchObject({ code: "PT409" });
  await expect(save("third", property("third", "INM-2026-0003", "renta", "vendida"))).rejects.toMatchObject({ code: "PT400" });
  await expect(save("third", property("third", "INM-2026-0003", "renta", "rentada"))).resolves.toBeTruthy();
});
