import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  Tareas ligadas a un prospecto (20261112170000): solo las ve y las cambia quien puede ver al
  prospecto, es decir, su asesor o el administrador. Las tareas sin prospecto siguen igual.
*/
let db: PGlite;
const admin = "70000000-0000-4000-8000-000000000001", own = "70000000-0000-4000-8000-000000000002", other = "70000000-0000-4000-8000-000000000003";
const base = { titulo: "Llamar a la persona de ejemplo", categoria: "leads", estado: "pendiente", prioridad: "normal", pasos: [] };

async function asUser<T>(id: string, fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try { return await fn(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
async function put(data: Record<string, unknown>, version: number | null = null) {
  return (await db.query<{ result: { data: Record<string, unknown>; version: number } }>("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,$3) result", [data.id, JSON.stringify(data), version])).rows[0].result;
}
async function visible(id: string) {
  return (await db.query("select id from public.fortius_inmuebles_records where collection='tareas' and id=$1", [id])).rows.length === 1;
}
const lead = (id: string, asesorId?: string) => JSON.stringify({ id, nombre: "Prospecto de ejemplo", telefono: "6640000000", origen: "contacto", estado: "nuevo", creadoEl: "2026-11-12T10:00:00.000Z", notas: [], ...(asesorId ? { asesorId } : {}) });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.query(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor')`);
  await db.query(`insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('leads','lead-own',$1::jsonb),('leads','lead-other',$2::jsonb),('leads','lead-free',$3::jsonb)`, [lead("lead-own", "own"), lead("lead-other", "other"), lead("lead-free")]);
  await db.query(`insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other')`);
  await asUser(own, () => put({ ...base, id: "t-own", leadId: "lead-own" }));
  await asUser(own, () => put({ ...base, id: "t-team" }));
  await asUser(admin, () => put({ ...base, id: "t-free", leadId: "lead-free" }));
});
afterAll(async () => { await db?.close(); });

test("cada asesor lee solo las tareas de sus prospectos; el administrador lee todas", async () => {
  await asUser(own, async () => { expect(await visible("t-own")).toBe(true); expect(await visible("t-free")).toBe(false); });
  await asUser(other, async () => { expect(await visible("t-own")).toBe(false); expect(await visible("t-free")).toBe(false); });
  await asUser(admin, async () => { expect(await visible("t-own")).toBe(true); expect(await visible("t-free")).toBe(true); });
});

test("las tareas sin prospecto siguen visibles para todo el equipo", async () => {
  await asUser(other, async () => expect(await visible("t-team")).toBe(true));
});

test("nadie crea, cambia ni borra una tarea de un prospecto ajeno por RPC", async () => {
  await asUser(other, async () => {
    await expect(put({ ...base, id: "t-intrusa", leadId: "lead-own" })).rejects.toMatchObject({ code: "PT403" });
    await expect(put({ ...base, id: "t-own", leadId: "lead-own", titulo: "Cambio" }, 1)).rejects.toMatchObject({ code: "PT403" });
    await expect(put({ ...base, id: "t-own" }, 1)).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("select public.fortius_inmuebles_delete_record('tareas','t-own',1)")).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(own, async () => {
    await expect(put({ ...base, id: "t-own", leadId: "lead-other" }, 1)).rejects.toMatchObject({ code: "PT403" });
    expect((await put({ ...base, id: "t-own", leadId: "lead-own", titulo: "Enviarle opciones" }, 1)).version).toBe(2);
  });
});

test("el disparador interno no se puede ejecutar desde la sesión", async () => {
  expect((await db.query("select has_function_privilege('authenticated','public.fortius_inmuebles_guard_task_lead()','EXECUTE') allowed")).rows).toEqual([{ allowed: false }]);
  expect((await db.query("select has_function_privilege('anon','public.fortius_inmuebles_task_lead_visible(jsonb)','EXECUTE') allowed")).rows).toEqual([{ allowed: false }]);
});
