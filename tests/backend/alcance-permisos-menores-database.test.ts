import { afterAll, beforeAll, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// SEG-B12/B13/B14 (auditoría del 13/11/2026).
let db: PGlite;
const admin = "58000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${admin}'); insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('asesores','a1','{"id":"a1","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),('clientes','c1','{"id":"c1","nombre":"Cliente de ensayo","telefono":"6640000001","tipo":"propietario","asesorId":"a1","creadoEl":"2026-11-13","actualizadoEl":"2026-11-13"}');`);
});
afterAll(async () => { await db?.close(); });

it("la migración se puede aplicar otra vez sin repetir el cambio", async () => {
  await db.exec(await readFile(new URL("../../supabase/migrations/20261113126000_alcance_y_permisos_menores.sql", import.meta.url), "utf8"));
  const definition = (await db.query<{ d: string }>("select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) d")).rows[0].d;
  expect(definition.split("SEG-B12").length).toBe(2);
});

it("la nota del asesor no lleva el detalle del registro automático", async () => {
  const expediente = (await db.query<{ id: string }>("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id,operacion,unidad) values ('c1','a1','venta','') returning id")).rows[0].id;
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
  try {
    const note = (detalle: string | null) => db.query("insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle) values ($1,'nota','Nota de ensayo',$2,$3::jsonb)", [expediente, admin, detalle]);
    await note(null);
    await expect(note(JSON.stringify({ campo: "etapa", antes: "captacion", despues: "cierre" }))).rejects.toThrow(/row-level security/);
  } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
});

it("sin sesión no se llaman las funciones auxiliares", async () => {
  await db.exec("set role anon");
  try {
    await expect(db.query("select public.fortius_inmuebles_is_staff()")).rejects.toThrow(/permission denied/);
    await expect(db.query("select public.fortius_inmuebles_check_expediente_checklist('[]'::jsonb)")).rejects.toThrow(/permission denied/);
  } finally { await db.exec("reset role"); }
});

it("las columnas de las políticas tienen índice", async () => {
  const names = (await db.query<{ indexname: string }>("select indexname from pg_indexes where schemaname='public'")).rows.map(row => row.indexname);
  expect(names).toEqual(expect.arrayContaining(["fortius_inmuebles_records_task_expediente", "fortius_inmuebles_records_asesor",
    "fortius_inmuebles_app_files_expediente", "fortius_inmuebles_app_shares_file", "fortius_inmuebles_integration_jobs_expediente"]));
});
