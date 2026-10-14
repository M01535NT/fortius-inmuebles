import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

let db: PGlite;
const admin = "52000000-0000-4000-8000-000000000001";
const own = "52000000-0000-4000-8000-000000000002";
const other = "52000000-0000-4000-8000-000000000003";
const exp = "52000000-0000-4000-8000-000000000010";
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
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio,operacion) values ('${exp}','c-own','own','EXP-OPERACION','renta');`);
});
afterAll(async () => { await db?.close(); });

it("registra cambios y notas, y limita lectura y escritura al asesor responsable", async () => {
  await asUser(own, async () => {
    const changed = await db.query(
      "update public.fortius_inmuebles_expedientes set etapa='documentacion',fecha_objetivo='2026-11-15',checklist='{\"identidad\":\"recibido\"}',version=2 where id=$1 and version=1 returning etapa,fecha_objetivo::text,version::int",
      [exp],
    );
    expect(changed.rows).toEqual([{ etapa: "documentacion", fecha_objetivo: "2026-11-15", version: 2 }]);
    await db.query("insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion) values ($1,'nota','Solicitar escritura')", [exp]);
    const rows = (await db.query("select tipo,descripcion from public.fortius_inmuebles_expediente_actividad order by created_at")).rows;
    expect(rows).toContainEqual({ tipo: "cambio", descripcion: expect.stringContaining("Etapa: captacion") });
    expect(rows).toContainEqual({ tipo: "nota", descripcion: "Solicitar escritura" });
    expect((await db.query("update public.fortius_inmuebles_expedientes set etapa='cierre',version=2 where id=$1 and version=1 returning id", [exp])).rows).toEqual([]);
  });
  await asUser(other, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_expediente_actividad")).rows).toEqual([]);
    await expect(db.query("insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion) values ($1,'nota','Ajena')", [exp])).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(own, async () => {
    await expect(db.query("insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion) values ($1,'cambio','Falso')", [exp])).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("update public.fortius_inmuebles_expedientes set checklist='{\"identidad\":\"inventado\"}',version=3 where id=$1", [exp])).rejects.toMatchObject({ code: "23514" });
  });
});
