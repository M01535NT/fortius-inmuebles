import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { nuevoTramite } from "@/lib/tramites";

// FLX-03 parte B (DEC-55): cada tipo de asunto con su guía; el tipo se cambia sin perder lo hecho y
// un asunto puede empezar en cualquier etapa. Todo queda en el historial; nada frena (RP-100).
let db: PGlite;
const director = "57000000-0000-4000-8000-000000000001";
const ids = { venta: "57000000-0000-4000-8000-000000000010", inspeccion: "57000000-0000-4000-8000-000000000011", cancelacion: "57000000-0000-4000-8000-000000000012", tarde: "57000000-0000-4000-8000-000000000013" };
async function as<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const flow = (extra: Record<string, unknown> = {}) => JSON.stringify({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, ...extra });
const insert = (id: string, folio: string, flujo: string, etapa = "captacion") =>
  db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio,operacion,etapa,flujo) values ($1,'c-1','ana',$2,'venta',$3,$4::jsonb)", [id, folio, etapa, flujo]);
const row = async (id: string) => (await db.query<{ operacion: string; etapa: string; version: number; flujo: Record<string, unknown> & { guia?: { paso: number } } }>("select operacion,etapa,version,flujo from public.fortius_inmuebles_expedientes where id=$1", [id])).rows[0];
const history = async (id: string) => (await db.query<{ tipo: string; descripcion: string }>("select tipo,descripcion from public.fortius_inmuebles_expediente_actividad where expediente_id=$1 and tipo in ('cambio','aviso') and descripcion not like 'Guía y revisiones%' and descripcion not like 'Etapa:%' order by created_at,id", [id])).rows;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${director}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${director}','admin');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','ana','{"id":"ana","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('clientes','c-1','{"id":"c-1","nombre":"Cliente de ensayo","telefono":"6641234567","tipo":"propietario","asesorId":"ana","notas":"","creadoEl":"2026-11-15","actualizadoEl":"2026-11-15"}');`);
});
afterAll(async () => { await db?.close(); });

describe("guías por tipo de asunto", () => {
  it("una inspección guarda su paso; un paso fuera de su guía no se acepta", async () => {
    await as(director, async () => {
      await insert(ids.inspeccion, "EXP-INSP", flow({ guia: { clave: "inspeccion", paso: 0 } }));
      await expect(db.query("update public.fortius_inmuebles_expedientes set flujo=$2::jsonb,version=version+1 where id=$1", [ids.inspeccion, flow({ guia: { clave: "inspeccion", paso: 4 } })]))
        .rejects.toMatchObject({ message: "Guía del asunto inválida" });
      await expect(db.query("update public.fortius_inmuebles_expedientes set flujo=$2::jsonb,version=version+1 where id=$1", [ids.inspeccion, flow({ guia: { clave: "inspeccion", paso: 0, acreedor: "banco" } })]))
        .rejects.toMatchObject({ message: "Guía del asunto inválida" });
    });
  });

  it("saltar pasos de la guía se guarda y deja el paso y el aviso en el historial", async () => {
    await as(director, async () => {
      await db.query("update public.fortius_inmuebles_expedientes set flujo=$2::jsonb,version=version+1 where id=$1", [ids.inspeccion, flow({ guia: { clave: "inspeccion", paso: 2 } })]);
    });
    expect((await row(ids.inspeccion)).flujo.guia?.paso).toBe(2);
    const h = await history(ids.inspeccion);
    expect(h).toHaveLength(2);
    expect(h).toEqual(expect.arrayContaining([
      { tipo: "cambio", descripcion: "Pasó a «Hallazgos con fotos»" },
      { tipo: "aviso", descripcion: "Se guardó sin: Las etapas intermedias" },
    ]));
  });

  it("una venta avanzada cambia a renta: conserva sus requisitos y anota el cambio", async () => {
    const requisitos = { entrevista: { estado: "recibido", soporte: "Entrevista de ensayo" } };
    await as(director, async () => { await insert(ids.venta, "EXP-VENTA", flow({ requisitos }), "comercializacion"); });
    const before = await row(ids.venta);
    await as(director, async () => {
      await db.query("select public.fortius_inmuebles_change_operation_type($1,$2,'renta',$3::jsonb)", [ids.venta, before.version, flow({ ruta: "arrendador", requisitos })]);
    });
    const after = await row(ids.venta);
    expect(after).toMatchObject({ operacion: "renta", etapa: "comercializacion", flujo: { ruta: "arrendador", requisitos: { entrevista: { estado: "recibido" } } } });
    expect(await history(ids.venta)).toContainEqual({ tipo: "cambio", descripcion: "Cambió el tipo del asunto de «Venta» a «Renta». Lo hecho se conserva." });
    // Con una versión vieja no se pisa el cambio de otro (409).
    await as(director, async () => {
      await expect(db.query("select public.fortius_inmuebles_change_operation_type($1,$2,'venta',$3::jsonb)", [ids.venta, before.version, flow()])).rejects.toMatchObject({ code: "PT409" });
    });
  });

  it("un asunto puede empezar en negociación y queda el aviso de lo anterior", async () => {
    await as(director, async () => { await insert(ids.tarde, "EXP-TARDE", flow(), "negociacion"); });
    expect((await row(ids.tarde)).etapa).toBe("negociacion");
    expect(await history(ids.tarde)).toContainEqual({ tipo: "aviso", descripcion: expect.stringContaining("Las etapas anteriores a «Negociación»") });
  });

  it("cerrar un paso del trámite ligado mueve el riel de la cancelación de hipoteca", async () => {
    await as(director, async () => { await insert(ids.cancelacion, "EXP-CANC", flow({ guia: { clave: "cancelacion_hipoteca", paso: 0, acreedor: "infonavit" } })); });
    const tramite = nuevoTramite({ id: "tr-1", acreedor: "infonavit", titulo: "Cancelación de ensayo", clienteId: "c-1", asesorId: "ana", expedienteId: ids.cancelacion });
    const put = (data: unknown, version: number | null) => db.query<{ r: { version: number } }>("select public.fortius_inmuebles_put_record('tramites','tr-1',$1::jsonb,$2) r", [JSON.stringify(data), version]);
    await as(director, async () => {
      const created = (await put(tramite, null)).rows[0].r;
      await put({ ...tramite, pasoActual: 1 }, created.version);
    });
    expect((await row(ids.cancelacion)).flujo.guia?.paso).toBe(1);
    expect(await history(ids.cancelacion)).toContainEqual({ tipo: "cambio", descripcion: "Pasó a «Crédito liquidado»" });
  });

  it("archivar una inspección no pide lo de una venta", async () => {
    const before = await history(ids.inspeccion);
    await as(director, async () => {
      await db.query("update public.fortius_inmuebles_expedientes set etapa='cerrado',version=version+1 where id=$1", [ids.inspeccion]);
    });
    expect((await row(ids.inspeccion)).etapa).toBe("cerrado");
    // Sin tareas abiertas no queda ningún aviso: ni etapas intermedias ni requisitos de venta.
    expect((await history(ids.inspeccion)).filter(h => h.tipo === "aviso")).toEqual(before.filter(h => h.tipo === "aviso"));
  });
});
