import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { deleteRecord, putRecord } from "@/lib/backend/repository";

let db: PGlite;
const member = "20000000-0000-4000-8000-000000000001";
const outsider = "20000000-0000-4000-8000-000000000002";
const property = (slug: string, titulo = "Actual") => ({ slug, codigo: "TEST", titulo, tipo: "casa", operacion: "venta", precio: { modalidad: "consulta" }, zona: "Tijuana", direccionAproximada: "Centro", descripcion: ["Conservar"], ficha: {}, amenidades: [], galeria: [{ src: "/hero/casa-playa.webp", alt: "Casa" }], asesorId: "", creditoDisponible: false, puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-09-03", demo: false, publicada: false });
type RecordResult = { id: string; data: Record<string, unknown>; version: number; createdAt: string; updatedAt: string };
async function save(id: string, data: unknown = property(id), version: number | null = null) {
  return (await db.query<{ record: RecordResult }>("select public.mnt_put_record('propiedades',$1,$2::jsonb,$3::bigint) as record", [id, JSON.stringify(data), version])).rows[0].record;
}
async function saveLegacy(id: string, data: unknown = property(id), version: number | null = null) {
  return (await db.query<{ record: RecordResult }>("select public.cota_put_record('propiedades',$1,$2::jsonb,$3::bigint) as record", [id, JSON.stringify(data), version])).rows[0].record;
}
async function remove(id: string, version: number) { return db.query("select public.mnt_delete_record('propiedades',$1,$2::bigint)", [id, version]); }
async function role(name = "authenticated", id: string | null = member) {
  await db.exec(`set role ${name}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
}
let opening: RecordResult;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    create schema storage; create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role; grant all on storage.objects to anon, authenticated, service_role;
    insert into auth.users values ('${member}'), ('${outsider}');`);
  await db.exec(await readFile(new URL("../../supabase/migrations/202609030001_cota_backend.sql", import.meta.url), "utf8"));
  await db.query("insert into public.cota_staff(user_id,role) values ($1,'admin')", [member]);
  await role();
  await saveLegacy("existing");
  await saveLegacy("existing", property("existing", "Segunda"), 1);
  opening = await saveLegacy("existing", property("existing", "Borrador existente"), 2);
  await db.exec("reset role");
  await db.exec(await readFile(new URL("../../supabase/migrations/202609030002_cota_record_revisions.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../../supabase/migrations/202609060003_mnt_identity.sql", import.meta.url), "utf8"));
  await role();
});
afterAll(async () => { await db?.close(); });

test("populated001 upgrade preserves bytes, timestamps, revisions and an existing unsaved draft", async () => {
  const row = (await db.query<{ data: unknown; version: number; createdAt: string; updatedAt: string }>('select data, version::int, created_at::text as "createdAt", updated_at::text as "updatedAt" from public.mnt_records where id=\'existing\'')).rows[0];
  expect(row.data).toEqual(opening.data);
  expect(row.version).toBe(3);
  expect(new Date(row.createdAt).toISOString()).toBe(new Date(opening.createdAt).toISOString());
  expect(new Date(row.updatedAt).toISOString()).toBe(new Date(opening.updatedAt).toISOString());
  const savedDraft = await save("existing", { ...opening.data, titulo: "Borrador guardado" }, opening.version);
  expect(savedDraft.version).toBe(4);
  await remove("existing", savedDraft.version);
  const recreated = await save("existing");
  expect(recreated.version).toBeGreaterThan(4);
  await expect(save("existing", opening.data, opening.version)).rejects.toMatchObject({ code: "PT409" });
  await expect(remove("existing", opening.version)).rejects.toMatchObject({ code: "PT409" });
});

test.each(["put", "delete"])("direct RPC rejects stale %s after reusing a property slug", async (operation) => {
  const id = `reused-${operation}`;
  const first = await save(id, property(id, "Vieja"));
  await remove(id, first.version);
  const current = await save(id, property(id, "Nueva"));
  if (operation === "put") await expect(save(id, first.data, first.version)).rejects.toMatchObject({ code: "PT409" });
  else await expect(remove(id, first.version)).rejects.toMatchObject({ code: "PT409" });
  expect(current.version).toBeGreaterThan(first.version);
  const rows = await db.query<{ data: Record<string, unknown> }>("select data from public.mnt_records where id=$1", [id]);
  expect(rows.rows[0].data.titulo).toBe("Nueva");
});

test("racing direct RPC mutations accept one writer, preserve create-only and never reuse acknowledged revisions", async () => {
  const id = "race";
  const creates = await Promise.allSettled([save(id), save(id)]);
  expect(creates.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
  const first = (creates.find((result) => result.status === "fulfilled") as PromiseFulfilledResult<RecordResult>).value;
  const writes = await Promise.allSettled([save(id, property(id, "A"), first.version), save(id, property(id, "B"), first.version)]);
  expect(writes.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
  const next = (writes.find((result) => result.status === "fulfilled") as PromiseFulfilledResult<RecordResult>).value;
  await remove(id, next.version);
  const recreated = await save(id);
  expect(recreated.version).toBeGreaterThan(next.version);
  await expect(remove(id, next.version)).rejects.toMatchObject({ code: "PT409" });
});

test("numeric BFF contract maps both stale operations after recreation to HTTP409", async () => {
  const client = { rpc: async (fn: string, args: Record<string, unknown>) => {
    try {
      const data = fn === "mnt_put_record" ? await save(String(args.p_id), args.p_data, args.p_version as number | null) : await remove(String(args.p_id), args.p_version as number);
      return { data, error: null };
    } catch (error) { return { data: null, error }; }
  } } as unknown as Parameters<typeof putRecord>[0];
  const first = await putRecord(client, "propiedades", "bff", { data: property("bff"), version: null });
  await deleteRecord(client, "propiedades", "bff", { version: first.version });
  await putRecord(client, "propiedades", "bff", { data: property("bff", "Nueva"), version: null });
  await expect(putRecord(client, "propiedades", "bff", { data: first.data, version: first.version })).rejects.toMatchObject({ status: 409 });
  await expect(deleteRecord(client, "propiedades", "bff", { version: first.version })).rejects.toMatchObject({ status: 409 });
});

test("ledger cannot be read, reset or bypassed by anonymous, outsider or staff roles", async () => {
  for (const [name, id] of [["anon", null], ["authenticated", outsider], ["authenticated", member]]) {
    await role(name!, id);
    await expect(db.query("select * from public.mnt_record_revisions")).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("delete from public.mnt_record_revisions")).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("update public.mnt_records set version=1")).rejects.toMatchObject({ code: "42501" });
    if (id !== member) await expect(save("forbidden")).rejects.toMatchObject({ code: name === "anon" ? "42501" : "PT403" });
  }
  await role();
});

test("deleted content is not retained, and privileged inserts cannot reset a prior revision", async () => {
  const first = await save("privileged", property("privileged", "PRIVATE-DELETED-CONTENT"));
  await remove("privileged", first.version);
  await db.exec("reset role");
  const ledger = await db.query("select * from public.mnt_record_revisions where id='privileged'");
  expect(ledger.rows).toEqual([{ collection: "propiedades", id: "privileged", last_version: 1 }]);
  await role("service_role", null);
  await db.query("insert into public.mnt_records(collection,id,data,version) values ('propiedades','privileged',$1::jsonb,1)", [JSON.stringify(property("privileged"))]);
  const row = await db.query<{ version: number }>("select version from public.mnt_records where id='privileged'");
  expect(row.rows[0].version).toBe(2);
  await expect(db.query("delete from public.mnt_record_revisions")).rejects.toMatchObject({ code: "42501" });
  await role();
  await expect(remove("privileged", first.version)).rejects.toMatchObject({ code: "PT409" });
});

test("failed referenced deletion keeps both the record and revision usable", async () => {
  const adviser = { id: "a-ref", nombre: "Ana", cargo: "Asesora", iniciales: "AA", activo: true };
  await db.query("select public.mnt_put_record('asesores','a-ref',$1::jsonb,null)", [JSON.stringify(adviser)]);
  const first = await save("referenced", { ...property("referenced"), asesorId: "a-ref" });
  await expect(db.query("select public.mnt_delete_record('asesores','a-ref',1)")).rejects.toMatchObject({ code: "PT409" });
  await remove("referenced", first.version);
  await db.query("select public.mnt_delete_record('asesores','a-ref',1)");
  const next = await db.query<{ record: RecordResult }>("select public.mnt_put_record('asesores','a-ref',$1::jsonb,null) as record", [JSON.stringify(adviser)]);
  expect(next.rows[0].record.version).toBe(2);
});

test("privileged updates cannot reset a revision or move a record to another identity", async () => {
  const first = await save("stable-identity");
  await role("service_role", null);
  const updated = await db.query<{ version: number }>("update public.mnt_records set version=1 where id='stable-identity' returning version");
  expect(updated.rows[0].version).toBeGreaterThan(first.version);
  await expect(db.query("update public.mnt_records set id='moved' where id='stable-identity'")).rejects.toMatchObject({ code: "PT400" });
  await role();
  await expect(remove("stable-identity", first.version)).rejects.toMatchObject({ code: "PT409" });
});

test("safe integer exhaustion rejects instead of wrapping, rounding or losing current data", async () => {
  const current = await save("exhausted");
  await db.exec("reset role");
  await db.exec("update public.mnt_record_revisions set last_version=9007199254740991 where id='exhausted'");
  await role();
  await expect(save("exhausted", property("exhausted", "Must not persist"), current.version)).rejects.toMatchObject({ code: "PT409" });
  expect((await db.query<{ data: Record<string, unknown> }>("select data from public.mnt_records where id='exhausted'")).rows[0].data.titulo).toBe("Actual");
});
