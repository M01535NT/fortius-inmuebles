import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// PN-06 · cola de la Bandeja en el servidor (DEC-54, RP-101): quién la ve, qué no cambia y que no se borra.
const DIR = "71000000-0000-4000-8000-0000000000d1";
const A = "71000000-0000-4000-8000-0000000000a1";
const B = "71000000-0000-4000-8000-0000000000b1";
let db: PGlite;

async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
  try { return await fn(); } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub','',false);"); }
}
const ruta = (uid: string, n: string) => `${uid}/0000000${n}-0000-4000-8000-000000000000.pdf`;
const anotar = (uid: string, n: string, extra = "") =>
  db.query<{ id: string; version: number; responsable_id: string | null }>(
    `insert into public.fortius_inmuebles_bandeja (staging_path, nombre, tipo, bytes${extra ? ", responsable_id" : ""})
     values ($1, 'Predial de ejemplo.pdf', 'application/pdf', 1200${extra ? ", $2" : ""}) returning id, version, responsable_id`,
    extra ? [ruta(uid, n), extra] : [ruta(uid, n)],
  );
const contar = async () => Number((await db.query<{ n: number }>("select count(*)::int n from public.fortius_inmuebles_bandeja")).rows[0].n);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${DIR}'), ('${A}'), ('${B}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((n) => n.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(f, dir), "utf8"));
  await db.exec(`grant usage on schema public to authenticated;
    insert into public.fortius_inmuebles_staff (user_id, role) values ('${DIR}','admin'), ('${A}','editor'), ('${B}','editor');
    insert into public.fortius_inmuebles_records (collection, id, data) values
      ('asesores','as-dir','{"id":"as-dir","nombre":"Dirección ficticia","cargo":"Director","iniciales":"DF","activo":true}'),
      ('asesores','as-a','{"id":"as-a","nombre":"Asesora ficticia","cargo":"Asesor","iniciales":"AA","activo":true}'),
      ('asesores','as-b','{"id":"as-b","nombre":"Asesor ficticio","cargo":"Asesor","iniciales":"AB","activo":true}');
    insert into public.fortius_inmuebles_adviser_accounts (user_id, asesor_id) values ('${DIR}','as-dir'), ('${A}','as-a'), ('${B}','as-b');`);
});
afterAll(async () => { await db?.close(); });

describe("cola de la Bandeja (DEC-54)", () => {
  it("cada quien anota solo lo que subió, a su nombre por omisión", async () => {
    const r = await como(A, () => anotar(A, "1"));
    expect(r.rows[0].responsable_id).toBe("as-a");
    expect(Number(r.rows[0].version)).toBe(1);
    // La carga temporal de otro no se anota como propia.
    await expect(como(A, () => anotar(B, "2"))).rejects.toThrow();
    // El asesor no se la asigna a otro; el director sí.
    await expect(como(A, () => anotar(A, "3", "as-b"))).rejects.toThrow();
    expect((await como(DIR, () => anotar(DIR, "4", "as-b"))).rows[0].responsable_id).toBe("as-b");
  });

  it("el asesor ve lo suyo y lo que tiene a su cargo; el director ve todo", async () => {
    expect(await como(A, contar)).toBe(1);
    expect(await como(B, contar)).toBe(1);
    expect(await como(DIR, contar)).toBe(2);
  });

  it("guardar pide destino, versión al día y no cambia los datos del archivo", async () => {
    const id = (await como(A, () => db.query<{ id: string }>("select id from public.fortius_inmuebles_bandeja"))).rows[0].id;
    await expect(como(A, () => db.query("update public.fortius_inmuebles_bandeja set estado='guardado', version=1 where id=$1", [id]))).rejects.toThrow();
    await expect(como(A, () => db.query("update public.fortius_inmuebles_bandeja set nombre='Otro.pdf', version=1 where id=$1", [id])))
      .rejects.toMatchObject({ message: "Esos datos del archivo no se cambian" });
    const ok = await como(A, () => db.query<{ version: number; resuelto_el: string | null }>(
      "update public.fortius_inmuebles_bandeja set estado='guardado', destino_clase='asunto', destino_ref='asunto-ejemplo', version=1 where id=$1 returning version, resuelto_el", [id]));
    expect(Number(ok.rows[0].version)).toBe(2);
    expect(ok.rows[0].resuelto_el).not.toBeNull();
    await expect(como(A, () => db.query("update public.fortius_inmuebles_bandeja set estado='descartado', destino_clase=null, destino_ref=null, version=1 where id=$1", [id])))
      .rejects.toMatchObject({ message: "Alguien más cambió este archivo de la Bandeja. Vuelve a abrirla." });
    // Deshacer lo regresa a «por confirmar».
    const atras = await como(A, () => db.query<{ resuelto_el: string | null }>(
      "update public.fortius_inmuebles_bandeja set estado='por_confirmar', destino_clase=null, destino_ref=null, version=2 where id=$1 returning resuelto_el", [id]));
    expect(atras.rows[0].resuelto_el).toBeNull();
  });

  it("no se borra: se descarta, y lo descartado no regresa", async () => {
    const id = (await como(A, () => db.query<{ id: string }>("select id from public.fortius_inmuebles_bandeja"))).rows[0].id;
    await expect(como(A, () => db.query("delete from public.fortius_inmuebles_bandeja where id=$1", [id]))).rejects.toThrow();
    await como(A, () => db.query("update public.fortius_inmuebles_bandeja set estado='descartado', version=3 where id=$1", [id]));
    await expect(como(A, () => db.query("update public.fortius_inmuebles_bandeja set estado='por_confirmar', version=4 where id=$1", [id])))
      .rejects.toMatchObject({ message: "Este archivo ya se descartó" });
  });
});
