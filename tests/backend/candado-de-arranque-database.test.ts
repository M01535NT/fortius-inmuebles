import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { cumplirArranque } from "../helpers/arranque";

let db: PGlite;
const admin = "59000000-0000-4000-8000-000000000001";
const own = "59000000-0000-4000-8000-000000000002";
const other = "59000000-0000-4000-8000-000000000003";
const exp = "59000000-0000-4000-8000-000000000010", exp2 = "59000000-0000-4000-8000-000000000011", exp3 = "59000000-0000-4000-8000-000000000012";
async function asUser<T>(uid: string | null, action: () => Promise<T>) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]);
  try { return await action(); } finally { await db.exec("reset role"); }
}
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
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(file, dir), "utf8"));
  }
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente propio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}'),
    ('clientes','c-other','{"id":"c-other","nombre":"Cliente ajeno","telefono":"6641234567","tipo":"propietario","asesorId":"other","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio,operacion) values ('${exp}','c-own','own','EXP-ARRANQUE-1','renta'),('${exp2}','c-own','own','EXP-ARRANQUE-2','renta'),('${exp3}','c-own','own','EXP-ARRANQUE-3','renta');`);
});
afterAll(async () => { await db?.close(); });

// SEG-M2 (auditoría del 13/11/2026): el candado del arranque del propietario vale en la base, no solo en la ruta.
const flow = { version: 1, ruta: "arrendador", estado: "activa", motivo: "", requisitos: { entrevista: { estado: "revisado", soporte: "Entrevista externa documentada",
  evidencia: { tipo: "externa", referencia: "Archivo sintético de entrevista v1", fecha: "2026-10-14", responsable: "Responsable del ensayo", resultado: "Perfil inicial recibido y revisado" } } } };
const prepare = (id: string) => asUser(own, async () => {
  await db.query("update public.fortius_inmuebles_expedientes set flujo=$2::jsonb,version=2 where id=$1", [id, JSON.stringify(flow)]);
  const task = { id: `next-${id}`, titulo: "Solicitar escritura", categoria: "documentacion", estado: "pendiente", prioridad: "normal", pasos: [], asesorId: "own", clienteId: "c-own", expedienteId: id, vence: "2030-12-31" };
  await db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)", [task.id, JSON.stringify(task)]);
});
const advance = (id: string) => asUser(own, () => db.query("update public.fortius_inmuebles_expedientes set etapa='documentacion',version=3 where id=$1 and version=2 returning etapa", [id]));

it("sin 02, 04 ni checklist no sale de captación, aunque el asesor escriba directo en la base", async () => {
  await prepare(exp);
  await expect(advance(exp)).rejects.toMatchObject({ code: "PT409",
    message: "Antes de avanzar: Recibe los documentos del checklist; Termina la entrevista inicial (02) y genera su PDF; Termina el levantamiento (04) y genera su PDF" });
});

it("con un paso del checklist pendiente tampoco sale, aunque el 02 y el 04 estén emitidos", async () => {
  await prepare(exp2);
  await asUser(own, () => db.query("select public.fortius_inmuebles_put_record('tareas',$1,$2::jsonb,null)", [`checklist-${exp2}`, JSON.stringify({ id: `checklist-${exp2}`,
    titulo: "Reunir los documentos del propietario", categoria: "documentacion", estado: "pendiente", prioridad: "normal", asesorId: "own", clienteId: "c-own", expedienteId: exp2,
    pasos: [{ id: "D01", texto: "Escritura (ficticia de ensayo)", hecho: false }, { id: "D02", texto: "Predial (ficticio)", hecho: false, noAplica: "Exento según el propietario" }] })]));
  await cumplirArranque(db, exp2, own);
  await expect(advance(exp2)).rejects.toMatchObject({ code: "PT409", message: "Antes de avanzar: Recibe los documentos del checklist" });
});

it("con el arranque completo avanza", async () => {
  await prepare(exp3);
  await cumplirArranque(db, exp3, own);
  expect((await advance(exp3)).rows).toEqual([{ etapa: "documentacion" }]);
});
