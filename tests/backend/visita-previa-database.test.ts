import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// DEC-41 (excepción a RP-91): solo el director autoriza enseñar un inmueble antes de la firma,
// a un interesado concreto, con la carta firmada del propietario y un motivo.
let db: PGlite;
const director = "56000000-0000-4000-8000-000000000001", ana = "56000000-0000-4000-8000-000000000002";
const exp = "56000000-0000-4000-8000-000000000010";
const carta = `${director}/56000000-0000-4000-8000-0000000000aa.pdf`;
const motivo = "Interesado con crédito aprobado que busca en la colonia";
async function as<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
  try { return await action(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const flow = (extra: Record<string, unknown> = {}) => JSON.stringify({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, ...extra });
const setFlow = (extra: Record<string, unknown>) => db.query("update public.fortius_inmuebles_expedientes set flujo=$2::jsonb,version=version+1 where id=$1", [exp, flow(extra)]);
const stored = async () => (await db.query<{ flujo: { visitasPrevias?: Array<Record<string, unknown>> } }>("select flujo from public.fortius_inmuebles_expedientes where id=$1", [exp])).rows[0].flujo;
const visit = (extra: Record<string, unknown> = {}) => ({ id: "v1", interesado: "Interesado de ensayo", leadId: "lead-1", carta: { path: carta, nombre: "carta.pdf" }, motivo, ...extra });

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${director}'),('${ana}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${director}','admin'),('${ana}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','ana','{"id":"ana","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('clientes','c-ana','{"id":"c-ana","nombre":"Cliente de ensayo","telefono":"6641234567","tipo":"propietario","asesorId":"ana","notas":"","creadoEl":"2026-11-12","actualizadoEl":"2026-11-12"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${ana}','ana');
    insert into public.fortius_inmuebles_file_uploads(bucket,path,uploaded_by) values ('fortius-inmuebles-private','${carta}','${director}');`);
  await db.query("insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio,flujo) values ($1,'c-ana','ana','EXP-DEC41',$2::jsonb)", [exp, flow()]);
});
afterAll(async () => { await db?.close(); });

describe("visita autorizada antes de la firma", () => {
  it("el asesor no la autoriza", async () => {
    await as(ana, async () => {
      await expect(setFlow({ visitasPrevias: [visit()] })).rejects.toMatchObject({ message: "Solo el director autoriza una visita antes de la firma" });
    });
  });

  it("sin la carta subida o sin motivo, no", async () => {
    await as(director, async () => {
      await expect(setFlow({ visitasPrevias: [visit({ carta: { path: `${director}/56000000-0000-4000-8000-0000000000bb.pdf` } })] })).rejects.toMatchObject({ code: "PT409" });
      await expect(setFlow({ visitasPrevias: [visit({ motivo: " " })] })).rejects.toMatchObject({ code: "PT400" });
    });
  });

  it("el director la autoriza; el servidor anota quién y cuándo; el asesor la conserva pero no la retira", async () => {
    await as(director, async () => { await setFlow({ visitasPrevias: [visit({ autorizadoPor: ana })] }); });
    const saved = (await stored()).visitasPrevias!;
    expect(saved[0]).toMatchObject({ id: "v1", interesado: "Interesado de ensayo", autorizadoPor: director });
    await as(ana, async () => {
      await setFlow({ visitasPrevias: saved, requisitos: { levantamiento: { estado: "recibido", soporte: "" } } });
      await expect(setFlow({})).rejects.toMatchObject({ message: "Solo el director retira una visita autorizada" });
    });
    await as(director, async () => { await setFlow({}); });
    expect((await stored()).visitasPrevias).toBeUndefined();
  });
});
