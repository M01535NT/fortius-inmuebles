import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  Eliminar un prospecto con tareas (20261115100000, titular 15/11/2026): sus tareas se van con él a
  Eliminados y regresan juntas al restaurarlo. Antes, la tarea impedía borrarlo.
*/
let db: PGlite;
const admin = "71000000-0000-4000-8000-000000000001", own = "71000000-0000-4000-8000-000000000002", other = "71000000-0000-4000-8000-000000000003";
const task = (id: string, leadId: string, estado = "pendiente") => JSON.stringify({ id, titulo: "Llamar a la persona de ejemplo", categoria: "leads", estado, prioridad: "normal", pasos: [], leadId });
const lead = (id: string, asesorId: string) => JSON.stringify({ id, nombre: "Prospecto de ejemplo", telefono: "6640000000", origen: "contacto", estado: "nuevo", creadoEl: "2026-11-15T10:00:00.000Z", notas: [], asesorId });

async function asUser<T>(id: string, fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try { return await fn(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const put = (collection: string, id: string, data: string) => db.query("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,null)", [collection, id, data]);
const version = async (collection: string, id: string) => (await db.query<{ v: number }>("select version::int v from public.fortius_inmuebles_records where collection=$1 and id=$2", [collection, id])).rows[0]?.v;
const exists = async (collection: string, id: string) => (await version(collection, id)) !== undefined;
const remove = async (collection: string, id: string) => db.query("select public.fortius_inmuebles_delete_record($1,$2,$3)", [collection, id, await version(collection, id)]);
const deletion = async (collection: string, id: string) => (await db.query<{ id: string }>("select id from public.fortius_inmuebles_record_history where collection=$1 and record_id=$2 and action='DELETE' order by created_at desc limit 1", [collection, id])).rows[0].id;

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
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}')`);
  await db.query(`insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other')`);
}, 30000);
afterAll(async () => { await db?.close(); });

test("el asesor elimina su prospecto con sus tareas, abiertas y terminadas, y el administrador lo restaura con ellas", async () => {
  await asUser(own, async () => {
    await put("leads", "p1", lead("p1", "own"));
    await put("tareas", "p1-llamar", task("p1-llamar", "p1"));
    await put("tareas", "p1-hecha", task("p1-hecha", "p1", "completada"));
    await put("tareas", "suelta", JSON.stringify({ id: "suelta", titulo: "Tarea de ejemplo sin prospecto", categoria: "administracion", estado: "pendiente", prioridad: "normal", pasos: [] }));
    await remove("leads", "p1");
    expect(await exists("leads", "p1")).toBe(false);
    expect(await exists("tareas", "p1-llamar")).toBe(false);
    expect(await exists("tareas", "p1-hecha")).toBe(false);
    expect(await exists("tareas", "suelta")).toBe(true);
  });
  await asUser(admin, async () => {
    await db.query("select public.fortius_inmuebles_restore_record($1)", [await deletion("leads", "p1")]);
    expect(await exists("leads", "p1")).toBe(true);
    expect(await exists("tareas", "p1-llamar")).toBe(true);
    expect(await exists("tareas", "p1-hecha")).toBe(true);
    const restored = await db.query<{ estado: string }>("select data->>'estado' estado from public.fortius_inmuebles_records where collection='tareas' and id='p1-hecha'");
    expect(restored.rows[0].estado).toBe("completada");
  });
});

test("una tarea que regresó con su prospecto no se puede volver a restaurar sola", async () => {
  await asUser(admin, async () => {
    const left = await db.query("select id from public.fortius_inmuebles_record_history where collection='tareas' and record_id='p1-llamar' and action='DELETE' and restored_at is null");
    expect(left.rows).toHaveLength(0);
  });
});

test("nadie elimina por esta vía el prospecto de otro asesor ni sus tareas", async () => {
  await asUser(other, async () => {
    await put("leads", "p2", lead("p2", "other"));
    await put("tareas", "p2-llamar", task("p2-llamar", "p2"));
  });
  await asUser(own, async () => {
    // Su tarea es de un prospecto ajeno: el disparador de tareas lo rechaza y no se borra nada.
    await expect(db.query("select public.fortius_inmuebles_delete_record('leads','p2',1)")).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(admin, async () => {
    expect(await exists("leads", "p2")).toBe(true);
    expect(await exists("tareas", "p2-llamar")).toBe(true);
  });
});

test("las demás referencias siguen impidiendo el borrado y no se pierde ninguna tarea", async () => {
  await asUser(admin, async () => {
    await put("leads", "p3", lead("p3", "own"));
    await put("tareas", "p3-llamar", task("p3-llamar", "p3"));
    await put("notas", "n3", JSON.stringify({ id: "n3", titulo: "Nota de ensayo", texto: "Texto de ensayo", actualizadoEl: "2026-11-15T10:00:00.000Z", leadId: "p3" }));
    await expect(remove("leads", "p3")).rejects.toMatchObject({ code: "PT409" });
    expect(await exists("tareas", "p3-llamar")).toBe(true);
  });
  // La nota sí quedó ligada al prospecto (fuera de la sesión: la tabla de referencias es interna).
  expect((await db.query("select 1 from public.fortius_inmuebles_record_references where source_collection='notas' and source_id='n3' and target_id='p3'")).rows).toHaveLength(1);
});
