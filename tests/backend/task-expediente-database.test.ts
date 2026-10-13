import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
let db: PGlite;
let aclBefore: unknown;
let tableAclBefore: unknown;
const admin = "60000000-0000-4000-8000-000000000001", own = "60000000-0000-4000-8000-000000000002", other = "60000000-0000-4000-8000-000000000003";
const dossierA = "60000000-0000-4000-8000-000000000010", dossierB = "60000000-0000-4000-8000-000000000011", dossierOther = "60000000-0000-4000-8000-000000000012";
const base = { id: "task-direct", titulo: "Revisión", categoria: "documentacion", estado: "pendiente", prioridad: "normal", pasos: [] };
const linked = { ...base, expedienteId: dossierA, clienteId: "c-own", asesorId: "own", propiedadSlug: "same-property" };
const acl = "select oid,proname,proacl::text,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace order by oid";
async function asUser<T>(id: string | null, fn: () => Promise<T>) {
  await db.exec(id ? "set role authenticated" : "set role anon");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  try { return await fn(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
async function put(data: Record<string, unknown>, version: number | null = null) {
  return (await db.query<{ result: { data: Record<string,unknown>; version: number } }>("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,$3) result", [data.id, JSON.stringify(data), version])).rows[0].result;
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
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  const files = (await readdir(dir)).filter(f => f.endsWith(".sql")).sort();
  for (const file of files.filter(f => !f.endsWith("_task_expediente_links.sql"))) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Propietario","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-13","actualizadoEl":"2026-10-13"}'),
    ('propiedades','same-property','{"id":"same-property","slug":"same-property","codigo":"TEST-SAME"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,folio) values
      ('${dossierA}','c-own','own','same-property','VENTA-1'),('${dossierB}','c-own','own','same-property','RENTA-2'),('${dossierOther}','c-own','other','same-property','OTRO-3');`);
  await asUser(own, () => put({ ...base, id: "legacy", clienteId: "c-own", propiedadSlug: "same-property" }));
  aclBefore = (await db.query(acl)).rows;
  tableAclBefore = (await db.query("select relacl::text from pg_class where oid='public.fortius_inmuebles_records'::regclass")).rows;
  for (const file of files.filter(f => f.endsWith("_task_expediente_links.sql"))) await db.exec(await readFile(new URL(file, dir), "utf8"));
});
afterAll(async () => { await db?.close(); });
test("preserves every existing RPC ACL and blocks public execution of its internal trigger", async () => {
  const after = (await db.query<{oid:number;proname:string;proacl:string}>(acl)).rows;
  expect((await db.query("select relacl::text from pg_class where oid='public.fortius_inmuebles_records'::regclass")).rows).toEqual(tableAclBefore);
  expect(after.filter(row => row.proname !== "fortius_inmuebles_guard_task_expediente")).toEqual(aclBefore);
  expect((await db.query("select has_function_privilege('authenticated','public.fortius_inmuebles_guard_task_expediente()','EXECUTE') allowed")).rows).toEqual([{ allowed: false }]);
});
test("direct RPC persists distinct expedientes over one property and retains an editable legacy task", async () => {
  await asUser(own, async () => {
    expect((await put(linked)).data.expedienteId).toBe(dossierA);
    expect((await put({ ...linked, id: "task-second", expedienteId: dossierB })).data.expedienteId).toBe(dossierB);
    expect((await put({ ...base, id: "legacy", clienteId: "c-own", propiedadSlug: "same-property", titulo: "Actualización" }, 1)).version).toBe(2);
    expect((await db.query("select task_expediente_id from public.fortius_inmuebles_records where collection='tareas' and id='legacy'")).rows).toEqual([{ task_expediente_id: null }]);
  });
});
test("direct RPC rejects malformed, unknown, inaccessible or inconsistent expediente context", async () => {
  await asUser(own, async () => {
    for (const patch of [{ expedienteId: "invalid" }, { expedienteId: null }, { expedienteId: 42 }, { expedienteId: "60000000-0000-4000-8000-000000000099" }, { clienteId: "" }, { asesorId: "" }, { propiedadSlug: "" }]) await expect(put({ ...linked, id: "invalid", ...patch })).rejects.toMatchObject({ code: "PT400" });
    await expect(put({ ...linked, id: "other-dossier", expedienteId: dossierOther, asesorId: "other" })).rejects.toMatchObject({ code: "PT403" });
  });
});
test("direct database reads and RPC changes cannot cross expediente ownership even on the same client", async () => {
  await asUser(admin, () => put({ ...linked, id: "private-other", expedienteId: dossierOther, asesorId: "other" }));
  await asUser(own, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='tareas' and id='private-other'")).rows).toEqual([]);
    await expect(put({ ...linked, id: "private-other" }, 1)).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("select public.fortius_inmuebles_delete_record('tareas','private-other',1)")).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(other, async () => expect((await db.query("select id from public.fortius_inmuebles_records where collection='tareas' and id='task-direct'")).rows).toEqual([]));
});
test("direct DML remains unavailable and anon cannot expose private tasks", async () => {
  await asUser(own, async () => {
    await expect(db.query("update public.fortius_inmuebles_records set data=data where collection='tareas'")).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(null, async () => {
    await expect(put({ ...base, id: "anon" })).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("select * from public.fortius_inmuebles_records")).rejects.toMatchObject({ code: "42501" });
    expect((await db.query("select * from public.fortius_inmuebles_public_records('tareas')")).rows).toEqual([]);
  });
});
test("deleted expediente blocks writes, preserves existing task reference and restoration resumes edits", async () => {
  await asUser(admin, () => db.query("update public.fortius_inmuebles_expedientes set version=version+1,deleted_at=now(),deleted_by=$1 where id=$2", [admin,dossierA]));
  await asUser(admin, () => expect(put({ ...linked, titulo: "Mientras eliminado" }, 1)).rejects.toMatchObject({ code: "PT400" }));
  expect((await db.query("select data->>'expedienteId' ref from public.fortius_inmuebles_records where collection='tareas' and id='task-direct'")).rows).toEqual([{ ref: dossierA }]);
  await asUser(admin, () => db.query("update public.fortius_inmuebles_expedientes set version=version+1,deleted_at=null,deleted_by=null where id=$1", [dossierA]));
  await asUser(own, () => expect(put({ ...linked, titulo: "Después de restaurar" }, 1)).resolves.toMatchObject({ version: 2 }));
});

test("privileged direct DML still validates context and cannot detach another adviser's task", async () => {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [own]);
  try {
    await expect(db.query("insert into public.fortius_inmuebles_records(collection,id,data) values('tareas',$1,$2::jsonb)", ["direct-wrong", JSON.stringify({ ...linked, id: "direct-wrong", propiedadSlug: "" })])).rejects.toMatchObject({ code: "PT400" });
    await expect(db.query("update public.fortius_inmuebles_records set data=data-'expedienteId' where collection='tareas' and id='private-other'")).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("delete from public.fortius_inmuebles_records where collection='tareas' and id='private-other'")).rejects.toMatchObject({ code: "PT403" });
  } finally { await db.query("select set_config('request.jwt.claim.sub','',false)"); }
});
test("the direct foreign key prevents physical expediente removal without erasing tasks", async () => {
  await expect(db.query("delete from public.fortius_inmuebles_expedientes where id=$1", [dossierB])).rejects.toMatchObject({ code: "23001" });
  expect((await db.query("select data->>'expedienteId' ref from public.fortius_inmuebles_records where collection='tareas' and id='task-second'")).rows).toEqual([{ ref: dossierB }]);
});

test("an older writer omitting the optional field preserves its reference; explicit empty text detaches it", async () => {
  await asUser(own, async () => {
    await put({ ...linked, id: "compatible-writer" });
    const oldWriter: Record<string, unknown> = { ...linked, id: "compatible-writer" }; delete oldWriter.expedienteId;
    const retained = await put({ ...oldWriter, titulo: "Versión anterior" }, 1);
    expect(retained.data.expedienteId).toBe(dossierA);
    const detached = await put({ ...oldWriter, expedienteId: "" }, 2);
    expect(detached.data.expedienteId).toBe("");
    expect((await db.query("select task_expediente_id from public.fortius_inmuebles_records where collection='tareas' and id='compatible-writer'")).rows).toEqual([{ task_expediente_id: null }]);
  });
});

test("direct RPC canonicalizes UUID case so the UI can match the authorized expediente", async () => {
  const canonical = "6abc0000-0000-4000-8000-000000000010";
  await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,propiedad_slug,folio) values($1,'c-own','own','same-property','CANONICAL')", [canonical]);
  await asUser(own, async () => expect((await put({ ...linked, id: "canonical", expedienteId: canonical.toUpperCase() })).data.expedienteId).toBe(canonical));
});
