import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// Panel 20 (19/11/2026): la consulta del sitio llega con el inmueble por el que se preguntó y, al abrir el asunto, ese
// inmueble queda ligado si quien abre ya lo ve. Sobre la base de ensayo con todas las migraciones. Solo datos de ejemplo.
let db: PGlite;
const ana = "59200000-0000-4000-8000-000000000001", beto = "59200000-0000-4000-8000-000000000002", director = "59200000-0000-4000-8000-000000000003";
const inm: Record<string, string> = {};

async function como<T>(user: string, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
  try { return await fn(); } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
const inmueble = async (slug: string, responsable: string, publicado: boolean, borrado = false) => {
  inm[slug] = (await db.query<{ id: string }>(
    `insert into public.fortius_inmuebles_inmuebles (nombre, slug, publicado, responsable_id, creado_por, es_ejemplo, deleted_at)
     values ('Inmueble de ejemplo', $1, $2, $3, $3, true, case when $4 then now() end) returning id`, [slug, publicado, responsable, borrado])).rows[0].id;
};
const lead = (id: string, slug: string) => db.query(
  "insert into public.fortius_inmuebles_records (collection, id, data) values ('leads', $1, $2::jsonb)",
  [id, JSON.stringify({ id, nombre: "Persona de ejemplo", telefono: "6640000000", origen: "contacto", estado: "nuevo", propiedadSlug: slug, creadoEl: "2026-11-19T00:00:00.000Z", notas: [] })]);
type Consulta = { id: string; version: number; inmueble_id: string | null };
const consultaDel = (user: string, leadId: string | null, extra: string | null = null) => como(user, () => db.query<Consulta>(
  `insert into public.fortius_inmuebles_consultas (quien_nombre, desde_lead, inmueble_id, es_ejemplo, responsable_id, creado_por)
   values ('Persona de ejemplo', $1, $2, true, $3, $3) returning id, version, inmueble_id`, [leadId, extra, user]).then((x) => x.rows[0]));
const abrir = (user: string, c: Consulta) => como(user, () => db.query<{ r: { id: string; inmueble_id: string | null } }>(
  "select public.fortius_inmuebles_abrir_asunto_desde_consulta($1, $2, 'Asunto de ejemplo', '{}', '{}', 'propietario', null, '[]') r",
  [c.id, c.version]).then((x) => x.rows[0].r));
const ligados = (asunto: string) => db.query<{ inmueble_id: string }>(
  "select inmueble_id from public.fortius_inmuebles_asunto_inmuebles where asunto_id = $1", [asunto]).then((x) => x.rows.map((r) => r.inmueble_id));
const apartados = (asunto: string) => db.query<{ clave: string }>(
  "select clave from public.fortius_inmuebles_apartados where asunto_id = $1", [asunto]).then((x) => x.rows.map((r) => r.clave));

beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${ana}'), ('${beto}'), ('${director}');
    insert into public.fortius_inmuebles_staff(user_id, role) values ('${ana}', 'editor'), ('${beto}', 'editor'), ('${director}', 'admin');`);
  await inmueble("casa-de-ana", ana, false);
  await inmueble("casa-de-beto", beto, true);
  await inmueble("privada-de-beto", beto, false);
  await inmueble("casa-borrada", ana, true, true);
  for (const [id, slug] of [["l-ana", "casa-de-ana"], ["l-beto", "casa-de-beto"], ["l-beto-2", "casa-de-beto"], ["l-privada", "privada-de-beto"], ["l-borrada", "casa-borrada"], ["l-nada", "no-existe"]]) await lead(id, slug);
});
afterAll(async () => { await db?.close(); });

describe("la consulta nueva desde una consulta del sitio", () => {
  it("trae el inmueble por el que se preguntó si existe y está publicado o quien atiende lo ve", async () => {
    expect((await consultaDel(ana, "l-ana")).inmueble_id).toBe(inm["casa-de-ana"]);
    expect((await consultaDel(ana, "l-beto")).inmueble_id).toBe(inm["casa-de-beto"]);
    expect((await consultaDel(ana, "l-privada")).inmueble_id).toBeNull();
    expect((await consultaDel(ana, "l-borrada")).inmueble_id).toBeNull();
    expect((await consultaDel(ana, "l-nada")).inmueble_id).toBeNull();
  });
  it("lo pone solo la base: lo que se mande al crear o al cambiar no cuenta", async () => {
    expect((await consultaDel(ana, null, inm["casa-de-ana"])).inmueble_id).toBeNull();
    const c = await consultaDel(beto, "l-beto-2");
    await como(beto, () => db.query("update public.fortius_inmuebles_consultas set inmueble_id = $1 where id = $2", [inm["privada-de-beto"], c.id]));
    const ahora = (await db.query<{ inmueble_id: string }>("select inmueble_id from public.fortius_inmuebles_consultas where id = $1", [c.id])).rows[0];
    expect(ahora.inmueble_id).toBe(inm["casa-de-beto"]);
  });
});

describe("abrir el asunto", () => {
  it("liga el inmueble que quien abre ya ve, con su apartado, sin copiarlo", async () => {
    const c = (await db.query<Consulta>("select id, version, inmueble_id from public.fortius_inmuebles_consultas where desde_lead = 'l-ana'")).rows[0];
    const r = await abrir(ana, c);
    expect(r.inmueble_id).toBe(inm["casa-de-ana"]);
    expect(await ligados(r.id)).toEqual([inm["casa-de-ana"]]);
    expect(await apartados(r.id)).toContain("inmueble");
    // Sin copiarlo: sigue habiendo un solo inmueble con esa dirección del sitio.
    const copias = (await db.query<{ n: number }>("select count(*)::int n from public.fortius_inmuebles_inmuebles where nombre = 'Inmueble de ejemplo'")).rows[0].n;
    expect(copias).toBe(4);
  });
  it("un inmueble publicado de otro asesor no se liga: el asunto se abre como antes", async () => {
    const c = (await db.query<Consulta>("select id, version, inmueble_id from public.fortius_inmuebles_consultas where desde_lead = 'l-beto'")).rows[0];
    expect(c.inmueble_id).toBe(inm["casa-de-beto"]);
    const r = await abrir(ana, c);
    expect(r.inmueble_id).toBeNull();
    expect(await ligados(r.id)).toEqual([]);
    expect(await como(ana, () => db.query<{ v: boolean }>("select public.fortius_inmuebles_puede_ver_inmueble($1) v", [inm["privada-de-beto"]]).then((x) => x.rows[0].v))).toBe(false);
  });
  it("el director sí lo liga; quien lo lleva también", async () => {
    const delDirector = await consultaDel(director, "l-beto");
    expect((await ligados((await abrir(director, delDirector)).id))).toEqual([inm["casa-de-beto"]]);
    const c = (await db.query<Consulta>("select id, version, inmueble_id from public.fortius_inmuebles_consultas where desde_lead = 'l-beto-2'")).rows[0];
    expect(await ligados((await abrir(beto, c)).id)).toEqual([inm["casa-de-beto"]]);
  });
  it("si el inmueble se fue a Eliminados después, el asunto se abre sin él", async () => {
    const c = await consultaDel(ana, "l-ana");
    await db.query("update public.fortius_inmuebles_inmuebles set deleted_at = now() where id = $1", [inm["casa-de-ana"]]);
    try {
      const r = await abrir(ana, c);
      expect(await ligados(r.id)).toEqual([]);
    } finally {
      await db.query("update public.fortius_inmuebles_inmuebles set deleted_at = null where id = $1", [inm["casa-de-ana"]]);
    }
  });
});

describe("la migración", () => {
  it("se puede volver a correr sin cambiar nada", async () => {
    const sql = await readFile(new URL("../../supabase/migrations/20261119100300_panel_20_consulta_con_inmueble_del_sitio.sql", import.meta.url), "utf8");
    const firma = () => db.query<{ d: string }>(`select string_agg(pg_get_functiondef(p.oid), '' order by p.proname) d
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in (
        'fortius_inmuebles_consulta_inmueble_del_sitio', 'fortius_inmuebles_abrir_asunto_desde_consulta')`).then((x) => x.rows[0].d);
    const antes = await firma();
    await db.exec(sql);
    expect(await firma()).toBe(antes);
  });
  it("la función de la base no la llama nadie desde fuera", async () => {
    const r = (await db.query<{ a: boolean }>("select has_function_privilege('authenticated', 'public.fortius_inmuebles_consulta_inmueble_del_sitio()', 'execute') a")).rows[0];
    expect(r.a).toBe(false);
  });
});
