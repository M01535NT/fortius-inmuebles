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
  await db.exec(`insert into public.fortius_inmuebles_staff(user_id,role) values ('${admin}','admin'),('${own}','editor'),('${other}','editor');
    insert into public.fortius_inmuebles_records(collection,id,data) values
    ('asesores','own','{"id":"own","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
    ('asesores','other','{"id":"other","nombre":"Luis","cargo":"Asesor","iniciales":"LL","activo":true}'),
    ('clientes','c-own','{"id":"c-own","nombre":"Cliente propio","telefono":"6641234567","tipo":"propietario","asesorId":"own","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}'),
    ('clientes','c-other','{"id":"c-other","nombre":"Cliente ajeno","telefono":"6641234567","tipo":"propietario","asesorId":"other","notas":"","creadoEl":"2026-10-04","actualizadoEl":"2026-10-04"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${own}','own'),('${other}','other');
    insert into public.fortius_inmuebles_expedientes(id,cliente_id,asesor_id,folio) values ('${expediente}','c-own','own','EXP-1');
    insert into public.fortius_inmuebles_formato_drafts(id,expediente_id,formato_id,data) values ('${draft}','${expediente}','18','{}');`);
});
afterAll(async () => { await db?.close(); });

for (const collection of ["tareas", "eventos", "notas"]) {
  it(`impide actualizar, borrar o desvincular ${collection} de un cliente ajeno mediante RPC`, async () => {
    const id = `restricted-${collection}`;
    const data = collection === "tareas" ? { id, titulo: "Privado", categoria: "documentacion", estado: "pendiente", prioridad: "normal", clienteId: "c-own" }
      : collection === "eventos" ? { id, titulo: "Privado", fecha: "2026-10-04", hora: "10:00", tipo: "reunion", notas: "", clienteId: "c-own" }
        : { id, titulo: "Privado", texto: "Detalle confidencial", actualizadoEl: "2026-10-04", clienteId: "c-own" };
    await asUser(admin, () => db.query("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,null)", [collection, id, JSON.stringify(data)]));
    await asUser(other, async () => {
      expect((await db.query("select id from public.fortius_inmuebles_records where collection=$1 and id=$2", [collection, id])).rows).toEqual([]);
      await expect(db.query("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,1)", [collection, id, JSON.stringify({ ...data, titulo: "Alterado" })])).rejects.toMatchObject({ code: "PT403" });
      await expect(db.query("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,1)", [collection, id, JSON.stringify({ ...data, clienteId: "c-other" })])).rejects.toMatchObject({ code: "PT403" });
      await expect(db.query("select public.fortius_inmuebles_delete_record($1,$2,1)", [collection, id])).rejects.toMatchObject({ code: "PT403" });
    });
    await asUser(own, async () => {
      await expect(db.query("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,1)", [collection, id, JSON.stringify({ ...data, clienteId: "" })])).rejects.toMatchObject({ code: "PT403" });
      expect((await db.query("select public.fortius_inmuebles_put_record($1,$2,$3::jsonb,1) as result", [collection, id, JSON.stringify({ ...data, titulo: "Seguimiento propio" })])).rows).toHaveLength(1);
    });
  });
}

it("no concede acceso a una ruta privada al copiarla en metadatos de otro cliente", async () => {
  const path = `${own}/55000000-0000-4000-8000-000000000001.pdf`;
  await db.query("insert into storage.objects(bucket_id,name,owner_id) values ('fortius-inmuebles-private',$1,$2)", [path, own]);
  await asUser(other, async () => {
    expect((await db.query("select public.fortius_inmuebles_private_path_visible($1) as visible", [path])).rows).toEqual([{ visible: false }]);
    await expect(db.query("select public.fortius_inmuebles_put_record('archivos','forged',$1::jsonb,null)", [JSON.stringify({ id: "forged", nombre: "Ajeno", url: "/api/admin/files", tipo: "pdf", notas: "", bucket: "fortius-inmuebles-private", path, visibility: "private", clienteId: "c-other" })])).rejects.toMatchObject({ code: "PT403" });
    expect((await db.query("select name from storage.objects where name=$1", [path])).rows).toEqual([]);
  });
});

