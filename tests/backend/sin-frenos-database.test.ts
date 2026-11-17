import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

/*
  Sin frenos de proceso (titular, 16/11/2026; migración 20261116100000_sin_frenos_de_proceso.sql):
  el avance del trabajo no se frena; el panel lo avisa. Lo protegido sigue: versión (409), permisos del
  director, validación de datos y el historial del tipo de operación.
*/
let db: PGlite;
const admin = "5f000000-0000-4000-8000-000000000001";
const own = "5f000000-0000-4000-8000-000000000002";
const venta = "5f000000-0000-4000-8000-000000000010", renta = "5f000000-0000-4000-8000-000000000011";
async function asUser<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
const version = async (id: string) => Number((await db.query<{ v: number }>("select version v from public.fortius_inmuebles_expedientes where id=$1", [id])).rows[0].v);
const move = async (id: string, stage: string, flow: unknown = null) => (await db.query<{ r: { etapa: string; version: number } }>(
  "select public.fortius_inmuebles_update_operation($1,$2,$3,null,'{}'::jsonb,$4::jsonb,null,false) r", [id, await version(id), stage, flow === null ? null : JSON.stringify(flow)])).rows[0].r;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente de ensayo","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-11-16","actualizadoEl":"2026-11-16"}'),
    ('propiedades','casa-sin-captacion','{"slug":"casa-sin-captacion","codigo":"SF-1","tipo":"casa","operacion":"venta","asesorId":"own","publicada":false}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio,operacion) values
      ('${venta}','c-own','own','EXP-SIN-FRENOS-1','venta'),('${renta}','c-own','own','EXP-SIN-FRENOS-2','renta');`);
});
afterAll(async () => { await db?.close(); });

it("la migración se puede volver a correr sin cambiar nada", async () => {
  await db.exec(await readFile(new URL("../../supabase/migrations/20261116100000_sin_frenos_de_proceso.sql", import.meta.url), "utf8"));
  const triggers = (await db.query<{ t: string }>("select tgname t from pg_trigger where tgrelid='public.fortius_inmuebles_expedientes'::regclass and not tgisinternal")).rows.map(r => r.t);
  for (const removed of ["fortius_03_guard_rent_progress", "fortius_04_guard_initial_gate", "fortius_00b_guard_mortgage_signing", "fortius_02_interview_evidence"])
    expect(triggers).not.toContain(removed);
  expect(triggers).toContain("fortius_01_guard_guided_operation");
});

it("una venta sin guía, sin arranque, sin firma ni requisitos salta de captación a cierre y archiva con tareas abiertas", async () => {
  await asUser(own, async () => {
    expect((await move(venta, "cierre")).etapa).toBe("cierre");
    await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)", ["sf-abierta", JSON.stringify({ id: "sf-abierta", titulo: "Pendiente de ensayo", categoria: "documentacion",
      estado: "pendiente", prioridad: "normal", pasos: [], asesorId: "own", clienteId: "c-own", expedienteId: venta, vence: "2030-12-31" })]);
    expect((await move(venta, "cerrado")).etapa).toBe("cerrado");
    // Retroceder ya no pide motivo.
    expect((await move(venta, "negociacion")).etapa).toBe("negociacion");
  });
});

it("una renta salta etapas y archiva sin guía", async () => {
  await asUser(own, async () => { expect((await move(renta, "cerrado")).etapa).toBe("cerrado"); });
});

it("el director publica un inmueble propio sin captación autorizada; el asesor sigue sin poder publicar", async () => {
  const data = { slug: "casa-sin-captacion", codigo: "SF-1", titulo: "Casa ficticia de ensayo", tipo: "casa", operacion: "venta", precio: { modalidad: "consulta" }, zona: "Prueba",
    direccionAproximada: "Prueba", descripcion: ["Prueba"], ficha: {}, amenidades: [], galeria: [{ src: "/hero/casa-playa.webp", alt: "Prueba" }], asesorId: "own", creditoDisponible: false,
    puntosDeInteres: [], destacada: false, estado: "disponible", publicadaEl: "2026-11-16", demo: true, publicada: true };
  const put = () => db.query("select public.fortius_inmuebles_put_record('propiedades',$1,$2::jsonb,1)", [data.slug, JSON.stringify(data)]);
  await asUser(own, async () => { await expect(put()).rejects.toMatchObject({ code: "PT403", message: "Solo el director publica un inmueble" }); });
  await asUser(admin, async () => { await put(); });
  expect((await db.query<{ p: boolean }>("select (data->>'publicada')::boolean p from public.fortius_inmuebles_records where collection='propiedades' and id=$1", [data.slug])).rows[0].p).toBe(true);
});

it("lo protegido sigue: versión vieja, tipo de una operación avanzada, guía inválida y revisiones del director", async () => {
  await asUser(own, async () => {
    const stale = (await version(venta)) - 1;
    await expect(db.query("select public.fortius_inmuebles_update_operation($1,$2,'cierre',null,'{}'::jsonb,null,null,false)", [venta, stale])).rejects.toMatchObject({ code: "PT409" });
    await expect(db.query("update public.fortius_inmuebles_expedientes set operacion='renta',version=version+1 where id=$1", [venta]))
      .rejects.toMatchObject({ code: "PT409", message: "No cambies el tipo de una operación avanzada; conserva su historial" });
    await expect(move(venta, "negociacion", { version: 1, ruta: "captacion", estado: "activa", motivo: 123, requisitos: {} })).rejects.toMatchObject({ code: "PT400" });
    const reviewed = { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: { titularidad: { estado: "revisado", soporte: "Escritura de ensayo",
      evidencia: { tipo: "externa", referencia: "Escritura ficticia v1", fecha: "2026-11-16", responsable: "Ana", resultado: "Revisada en ensayo" } } } };
    await expect(move(venta, "negociacion", reviewed)).rejects.toMatchObject({ code: "PT403", message: "Esta revisión la marca el director; déjala como «Lo tengo»" });
  });
});
