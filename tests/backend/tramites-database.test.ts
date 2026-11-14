import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { ACREEDORES, nuevoTramite, pasosDe, type Acreedor, type Tramite } from "@/lib/tramites";

// TRA-01: trámites de cancelación de hipoteca. La base decide quién los ve, que los pasos se cierren
// en orden con sus pendientes y documento, sella las notas y crea la tarea al quedar en espera.
let db: PGlite;
const ana = "40000000-0000-4000-8000-000000000031", beto = "40000000-0000-4000-8000-000000000032", director = "40000000-0000-4000-8000-000000000033";
async function as<T>(user: string, fn: () => Promise<T>) {
  await db.exec("set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  try { return await fn(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
type Row = { id: string; data: Tramite; version: number };
const put = (id: string, data: unknown, version: number | null) =>
  db.query<{ r: Row }>("select public.fortius_inmuebles_put_record('tramites',$1,$2::jsonb,$3) r", [id, JSON.stringify(data), version]).then(x => x.rows[0].r);
const del = (collection: string, id: string, version: number) => db.query("select public.fortius_inmuebles_delete_record($1,$2,$3)", [collection, id, version]);
const archivo = (id: string, tramiteId: string, pasoClave: string, clienteId = "cli-ana", extra: Record<string, string> = {}) => db.query(
  "insert into public.fortius_inmuebles_records(collection,id,data) values('archivos',$1,$2::jsonb)",
  [id, JSON.stringify({ id, nombre: "doc.pdf", url: "/api/admin/files?path=x", tipo: "pdf", clienteId, tramiteId, pasoClave, visibility: "private", ...extra })]);
const tareasDe = (tramiteId: string) => db.query<{ id: string; data: Record<string, string> }>("select id,data from public.fortius_inmuebles_records where collection='tareas' and data->>'tramiteId'=$1", [tramiteId]).then(x => x.rows);
const base = (id: string) => nuevoTramite({ id, acreedor: "infonavit", titulo: "Casa en Otay", clienteId: "cli-ana", asesorId: "ase-ana" });
const marcar = (t: Tramite, i: number) => ({ ...t, pasos: t.pasos.map((p, k) => k === i ? { ...p, pendientes: p.pendientes.map(x => ({ ...x, hecho: true })) } : p) });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${ana}'),('${beto}'),('${director}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${ana}','editor'),('${beto}','editor'),('${director}','admin');
    insert into public.fortius_inmuebles_records(collection,id,data) values
      ('asesores','ase-ana','{"id":"ase-ana","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
      ('asesores','ase-beto','{"id":"ase-beto","nombre":"Beto","cargo":"Asesor","iniciales":"BB","activo":true}'),
      ('clientes','cli-ana','{"id":"cli-ana","nombre":"Propietaria","telefono":"6640000000","tipo":"propietario","asesorId":"ase-ana","notas":"","creadoEl":"2026-11-01","actualizadoEl":"2026-11-01"}'),
      ('clientes','cli-beto','{"id":"cli-beto","nombre":"Otro","telefono":"6640000001","tipo":"propietario","asesorId":"ase-beto","notas":"","creadoEl":"2026-11-01","actualizadoEl":"2026-11-01"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${ana}','ase-ana'),('${beto}','ase-beto');`);
});
afterAll(async () => { await db?.close(); });

test("cada asesor ve solo los trámites de sus clientes; reasignar o borrar es del director", async () => {
  const t = await as(ana, () => put("tr-1", base("tr-1"), null));
  expect(t.data.creadoEl).toBeTruthy();
  await as(beto, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='tramites'")).rows).toEqual([]);
    await expect(put("tr-x", { ...base("tr-x"), clienteId: "cli-ana", asesorId: "ase-beto" }, null)).rejects.toMatchObject({ code: "PT403" });
    // Tampoco edita ni borra el trámite de un cliente ajeno.
    await expect(put("tr-1", { ...t.data, titulo: "Cambiado por otro asesor" }, t.version)).rejects.toBeTruthy();
    await expect(del("tramites", "tr-1", t.version)).rejects.toBeTruthy();
  });
  expect((await db.query<{ t: string }>("select data->>'titulo' t from public.fortius_inmuebles_records where collection='tramites' and id='tr-1'")).rows[0].t).toBe("Casa en Otay");
  await as(ana, async () => {
    await expect(put("tr-1", { ...t.data, asesorId: "ase-beto" }, t.version)).rejects.toMatchObject({ code: "PT403" });
    await expect(put("tr-1", { ...t.data, clienteId: "cli-beto" }, t.version)).rejects.toMatchObject({ code: "PT403" });
    await expect(del("tramites", "tr-1", t.version)).rejects.toMatchObject({ code: "PT403" });
  });
  const otro = await as(ana, () => put("tr-borrar", base("tr-borrar"), null));
  await as(director, () => del("tramites", "tr-borrar", otro.version));
});

test("los pasos se cierran en orden, con sus pendientes y su documento", async () => {
  let t = await as(ana, () => put("tr-2", base("tr-2"), null));
  await as(ana, async () => {
    await expect(put("tr-2", { ...t.data, pasoActual: 1 }, t.version)).rejects.toMatchObject({ code: "PT400", message: expect.stringMatching(/pendientes/) });
    t = await put("tr-2", { ...marcar(t.data, 0), pasoActual: 1 }, t.version);
    expect(t.data.pasos[0].cerradoEl).toBeTruthy();
    expect(t.data.pasos[0].cerradoPor).toBe(ana);
    expect(t.data.notas.some(n => n.tipo === "evento" && /Datos del crédito/.test(n.texto))).toBe(true);
    await expect(put("tr-2", { ...marcar(t.data, 1), pasoActual: 3 }, t.version)).rejects.toMatchObject({ code: "PT400" });
    await expect(put("tr-2", { ...marcar(t.data, 1), pasoActual: 2 }, t.version)).rejects.toMatchObject({ code: "PT400", message: expect.stringMatching(/documento/) });
  });
  await archivo("doc-saldo", "tr-2", "liquidado");
  await as(ana, async () => {
    t = await put("tr-2", { ...marcar(t.data, 1), pasoActual: 2 }, t.version);
    expect(t.data.pasoActual).toBe(2);
    // La prueba de un paso cerrado no se borra ni se desliga mientras el paso siga cerrado.
    const doc = (await db.query<{ version: number; data: Record<string, string> }>("select version,data from public.fortius_inmuebles_records where collection='archivos' and id='doc-saldo'")).rows[0];
    await expect(del("archivos", "doc-saldo", doc.version)).rejects.toMatchObject({ code: "PT409", message: expect.stringMatching(/reabre el paso/) });
    await expect(db.query("select public.fortius_inmuebles_put_record('archivos','doc-saldo',$1::jsonb,$2)", [JSON.stringify({ ...doc.data, pasoClave: "" }), doc.version])).rejects.toMatchObject({ code: "PT409" });
    // Deshacer: regresar un paso reabre el paso y lo deja anotado.
    t = await put("tr-2", { ...t.data, pasoActual: 1 }, t.version);
    // Con el paso reabierto ya se puede quitar.
    await del("archivos", "doc-saldo", doc.version);
    expect(t.data.pasos[1].cerradoEl).toBeUndefined();
    expect(t.data.notas[t.data.notas.length - 1].texto).toMatch(/reabrió/);
    await expect(put("tr-2", { ...t.data, estado: "terminado" }, t.version)).rejects.toMatchObject({ code: "PT400" });
  });
});

test("un documento solo se liga a un trámite del mismo cliente", async () => {
  await as(ana, () => put("tr-3", base("tr-3"), null));
  await expect(archivo("doc-ajeno", "tr-3", "carta", "cli-beto")).rejects.toMatchObject({ code: "PT400" });
  await expect(archivo("doc-sin", "tr-no-existe", "carta")).rejects.toMatchObject({ code: "PT400" });
  // Los comprobantes van al almacenamiento privado, nunca al público.
  await expect(archivo("doc-publico", "tr-3", "liquidado", "cli-ana", { visibility: "public" })).rejects.toMatchObject({ code: "PT400", message: expect.stringMatching(/privado/) });
  await expect(archivo("doc-bucket", "tr-3", "liquidado", "cli-ana", { bucket: "fortius-inmuebles-public" })).rejects.toMatchObject({ code: "PT400" });
  await expect(archivo("doc-url", "tr-3", "liquidado", "cli-ana", { url: "https://x.supabase.co/storage/v1/object/public/fortius-inmuebles-public/a.pdf" })).rejects.toMatchObject({ code: "PT400" });
});

test("las notas las sella la base y no se cambian las ajenas", async () => {
  let t = await as(ana, () => put("tr-4", base("tr-4"), null));
  await as(ana, async () => {
    t = await put("tr-4", { ...t.data, notas: [...t.data.notas, { id: "n1", tipo: "nota", texto: "Llamé a Infonavit", autor: "otro", fecha: "2020-01-01" }] }, t.version);
    const nota = t.data.notas.find(n => n.id === "n1")!;
    expect(nota.autor).toBe(ana);
    expect(nota.fecha).not.toBe("2020-01-01");
    await expect(put("tr-4", { ...t.data, notas: [...t.data.notas, { id: "n2", tipo: "evento", texto: "Paso cerrado" }] }, t.version)).rejects.toMatchObject({ code: "PT400" });
  });
  await as(director, async () => {
    await expect(put("tr-4", { ...t.data, notas: t.data.notas.map(n => n.id === "n1" ? { ...n, texto: "Cambiada" } : n) }, t.version)).rejects.toMatchObject({ code: "PT403" });
    t = await put("tr-4", { ...t.data, notas: t.data.notas.map(n => n.id === "n1" ? { ...n, fijada: true } : n) }, t.version);
  });
  await as(ana, async () => {
    t = await put("tr-4", { ...t.data, notas: t.data.notas.filter(n => n.id !== "n1") }, t.version);
    expect(t.data.notas.some(n => n.id === "n1")).toBe(false);
  });
});

test("quedar en espera crea la tarea de volver a preguntar, una sola vez", async () => {
  let t = await as(ana, () => put("tr-5", base("tr-5"), null));
  await as(ana, async () => {
    t = await put("tr-5", { ...t.data, espera: { quien: "Infonavit", desde: "2026-11-14", volver: "2026-11-21" } }, t.version);
    t = await put("tr-5", { ...t.data, credito: { numero: "123" } }, t.version);
    // Guardar dos veces, o quitar y volver a poner la espera el mismo día, no duplica la tarea.
    t = await put("tr-5", { ...t.data }, t.version);
    t = await put("tr-5", { ...t.data, espera: null }, t.version);
    t = await put("tr-5", { ...t.data, espera: { quien: "Infonavit", desde: "2026-11-14", volver: "2026-11-21" } }, t.version);
    const tareas = await tareasDe("tr-5");
    expect(tareas).toHaveLength(1);
    expect(tareas[0].data).toMatchObject({ vence: "2026-11-21", clienteId: "cli-ana", asesorId: "ase-ana", estado: "pendiente", categoria: "documentacion" });
    expect(tareas[0].data.titulo).toMatch(/Infonavit/);
    expect(t.data.notas.some(n => n.tipo === "evento" && /espera/.test(n.texto))).toBe(true);
  });
  await as(beto, async () => expect((await db.query("select id from public.fortius_inmuebles_records where collection='tareas' and data->>'tramiteId'='tr-5'")).rows).toEqual([]));
});

test("enviar el avance queda registrado con la fecha de la base", async () => {
  let t = await as(ana, () => put("tr-6", base("tr-6"), null));
  await as(ana, async () => {
    t = await put("tr-6", { ...t.data, ultimoAvance: { medio: "whatsapp", fecha: "2001-01-01" } }, t.version);
    expect(t.data.ultimoAvance?.fecha).not.toBe("2001-01-01");
    expect(t.data.notas.some(n => n.tipo === "evento" && /avance/.test(n.texto))).toBe(true);
  });
});

test("la migración se puede volver a correr sin cambiar nada", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/20261114211000_tramites.sql", import.meta.url), "utf8");
  const firma = () => db.query<{ d: string }>("select string_agg(pg_get_functiondef(p.oid), '' order by p.proname) d from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('fortius_inmuebles_validate_record','fortius_inmuebles_delete_record','fortius_inmuebles_record_visible','fortius_inmuebles_guard_private_record')").then(x => x.rows[0].d);
  const antes = await firma();
  await db.exec(sql);
  expect(await firma()).toBe(antes);
  const t = await as(ana, () => put("tr-7", base("tr-7"), null));
  expect(t.version).toBe(1);
});

test("la base nombra cada paso igual que el panel", async () => {
  for (const a of Object.keys(ACREEDORES) as Acreedor[]) for (const p of pasosDe(a)) {
    const r = await db.query<{ n: string }>("select public.fortius_inmuebles_tramite_paso_nombre($1,$2) n", [a, p.clave]);
    expect(r.rows[0].n).toBe(p.nombre);
  }
});