it("vincula una carga verificada una sola vez y respeta la reasignación y eliminación posterior", async () => {
  const path = `${own}/55000000-0000-4000-8000-000000000002.pdf`;
  const data = { id: "trusted-file", nombre: "Verificado", url: "/api/admin/files", tipo: "pdf", notas: "", bucket: "fortius-inmuebles-private", path, visibility: "private", clienteId: "c-own" };
  await asUser(own, async () => {
    await expect(db.query("insert into public.fortius_inmuebles_file_uploads(bucket,path,uploaded_by) values ('fortius-inmuebles-private',$1,$2)", [path, own])).rejects.toMatchObject({ code: "42501" });
  });
  await db.query("insert into public.fortius_inmuebles_file_uploads(bucket,path,uploaded_by) values ('fortius-inmuebles-private',$1,$2)", [path, own]);
  await asUser(own, async () => {
    await db.query("select public.fortius_inmuebles_put_record('archivos','trusted-file',$1::jsonb,null)", [JSON.stringify(data)]);
    expect((await db.query("select public.fortius_inmuebles_private_path_visible($1) as visible", [path])).rows).toEqual([{ visible: true }]);
    await expect(db.query("select public.fortius_inmuebles_put_record('archivos','trusted-file',$1::jsonb,1)", [JSON.stringify({ ...data, visibility: "public" })])).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(admin, () => db.query("select public.fortius_inmuebles_put_record('archivos','trusted-file',$1::jsonb,1)", [JSON.stringify({ ...data, clienteId: "c-other" })]));
  await asUser(own, async () => {
    expect((await db.query("select public.fortius_inmuebles_private_path_visible($1) as visible", [path])).rows).toEqual([{ visible: false }]);
    await expect(db.query("select public.fortius_inmuebles_put_record('archivos','duplicate',$1::jsonb,null)", [JSON.stringify({ ...data, id: "duplicate" })])).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(other, async () => expect((await db.query("select public.fortius_inmuebles_private_path_visible($1) as visible", [path])).rows).toEqual([{ visible: true }]));
  await asUser(admin, () => db.query("select public.fortius_inmuebles_delete_record('archivos','trusted-file',2)"));
  await asUser(own, async () => {
    await expect(db.query("select public.fortius_inmuebles_put_record('archivos','reclaimed',$1::jsonb,null)", [JSON.stringify({ ...data, id: "reclaimed" })])).rejects.toMatchObject({ code: "PT403" });
    expect((await db.query("select public.fortius_inmuebles_private_path_visible($1) as visible", [path])).rows).toEqual([{ visible: false }]);
  });
  await expect(db.query("update public.fortius_inmuebles_file_uploads set record_id=null where path=$1", [path])).rejects.toMatchObject({ code: "PT403" });
});

it("mantiene compatible la carga anterior del administrador sólo si el objeto existe bajo su propia ruta", async () => {
  const path = `${admin}/55000000-0000-4000-8000-000000000003.pdf`;
  const data = { id: "legacy-admin-file", nombre: "Carga validada", url: "/api/admin/files", tipo: "pdf", notas: "", bucket: "fortius-inmuebles-private", path, visibility: "private" };
  await asUser(admin, async () => {
    await expect(db.query("select public.fortius_inmuebles_put_record('archivos','legacy-admin-file',$1::jsonb,null)", [JSON.stringify(data)])).rejects.toMatchObject({ code: "PT403" });
  });
  await db.query("insert into storage.objects(bucket_id,name) values ('fortius-inmuebles-private',$1)", [path]);
  await asUser(admin, () => db.query("select public.fortius_inmuebles_put_record('archivos','legacy-admin-file',$1::jsonb,null)", [JSON.stringify(data)]));
  expect((await db.query("select record_id from public.fortius_inmuebles_file_uploads where path=$1", [path])).rows).toEqual([{ record_id: "legacy-admin-file" }]);
});

it("permite al asesor consultar solo su cliente y expediente", async () => {
  await asUser(own, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='clientes'")).rows).toEqual([{ id: "c-own" }]);
    expect((await db.query("select folio from public.fortius_inmuebles_expedientes")).rows).toEqual([{ folio: "EXP-1" }]);
    expect((await db.query("select formato_id from public.fortius_inmuebles_formato_drafts")).rows).toEqual([{ formato_id: "18" }]);
  });
  await asUser(other, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='clientes'")).rows).toEqual([{ id: "c-other" }]);
    expect((await db.query("select id from public.fortius_inmuebles_expedientes")).rows).toEqual([]);
    expect((await db.query("select id from public.fortius_inmuebles_formato_drafts")).rows).toEqual([]);
  });
});

it("permite crear y devolver un expediente propio en la misma operación de guardado", async () => {
  await asUser(own, async () => {
    const result = await db.query("insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id,folio) values ('c-own','own','EXP-INSERT-RETURNING') returning folio,version");
    expect(result.rows).toEqual([{ folio: "EXP-INSERT-RETURNING", version: 1 }]);
  });
});

it("rechaza escritura ajena por RPC y conserva emisiones sin cambios", async () => {
  await asUser(other, async () => {
    const changed = { id: "c-own", nombre: "Alterado", telefono: "6641234567", tipo: "propietario", asesorId: "other", notas: "", creadoEl: "2026-10-04", actualizadoEl: "2026-10-04" };
    await expect(db.query("select public.fortius_inmuebles_put_record('clientes','c-own',$1::jsonb,1)", [JSON.stringify(changed)])).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(own, async () => {
    const emission = "51000000-0000-4000-8000-000000000012";
    await expect(db.query("insert into public.fortius_inmuebles_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)", [emission, draft, "a".repeat(64), `${expediente}/${emission}.pdf`, own])).rejects.toMatchObject({ code: "42501" });
  });
  const emission = "51000000-0000-4000-8000-000000000012";
  await db.query("insert into public.fortius_inmuebles_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)", [emission, draft, "a".repeat(64), `${expediente}/${emission}.pdf`, own]);
  await asUser(own, async () => {
    await expect(db.query("update public.fortius_inmuebles_formato_emissions set sha256=$1 where id=$2", ["b".repeat(64), emission])).rejects.toMatchObject({ code: "42501" });
  });
});

it("impide mover un expediente o documento a otro cliente y exige versión siguiente", async () => {
  await asUser(own, async () => {
    await expect(db.query("update public.fortius_inmuebles_expedientes set cliente_id='c-other',version=2 where id=$1", [expediente])).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("update public.fortius_inmuebles_expedientes set folio='EXP-2' where id=$1", [expediente])).rejects.toMatchObject({ code: "PT409" });
    await expect(db.query("update public.fortius_inmuebles_formato_drafts set version=9 where id=$1", [draft])).rejects.toMatchObject({ code: "PT409" });
  });
});

it("mantiene todo el módulo fuera del acceso anónimo", async () => {
  await asUser(null, async () => {
    await expect(db.query("select * from public.fortius_inmuebles_expedientes")).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("select * from public.fortius_inmuebles_formato_emissions")).rejects.toMatchObject({ code: "42501" });
  });
});

it("reserva copias firmadas privadas e inmutables para el asesor del expediente", async () => {
  const emission = "51000000-0000-4000-8000-000000000013";
  const signed = "51000000-0000-4000-8000-000000000014";
  await db.query("insert into public.fortius_inmuebles_formato_emissions(id,draft_id,snapshot,sha256,path,created_by) values ($1,$2,'{}',$3,$4,$5)", [emission, draft, "a".repeat(64), `${expediente}/${emission}.pdf`, own]);
  await asUser(own, async () => {
    await expect(db.query("insert into public.fortius_inmuebles_signed_copies(id,emission_id,sha256,path,uploaded_by) values ($1,$2,$3,$4,$5)", [signed, emission, "b".repeat(64), `${expediente}/${signed}.pdf`, own])).rejects.toMatchObject({ code: "42501" });
  });
  await db.query("insert into public.fortius_inmuebles_signed_copies(id,emission_id,sha256,path,uploaded_by) values ($1,$2,$3,$4,$5)", [signed, emission, "b".repeat(64), `${expediente}/${signed}.pdf`, own]);
  await asUser(own, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_signed_copies")).rows).toEqual([{ id: signed }]);
    await expect(db.query("delete from public.fortius_inmuebles_signed_copies where id=$1", [signed])).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(other, async () => expect((await db.query("select id from public.fortius_inmuebles_signed_copies")).rows).toEqual([]));
});

it("reserva imágenes de un borrador al asesor del expediente y conserva su integridad", async () => {
  const asset = "51000000-0000-4000-8000-000000000015";
  await asUser(own, async () => {
    await expect(db.query("insert into public.fortius_inmuebles_formato_assets(id,draft_id,kind,caption,source,mime,byte_length,sha256,path,uploaded_by) values ($1,$2,'foto','Fachada','Visita','image/jpeg',4,$3,$4,$5)", [asset, draft, "a".repeat(64), `${expediente}/${draft}/${asset}.jpg`, own])).rejects.toMatchObject({ code: "42501" });
  });
  await db.query("insert into public.fortius_inmuebles_formato_assets(id,draft_id,kind,caption,source,mime,byte_length,sha256,path,uploaded_by) values ($1,$2,'foto','Fachada','Visita','image/jpeg',4,$3,$4,$5)", [asset, draft, "a".repeat(64), `${expediente}/${draft}/${asset}.jpg`, own]);
  await asUser(own, async () => {
    expect((await db.query("select id,caption from public.fortius_inmuebles_formato_assets")).rows).toEqual([{ id: asset, caption: "Fachada" }]);
    await expect(db.query("update public.fortius_inmuebles_formato_assets set caption='Otro' where id=$1", [asset])).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(other, async () => expect((await db.query("select id from public.fortius_inmuebles_formato_assets")).rows).toEqual([]));
  await asUser(null, async () => await expect(db.query("select id from public.fortius_inmuebles_formato_assets")).rejects.toMatchObject({ code: "42501" }));
});

it("valida vínculos de agenda y oculta eventos de clientes y expedientes ajenos", async () => {
  const linked = { id: "event-linked", titulo: "Visita privada", fecha: "2026-10-04", tipo: "visita", clienteId: "c-own", asesorId: "own", expedienteId: expediente };
  await asUser(own, async () => {
    await db.query("select public.fortius_inmuebles_put_record('eventos',$1,$2::jsonb,null)", [linked.id, JSON.stringify(linked)]);
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='eventos' and id=$1", [linked.id])).rows).toEqual([{ id: linked.id }]);
    await expect(db.query("select public.fortius_inmuebles_put_record('eventos','event-mismatch',$1::jsonb,null)", [JSON.stringify({ ...linked, id: "event-mismatch", asesorId: "other" })])).rejects.toMatchObject({ code: "PT403" });
    await expect(db.query("select public.fortius_inmuebles_put_record('eventos','event-foreign',$1::jsonb,null)", [JSON.stringify({ ...linked, id: "event-foreign", clienteId: "c-other" })])).rejects.toMatchObject({ code: "PT403" });
  });
  await asUser(other, async () => {
    expect((await db.query("select id from public.fortius_inmuebles_records where collection='eventos' and id=$1", [linked.id])).rows).toEqual([]);
  });
});

it("los documentos del cliente solo los ve quien tiene acceso al expediente y no se escriben directo", async () => {
  const archivo = "51000000-0000-4000-8000-000000000020";
  const row = [archivo, expediente, "Escritura", "escritura.pdf", "application/pdf", 1024, "b".repeat(64), `${expediente}/cliente/${archivo}.pdf`, own];
  const insert = "insert into public.fortius_inmuebles_expediente_archivos(id,expediente_id,titulo,nombre_original,mime,byte_length,sha256,path,uploaded_by) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)";
  await asUser(own, () => expect(db.query(insert, row)).rejects.toMatchObject({ code: "42501" }));
  // Solo el servidor (rol de servicio) registra el archivo, después de comprobar el acceso.
  await db.query(insert, row);
  await expect(db.query(insert, [...row.slice(0, 4), "application/zip", ...row.slice(5)])).rejects.toBeTruthy();
  await asUser(own, async () => {
    expect((await db.query("select id,titulo from public.fortius_inmuebles_expediente_archivos")).rows).toEqual([{ id: archivo, titulo: "Escritura" }]);
    await expect(db.query("update public.fortius_inmuebles_expediente_archivos set titulo='Otro' where id=$1", [archivo])).rejects.toMatchObject({ code: "42501" });
  });
  await asUser(admin, async () => expect((await db.query("select id from public.fortius_inmuebles_expediente_archivos")).rows).toHaveLength(1));
  await asUser(other, async () => expect((await db.query("select id from public.fortius_inmuebles_expediente_archivos")).rows).toEqual([]));
  await asUser(null, () => expect(db.query("select id from public.fortius_inmuebles_expediente_archivos")).rejects.toMatchObject({ code: "42501" }));
});

it("los datos del expediente solo los ve quien tiene acceso y no se escriben directo", async () => {
  await asUser(own, () => expect(db.query("insert into public.fortius_inmuebles_expediente_datos(expediente_id,datos) values ($1,'{}')", [expediente])).rejects.toMatchObject({ code: "42501" }));
  await db.query("insert into public.fortius_inmuebles_expediente_datos(expediente_id,datos) values ($1,$2::jsonb)", [expediente, JSON.stringify({ folioReal: { valor: "123", estado: "confirmado" } })]);
  await asUser(own, async () => expect((await db.query<{ datos: Record<string, { valor: string }> }>("select datos from public.fortius_inmuebles_expediente_datos")).rows[0].datos.folioReal.valor).toBe("123"));
  await asUser(other, async () => expect((await db.query("select * from public.fortius_inmuebles_expediente_datos")).rows).toEqual([]));
  await expect(db.query("insert into public.fortius_inmuebles_expediente_datos(expediente_id,datos) values ($1,'[]')", ["51000000-0000-4000-8000-000000000099"])).rejects.toBeTruthy();
});
