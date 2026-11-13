import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// DEC-42: los avisos de Hoy solo los escribe el director; las demás notas, cualquiera del equipo.
let db: PGlite;
const editor = "30000000-0000-4000-8000-000000000011", director = "30000000-0000-4000-8000-000000000012";
const as = (user: string) => db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
const put = async (data: Record<string, unknown>, version: number | null = null) =>
  (await db.query<{ r: { version: number } }>("select public.fortius_inmuebles_put_record('notas',$1,$2::jsonb,$3) r", [data.id, JSON.stringify(data), version])).rows[0].r;
const remove = (id: string, version: number) => db.query("select public.fortius_inmuebles_delete_record('notas',$1,$2)", [id, version]);
const note = (id: string, extra: Record<string, unknown> = {}) => ({ id, titulo: "Nota de ensayo", texto: "Texto de ensayo", actualizadoEl: "2026-11-12T10:00:00.000Z", ...extra });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${editor}'),('${director}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.query("insert into public.fortius_inmuebles_staff(user_id,role) values ($1,'editor'),($2,'admin')", [editor, director]);
  await db.exec("set role authenticated");
});
afterAll(async () => { await db?.close(); });

test("el asesor escribe notas, pero no avisos", async () => {
  await as(editor);
  expect((await put(note("nota-equipo"))).version).toBe(1);
  await expect(put(note("aviso-asesor", { aviso: true }))).rejects.toMatchObject({ message: "Solo el director escribe avisos" });
  // Tampoco convierte una nota suya en aviso.
  await expect(put(note("nota-equipo", { aviso: true }), 1)).rejects.toMatchObject({ message: "Solo el director escribe avisos" });
});

test("el director publica un aviso; el asesor lo lee pero no lo cambia ni lo quita", async () => {
  await as(director);
  const saved = await put(note("aviso-director", { aviso: true, texto: "Guardia del sábado" }));
  await as(editor);
  const read = await db.query<{ data: { texto: string } }>("select data from public.fortius_inmuebles_records where collection='notas' and id='aviso-director'");
  expect(read.rows[0]?.data.texto).toBe("Guardia del sábado");
  await expect(put(note("aviso-director", { aviso: true, texto: "Otro texto" }), saved.version)).rejects.toMatchObject({ message: "Solo el director escribe avisos" });
  await expect(put(note("aviso-director", { texto: "Ya no es aviso" }), saved.version)).rejects.toMatchObject({ message: "Solo el director escribe avisos" });
  await expect(remove("aviso-director", saved.version)).rejects.toMatchObject({ message: "Solo el director escribe avisos" });
  await as(director);
  await remove("aviso-director", saved.version);
});
