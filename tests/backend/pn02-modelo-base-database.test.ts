import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// PN-02 · modelo base del panel nuevo: pendientes, miembros, folios reservados, historial y notas (RP-101, RP-107).
const DIR = "70000000-0000-4000-8000-0000000000d1";
const A = "70000000-0000-4000-8000-0000000000a1";
const B = "70000000-0000-4000-8000-0000000000b1";
let db: PGlite;

async function como<T>(uid: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`);
  try { return await fn(); } finally { await db.exec("reset role; select set_config('request.jwt.claim.sub','',false);"); }
}
const nuevoPendiente = (responsable: string, persona: string | null = null) =>
  db.query<{ id: string; version: number }>(
    "insert into public.fortius_inmuebles_pendientes (tipo, titulo, fecha, responsable_id, persona_id) values ('llamada','Llamar',current_date,$1,$2) returning id, version",
    [responsable, persona],
  );
const nuevoAsunto = async (folio?: string, asesor = "as-a", cliente = "cli-a") =>
  (await db.query<{ id: string; folio: string }>(
    "insert into public.fortius_inmuebles_expedientes (cliente_id, asesor_id, folio) values ($2,$3,$1) returning id, folio",
    [folio ?? "", cliente, asesor],
  )).rows[0];
const pendienteEn = (responsable: string, asunto: string, persona: string | null = null) =>
  db.query("insert into public.fortius_inmuebles_pendientes (tipo, titulo, responsable_id, asunto_id, persona_id) values ('tarea','Revisar',$1,$2,$3)", [responsable, asunto, persona]);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated,service_role; grant all on storage.objects to anon,authenticated,service_role;
    insert into auth.users values ('${DIR}'), ('${A}'), ('${B}');`);
  const dir = new URL("../../supabase/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((n) => n.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(f, dir), "utf8"));
  await db.exec(`grant usage on schema public to authenticated;
    insert into public.fortius_inmuebles_staff (user_id, role) values ('${DIR}','admin'), ('${A}','editor'), ('${B}','editor');
    insert into public.fortius_inmuebles_records (collection, id, data) values
      ('asesores','as-dir','{"id":"as-dir","nombre":"Dirección ficticia","cargo":"Director","iniciales":"DF","activo":true}'),
      ('asesores','as-a','{"id":"as-a","nombre":"Asesora ficticia","cargo":"Asesor","iniciales":"AA","activo":true}'),
      ('asesores','as-b','{"id":"as-b","nombre":"Asesor ficticio","cargo":"Asesor","iniciales":"AB","activo":true}'),
      ('clientes','cli-a','{"id":"cli-a","nombre":"Cliente A","telefono":"6641234567","tipo":"propietario","asesorId":"as-a","notas":"","creadoEl":"2026-11-16","actualizadoEl":"2026-11-16"}'),
      ('clientes','cli-b','{"id":"cli-b","nombre":"Cliente B","telefono":"6641234568","tipo":"propietario","asesorId":"as-b","notas":"","creadoEl":"2026-11-16","actualizadoEl":"2026-11-16"}');
    insert into public.fortius_inmuebles_adviser_accounts (user_id, asesor_id) values ('${DIR}','as-dir'), ('${A}','as-a'), ('${B}','as-b');`);
});
afterAll(async () => { await db?.close(); });

describe("pendientes (RP-101)", () => {
  it("el director tiene ficha propia y puede ser responsable (decisión 3 de AUD-02)", async () => {
    expect((await como(DIR, () => db.query<{ v: string }>("select public.fortius_inmuebles_mi_asesor_id() v"))).rows[0].v).toBe("as-dir");
  });
  it("el asesor solo se asigna a sí mismo y solo con sus clientes; el director asigna a cualquiera", async () => {
    const p = await como(A, () => nuevoPendiente("as-a", "cli-a"));
    expect(Number(p.rows[0].version)).toBe(1);
    await expect(como(A, () => nuevoPendiente("as-b"))).rejects.toThrow();
    await expect(como(A, () => nuevoPendiente("as-a", "cli-b"))).rejects.toThrow();
    await como(DIR, () => nuevoPendiente("as-b"));
    expect((await como(B, () => db.query<{ n: number }>("select count(*)::int n from public.fortius_inmuebles_pendientes"))).rows[0].n).toBe(1);
    expect((await como(DIR, () => db.query<{ n: number }>("select count(*)::int n from public.fortius_inmuebles_pendientes"))).rows[0].n).toBe(2);
  });
  it("versión optimista, quién lo hizo, sin reasignar ni borrar", async () => {
    const { id } = (await como(A, () => nuevoPendiente("as-a"))).rows[0];
    const hecho = await como(A, () => db.query<{ version: number; hecho_por: string }>("update public.fortius_inmuebles_pendientes set estado='hecho' where id=$1 and version=1 returning version, hecho_por", [id]));
    expect(Number(hecho.rows[0].version)).toBe(2);
    expect(hecho.rows[0].hecho_por).toBe(A);
    expect((await como(A, () => db.query("update public.fortius_inmuebles_pendientes set titulo='x' where id=$1 and version=1", [id]))).affectedRows).toBe(0);
    await expect(como(A, () => db.query("update public.fortius_inmuebles_pendientes set version=1 where id=$1", [id]))).rejects.toThrow(/cambió/);
    await expect(como(A, () => db.query("update public.fortius_inmuebles_pendientes set responsable_id='as-b' where id=$1", [id]))).rejects.toThrow(/dirección/);
    await expect(como(A, () => db.query("delete from public.fortius_inmuebles_pendientes where id=$1", [id]))).rejects.toThrow();
    const reasignado = await como(DIR, () => db.query("update public.fortius_inmuebles_pendientes set responsable_id='as-b' where id=$1", [id]));
    expect(reasignado.affectedRows).toBe(1);
  });
});

