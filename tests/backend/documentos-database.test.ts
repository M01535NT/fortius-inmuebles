import { afterAll, beforeAll, expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";

// FLX-01 (RP-101, RP-102): documentos sin operación. La base decide quién los ve; solo el servidor escribe.
let db: PGlite;
const ana = "40000000-0000-4000-8000-000000000041", beto = "40000000-0000-4000-8000-000000000042", director = "40000000-0000-4000-8000-000000000043";
const sha = "a".repeat(64);
async function as<T>(user: string, fn: () => Promise<T>) {
  await db.exec("set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  try { return await fn(); } finally { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
}
const visibles = () => db.query<{ id: string }>("select id from public.fortius_inmuebles_documentos order by id").then(x => x.rows.map(r => r.id));
const doc = (n: number) => `60000000-0000-4000-8000-00000000000${n}`;
const insertar = (n: number, extra: Record<string, string | null> = {}) => {
  const row: Record<string, string | null> = { id: doc(n), titulo: `Documento ${n}`, nombre_original: `doc${n}.pdf`, mime: "application/pdf", byte_length: "10", sha256: sha, path: `bandeja/${doc(n)}.pdf`, uploaded_by: ana, ...extra };
  const keys = Object.keys(row);
  return db.query(`insert into public.fortius_inmuebles_documentos(${keys.join(",")}) values(${keys.map((_, i) => `$${i + 1}`).join(",")})`, keys.map(k => row[k]));
};

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
      ('clientes','cli-beto','{"id":"cli-beto","nombre":"Cliente de Beto","telefono":"6640000001","tipo":"comprador","asesorId":"ase-beto","notas":"","creadoEl":"2026-11-01","actualizadoEl":"2026-11-01"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id,asesor_id) values ('${ana}','ase-ana'),('${beto}','ase-beto');`);
  // 1: en la Bandeja de Ana, sin liga. 2: del director, sin asesor. 3: de Ana, ligado a un cliente de Beto.
  // 4: de Ana, ligado a un inmueble sin propietario (RP-102).
  await insertar(1, { asesor_id: "ase-ana" });
  await insertar(2, { uploaded_by: director });
  await insertar(3, { asesor_id: "ase-ana", cliente_id: "cli-beto", archivado_el: "2026-11-14T10:00:00Z" });
  await insertar(4, { asesor_id: "ase-ana", propiedad_slug: "terreno-rosarito", archivado_el: "2026-11-14T10:00:00Z" });
});
afterAll(async () => { await db?.close(); });

test("un documento se guarda sin ninguna liga y vive en la Bandeja (RP-101)", async () => {
  const fila = (await db.query<{ archivado_el: string | null; cliente_id: string | null; propiedad_slug: string | null; expediente_id: string | null }>(
    "select archivado_el,cliente_id,propiedad_slug,expediente_id from public.fortius_inmuebles_documentos where id=$1", [doc(1)])).rows[0];
  expect(fila).toEqual({ archivado_el: null, cliente_id: null, propiedad_slug: null, expediente_id: null });
});

test("cada asesor ve lo suyo y lo de sus clientes; el director, todo; un anónimo, nada", async () => {
  expect(await as(ana, visibles)).toEqual([doc(1), doc(3), doc(4)]);
  // Beto no ve la Bandeja de Ana, pero sí el documento ligado a su cliente.
  expect(await as(beto, visibles)).toEqual([doc(3)]);
  expect(await as(director, visibles)).toEqual([doc(1), doc(2), doc(3), doc(4)]);
  await db.exec("set role anon");
  try { await expect(visibles()).rejects.toBeTruthy(); } finally { await db.exec("reset role"); }
});

test("nadie escribe directo en la tabla: ni insertar, ni cambiar, ni borrar", async () => {
  await as(ana, async () => {
    await expect(insertar(9, { asesor_id: "ase-ana" })).rejects.toBeTruthy();
    await expect(db.query("update public.fortius_inmuebles_documentos set titulo='Otro' where id=$1", [doc(1)])).rejects.toBeTruthy();
    await expect(db.query("delete from public.fortius_inmuebles_documentos where id=$1", [doc(1)])).rejects.toBeTruthy();
  });
  expect((await db.query<{ titulo: string }>("select titulo from public.fortius_inmuebles_documentos where id=$1", [doc(1)])).rows[0].titulo).toBe("Documento 1");
});

test("archivado exige una liga; la papelera exige quién; la ruta solo admite la carpeta de la Bandeja", async () => {
  await expect(insertar(5, { asesor_id: "ase-ana", archivado_el: "2026-11-14T10:00:00Z" })).rejects.toBeTruthy();
  await expect(insertar(6, { asesor_id: "ase-ana", deleted_at: "2026-11-14T10:00:00Z" })).rejects.toBeTruthy();
  await expect(insertar(7, { asesor_id: "ase-ana", path: `otra-carpeta/${doc(7)}.pdf` })).rejects.toBeTruthy();
  await expect(insertar(8, { asesor_id: "ase-inexistente" })).rejects.toBeTruthy();
});

test("la migración no toca los documentos del cliente de las operaciones", async () => {
  const columnas = (await db.query<{ column_name: string; is_nullable: string }>(
    "select column_name,is_nullable from information_schema.columns where table_schema='public' and table_name='fortius_inmuebles_expediente_archivos' and column_name='expediente_id'")).rows;
  expect(columnas).toEqual([{ column_name: "expediente_id", is_nullable: "NO" }]);
});
