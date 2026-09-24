import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

let db: PGlite;
const member = "30000000-0000-4000-8000-000000000001";
const base = { id: "editorial", slug: "noticia-local", titulo: "Mercado local", resumen: "Contexto", contenido: "Datos", estado: "borrador", actualizadoEl: "2026-09-20T10:00:00.000Z", categoria: "mercado", formato: "actualidad", destacado: true, fuenteNombre: "Fuente", fuenteUrl: "https://example.com/informe" };
async function put(data: Record<string, unknown>, version: number | null = null) {
  return (await db.query<{ r: { data: Record<string, unknown>; version: number } }>("select public.mnt_put_record('posts',$1,$2::jsonb,$3) r", [data.id, JSON.stringify(data), version])).rows[0].r;
}
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
  await db.query("insert into public.mnt_staff(user_id,role) values ($1,'editor')", [member]);
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
});
afterAll(async () => { await db?.close(); });
beforeEach(async () => { await db.exec("reset role; set role authenticated"); });

test("first publication is stamped by the database and survives edits and republishing", async () => {
  const draft = await put({ ...base, publicadoEl: "2099-01-01T00:00:00Z" });
  expect(draft.data).not.toHaveProperty("publicadoEl");
  const published = await put({ ...base, estado: "publicado" }, 1);
  expect(typeof published.data.publicadoEl).toBe("string");
  expect(Date.parse(published.data.publicadoEl as string)).toBeLessThanOrEqual(Date.now() + 1000);
  const edited = await put({ ...base, estado: "publicado", publicadoEl: "2099-01-01T00:00:00Z" }, 2);
  expect(edited.data.publicadoEl).toBe(published.data.publicadoEl);
  await put({ ...base }, 3);
  const republished = await put({ ...base, estado: "publicado" }, 4);
  expect(republished.data.publicadoEl).toBe(published.data.publicadoEl);
});

test("public SQL projection includes only editorial fields and safe sources, and excludes drafts", async () => {
  await put({ ...base, id: "public-source", slug: "fuente-publica", estado: "publicado", internalNotes: "private" });
  await put({ ...base, id: "private-source", slug: "fuente-privada", estado: "publicado", fuenteUrl: "https://example.com/mnt-private/document.pdf" });
  await put({ ...base, id: "draft-source", slug: "borrador" });
  await db.exec("reset role; set role anon");
  const rows = (await db.query<{ data: Record<string, unknown> }>("select * from public.mnt_public_records('posts')")).rows.map((row) => row.data);
  expect(rows.find((row) => row.id === "public-source")).toMatchObject({ formato: "actualidad", categoria: "mercado", destacado: true, fuenteUrl: "https://example.com/informe" });
  expect(rows.find((row) => row.id === "public-source")).not.toHaveProperty("internalNotes");
  expect(rows.find((row) => row.id === "private-source")).not.toHaveProperty("fuenteUrl");
  expect(rows.find((row) => row.id === "draft-source")).toBeUndefined();
  await db.exec("reset role; set role authenticated");
});

test("invalid editorial metadata is rejected at the database boundary", async () => {
  for (const patch of [{ formato: "unknown" }, { categoria: "unknown" }, { destacado: "yes" }, { autor: 123 }, { fuenteUrl: "javascript:evil()" }]) {
    await expect(put({ ...base, id: "bad", slug: "invalid", ...patch })).rejects.toMatchObject({ code: "PT400" });
  }
});

test("editing a legacy published article does not invent its first publication date", async () => {
  await db.exec("reset role");
  await db.query("insert into public.mnt_records(collection,id,data) values ('posts','legacy',$1::jsonb)", [JSON.stringify({ ...base, id: "legacy", slug: "anterior", estado: "publicado" })]);
  // Simulate a pre-migration record without a known first publication date.
  await db.exec("alter table public.mnt_records disable trigger user");
  await db.exec("update public.mnt_records set data=data-'publicadoEl' where id='legacy'; alter table public.mnt_records enable trigger user");
  await db.exec("set role authenticated");
  const edited = await put({ ...base, id: "legacy", slug: "anterior", estado: "publicado" }, 1);
  expect(edited.data).not.toHaveProperty("publicadoEl");
});