describe("asuntos, miembros, notas e historial", () => {
  it("el asesor ve sus asuntos y los que le comparten; solo el director arma el equipo", async () => {
    const { id } = await nuevoAsunto();
    const ve = (uid: string) => como(uid, async () => (await db.query<{ v: boolean }>("select public.fortius_inmuebles_puede_ver_asunto($1) v", [id])).rows[0].v);
    expect(await ve(A)).toBe(true);
    expect(await ve(B)).toBe(false);
    await expect(como(A, () => db.query("insert into public.fortius_inmuebles_asunto_miembros (asunto_id, asesor_id, creado_por) values ($1,'as-b',$2)", [id, A]))).rejects.toThrow();
    await como(DIR, () => db.query("insert into public.fortius_inmuebles_asunto_miembros (asunto_id, asesor_id, creado_por) values ($1,'as-b',$2)", [id, DIR]));
    expect(await ve(B)).toBe(true);
    // El colaborador lee el asunto mismo, no solo lo que cuelga de él (AUD-04, I1).
    expect((await como(B, () => db.query("select id from public.fortius_inmuebles_expedientes where id=$1", [id]))).rows).toHaveLength(1);
    // Puede anotar pendientes con la persona del asunto aunque no lleve su ficha (I4), pero no con esa persona suelta.
    await como(B, () => pendienteEn("as-b", id, "cli-a"));
    await expect(como(B, () => nuevoPendiente("as-b", "cli-a"))).rejects.toThrow();
    // No puede sumar al asunto a una persona que no ve (I5).
    await expect(como(B, () => db.query("insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, creado_por) values ($1,'cli-b','compra',$2)", [id, B]))).resolves.toBeDefined();
    await expect(como(A, () => db.query("insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, creado_por) values ($1,'cli-b','aliado',$2)", [id, A]))).rejects.toThrow();
    await como(B, () => db.query("insert into public.fortius_inmuebles_notas_internas (asunto_id, texto, autor) values ($1,'Llamó el banco',$2)", [id, B]));
    await expect(como(B, () => db.query("update public.fortius_inmuebles_notas_internas set texto='otra'"))).rejects.toThrow();
    await como(A, () => db.query("select public.fortius_inmuebles_anotar_historial('asunto',$1::text,$2::uuid,'nota','Agregó una nota')", [id, id]));
    const h = await db.query<{ actor_id: string }>("select actor_id from public.fortius_inmuebles_historial where asunto_id=$1", [id]);
    expect(h.rows[0].actor_id).toBe(A);
    await expect(db.query("update public.fortius_inmuebles_historial set resumen='x'")).rejects.toThrow();
  });
  it("el asesor no cuelga pendientes del asunto de otro (AUD-04, I3)", async () => {
    const ajeno = await nuevoAsunto(undefined, "as-b", "cli-b");
    await expect(como(A, () => pendienteEn("as-a", ajeno.id))).rejects.toThrow();
    const { rows } = await como(A, () => nuevoPendiente("as-a"));
    await expect(como(A, () => db.query("update public.fortius_inmuebles_pendientes set asunto_id=$2 where id=$1", [rows[0].id, ajeno.id]))).rejects.toThrow();
  });
  it("un asunto cerrado lleva resultado", async () => {
    const { id } = await nuevoAsunto();
    await expect(db.query("update public.fortius_inmuebles_expedientes set estado_asunto='cerrado' where id=$1", [id])).rejects.toThrow();
  });
});

describe("folios reservados (RP-107)", () => {
  it("un folio borrado no se reutiliza y el folio de un asunto no cambia", async () => {
    const primero = await nuevoAsunto();
    expect(primero.folio).toMatch(/^EXP-\d{6}$/);
    await db.exec(`update public.fortius_inmuebles_expedientes set deleted_at=now() where id='${primero.id}'`).catch(() => undefined);
    await db.exec(`delete from public.fortius_inmuebles_expedientes where id='${primero.id}'`).catch(() => undefined);
    const segundo = await nuevoAsunto();
    expect(Number(segundo.folio.slice(4))).toBeGreaterThan(Number(primero.folio.slice(4)));
    await expect(db.query("update public.fortius_inmuebles_expedientes set folio='EXP-999999' where id=$1", [segundo.id])).rejects.toThrow(/no cambia/);
    const reservados = await db.query<{ folio: string }>("select folio from public.fortius_inmuebles_folios where serie='EXP'");
    expect(reservados.rows.map((r) => r.folio)).toEqual(expect.arrayContaining([primero.folio, segundo.folio]));
    await expect(db.query("delete from public.fortius_inmuebles_folios")).rejects.toThrow();
    // Un folio puesto a mano que ya se usó se rechaza (AUD-04, menor 2); el libro solo lo ve dirección (menor 7).
    await expect(nuevoAsunto(primero.folio)).rejects.toThrow(/ya se usó/);
    expect((await como(A, () => db.query("select * from public.fortius_inmuebles_folios"))).rows).toHaveLength(0);
    expect((await como(DIR, () => db.query("select * from public.fortius_inmuebles_folios"))).rows.length).toBeGreaterThan(1);
  });
});
