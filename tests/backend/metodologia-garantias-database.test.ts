import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

let db: PGlite;
const admin = "54000000-0000-4000-8000-000000000001";
const own = "54000000-0000-4000-8000-000000000002";
const other = "54000000-0000-4000-8000-000000000003";
const operation = "54000000-0000-4000-8000-000000000010";
const put = (collection: string, id: string, data: unknown, version: number | null = null) =>
  db.query<{ r: { version: number } }>("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,$4) as r", [collection, id, JSON.stringify(data), version]).then(x => x.rows[0].r);
const settings = { nombreComercial: "Fortius", telefono: "", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" };
async function asUser<T>(uid: string, action: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
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
  for (const file of (await readdir(dir)).filter(name => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');`);
  await asUser(admin, async () => {
    await put("asesores", "own", { id: "own", nombre: "Ana", cargo: "Asesora", iniciales: "AA", activo: true });
    await put("asesores", "other", { id: "other", nombre: "Luis", cargo: "Asesor", iniciales: "LL", activo: true });
    await put("config", "singleton", settings);
  });
  await db.exec(`insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_records(collection,id,data) values ('clientes','c-own','{"id":"c-own","nombre":"Propietario ficticio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-11-12","actualizadoEl":"2026-11-12"}');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${operation}','c-own','own','EXP-ALCANCE');`);
});
afterAll(async () => { await db?.close(); });
const reviewed = (soporte: string) => ({ estado: "revisado", soporte, evidencia: { tipo: "externa", referencia: "Documento sintético de ensayo · versión 1", fecha: "2026-11-12", responsable: "Revisor de ensayo", resultado: "Dentro del alcance de prueba" } });
// La regla es de la base y no depende de la ruta; la operación de ensayo es la de staff-scope.
const rent = (requisitos: Record<string, unknown>) => ({ version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos });
async function saveFlow(value: Record<string, unknown>) {
  const version = (await db.query<{ version: number }>("select version from public.fortius_inmuebles_expedientes where id=$1", [operation])).rows[0].version;
  return db.query("select public.fortius_inmuebles_update_operation($1,$2,'captacion',null,'{}'::jsonb,$3::jsonb,null,false)", [operation, version, JSON.stringify(value)]);
}

/*
  Metodología M-06 (decisión del titular, 14/11/2026): una renta sin depósito ni garantía la aprueba
  el director. El asesor puede dejar las garantías en «Lo tengo» o revisarlas con su respaldo, pero
  marcar «No aplica» es del director.
*/
it("solo el director marca que una renta no lleva depósito ni garantía", async () => {
  const sinGarantia = { estado: "no_aplica", soporte: "El propietario acepta rentar sin depósito ni fiador" };
  await asUser(own, async () => {
    await expect(saveFlow(rent({ garantias_renta: sinGarantia }))).rejects.toMatchObject({ code: "PT403" });
    await saveFlow(rent({ garantias_renta: reviewed("Depósito de dos meses recibido") }));
    await saveFlow(rent({ garantias_renta: { estado: "recibido", soporte: "Propuesta sin garantía para el director" } }));
  });
  await asUser(admin, async () => { await saveFlow(rent({ garantias_renta: sinGarantia })); });
  await asUser(own, async () => {
    // Otro cambio conserva la decisión del director.
    await saveFlow(rent({ entrevista: { estado: "recibido", soporte: "Entrevista de ensayo" } }));
    const r = (await db.query<{ e: string }>("select flujo->'requisitos'->'garantias_renta'->>'estado' e from public.fortius_inmuebles_expedientes where id=$1", [operation])).rows[0].e;
    expect(r).toBe("no_aplica");
  });
});
