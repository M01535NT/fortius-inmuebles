import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

let db: PGlite;
const admin = "51000000-0000-4000-8000-000000000001";
const own = "51000000-0000-4000-8000-000000000002";
const other = "51000000-0000-4000-8000-000000000003";
const expediente = "51000000-0000-4000-8000-000000000010";
const draft = "51000000-0000-4000-8000-000000000011";

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
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${admin}'),('${own}'),('${other}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
  await db.exec(`insert into public.mnt_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.mnt_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente propio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}'),
    ('clientes','c-other','{"id":"c-other","nombre":"Cliente ajeno","telefono":"6641234567","tipo":"propietario","asesorId":"other","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.mnt_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.mnt_expedientes(id,cliente_id,asesor_id,folio) values ('${expediente}','c-own','own','EXP-1');
    insert into public.mnt_formato_drafts(id,expediente_id,formato_id,data) values ('${draft}','${expediente}','18','{}');`);
});
afterAll(async () => { await db?.close(); });

it("permite al asesor consultar solo su cliente y expediente", async () => {
  await asUser(own, async () => {
    expect((await db.query("select id from public.mnt_records where collection='clientes'")).rows).toEqual([{ id: "c-own" }]);
    expect((await db.query("select folio from public.mnt_expedientes")).rows).toEqual([{ folio: "EXP-1" }]);
    expect((await db.query("select formato_id from public.mnt_formato_drafts")).rows).toEqual([{ formato_id: "18" }]);
  });
  await asUser(other, async () => {
    expect((await db.query("select id from public.mnt_records where collection='clientes'")).rows).toEqual([{ id: "c-other" }]);
    expect((await db.query("select id from public.mnt_expedientes")).rows).toEqual([]);
    expect((await db.query("select id from public.mnt_formato_drafts")).rows).toEqual([]);
  });
});

it("rechaza escritura ajena por RPC y conserva emisiones sin cambios", async () => {
  await asUser(other, async () => {
    const changed = { id: "c-own", nombre: "Alterado", telefono: "6641234567", tipo: "propietario", asesorId: "other", notas: "", creadoEl: "2026-10-04", actualizadoEl: "2026-10-04" };
    await expect(db.query("select public.mnt_put_record('clientes','c-own',$1::jsonb,1)", [JSON.stringify(changed)])).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(own, async () => {
    const emission = "51000000-0000-4000-8000-000000000012";
    await expect(db.query("insert into public.mnt_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)", [emission, draft, "a".repeat(64), `${expediente}/${emission}.pdf`, own])).rejects.toMatchObject({ code: "42501" });
  });
  const emission = "51000000-0000-4000-8000-000000000012";
  await db.query("insert into public.mnt_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)", [emission, draft, "a".repeat(64), `${expediente}/${emission}.pdf`, own]);
  await asUser(own, async () => {
    await expect(db.query("update public.mnt_formato_emissions set sha256=$1 where id=$2", ["b".repeat(64), emission])).rejects.toMatchObject({ code: "42501" });
  });
});

it("impide mover un expediente o documento a otro cliente y exige versión siguiente", async () => {
  await asUser(own, async () => {
    await expect(db.query("update public.mnt_expedientes set cliente_id='c-other',version=2 where id=$1", [expediente])).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("update public.mnt_expedientes set folio='EXP-2' where id=$1", [expediente])).rejects.toMatchObject({ code: "PT409" });
    await expect(db.query("update public.mnt_formato_drafts set version=9 where id=$1", [draft])).rejects.toMatchObject({ code: "PT409" });
  });
});

it("mantiene todo el módulo fuera del acceso anónimo", async () => {
  await asUser(null, async () => {
    await expect(db.query("select * from public.mnt_expedientes")).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("select * from public.mnt_formato_emissions")).rejects.toMatchObject({ code: "42501" });
  });
});

it("reserva copias firmadas privadas e inmutables para el asesor del expediente", async () => {
  const emission = "51000000-0000-4000-8000-000000000013";
  const signed = "51000000-0000-4000-8000-000000000014";
  await db.query("insert into public.mnt_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)", [emission, draft, "a".repeat(64), `${expediente}/${emission}.pdf`, own]);
  await asUser(own, async () => {
    await expect(db.query("insert into public.mnt_signed_copies(id,emission_id,sha256,path,uploaded_by) values ($1,$2,$3,$4,$5)", [signed, emission, "b".repeat(64), `${expediente}/${signed}.pdf`, own])).rejects.toMatchObject({ code: "42501" });
  });
  await db.query("insert into public.mnt_signed_copies(id,emission_id,sha256,path,uploaded_by) values ($1,$2,$3,$4,$5)", [signed, emission, "b".repeat(64), `${expediente}/${signed}.pdf`, own]);
  await asUser(own, async () => {
    expect((await db.query("select id from public.mnt_signed_copies")).rows).toEqual([{ id: signed }]);
    await expect(db.query("delete from public.mnt_signed_copies where id=$1", [signed])).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(other, async () => expect((await db.query("select id from public.mnt_signed_copies")).rows).toEqual([]));
});

it("reserva imágenes de un borrador al asesor del expediente y conserva su integridad", async () => {
  const asset = "51000000-0000-4000-8000-000000000015";
  await asUser(own, async () => {
    await expect(db.query("insert into public.mnt_formato_assets(id,draft_id,kind,caption,source,mime,byte_length,sha256,path,uploaded_by) values ($1,$2,'foto','Fachada','Visita','image/jpeg',4,$3,$4,$5)", [asset, draft, "a".repeat(64), `${expediente}/${draft}/${asset}.jpg`, own])).rejects.toMatchObject({ code: "42501" });
  });
  await db.query("insert into public.mnt_formato_assets(id,draft_id,kind,caption,source,mime,byte_length,sha256,path,uploaded_by) values ($1,$2,'foto','Fachada','Visita','image/jpeg',4,$3,$4,$5)", [asset, draft, "a".repeat(64), `${expediente}/${draft}/${asset}.jpg`, own]);
  await asUser(own, async () => {
    expect((await db.query("select id,caption from public.mnt_formato_assets")).rows).toEqual([{ id: asset, caption: "Fachada" }]);
    await expect(db.query("update public.mnt_formato_assets set caption='Otro' where id=$1", [asset])).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(other, async () => expect((await db.query("select id from public.mnt_formato_assets")).rows).toEqual([]));
  await asUser(null, async () => await expect(db.query("select id from public.mnt_formato_assets")).rejects.toMatchObject({ code: "42501" }));
});
