import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// Panel 22 (19/11/2026): al unir dos fichas, la que se queda conserva lo suyo y toma de la otra lo del Directorio que
// tenga vacío; su historial de contacto se sigue viendo y queda anotado. Sobre la base de ensayo. Solo datos de ejemplo.
let db: PGlite;
const director = "59220000-0000-4000-8000-000000000001", ana = "59220000-0000-4000-8000-000000000002", beto = "59220000-0000-4000-8000-000000000003";

async function como<T>(user: string, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
  try { return await fn(); } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
type Ficha = {
  lo_que_sigue: string; que_busca: string; que_ofrece: string; zona: string; canal: string | null; presupuesto: string | null;
  presupuesto_moneda: string; aviso_privacidad: string; aviso_privacidad_el: string | null; archivada_el: string | null; deleted_at: string | null;
};
const COLUMNAS = "lo_que_sigue, que_busca, que_ofrece, zona, canal, presupuesto::text presupuesto, presupuesto_moneda, aviso_privacidad, aviso_privacidad_el::text aviso_privacidad_el, archivada_el::text archivada_el, deleted_at::text deleted_at";
// Una ficha de ejemplo con lo del Directorio puesto a mano (la fecha del aviso y el archivo, como si vinieran de antes).
async function ficha(responsable: string, datos: Partial<Record<keyof Ficha, string | null>>): Promise<string> {
  const id = (await db.query<{ id: string }>(
    "insert into public.fortius_inmuebles_personas (nombre, responsable_id, creado_por, es_ejemplo) values ('Persona de ejemplo', $1, $1, true) returning id",
    [responsable])).rows[0].id;
  const claves = Object.keys(datos);
  if (claves.length) {
    await db.query("select set_config('fortius_inmuebles.uniendo_fichas', 'on', false)");
    try {
      await db.query(`update public.fortius_inmuebles_personas set ${claves.map((k, i) => `${k} = $${i + 2}`).join(", ")} where id = $1`,
        [id, ...claves.map((k) => datos[k as keyof Ficha])]);
    } finally { await db.query("select set_config('fortius_inmuebles.uniendo_fichas', 'off', false)"); }
  }
  return id;
}
const leer = (id: string) => db.query<Ficha>(`select ${COLUMNAS} from public.fortius_inmuebles_personas where id = $1`, [id]).then((x) => x.rows[0]);
const unir = (origen: string, destino: string, quien = director) => como(quien, () => db.query("select public.fortius_inmuebles_unir_personas($1, $2)", [origen, destino]));

beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${director}'), ('${ana}'), ('${beto}');
    insert into public.fortius_inmuebles_staff(user_id, role) values ('${director}', 'admin'), ('${ana}', 'editor'), ('${beto}', 'editor');`);
});
afterAll(async () => { await db?.close(); });

describe("unir dos fichas con lo del Directorio", () => {
  it("la que se queda conserva lo suyo y toma de la otra lo que tiene vacío", async () => {
    const queda = await ficha(ana, { lo_que_sigue: "Llamarle el lunes", zona: "Playas" });
    const seVa = await ficha(beto, {
      lo_que_sigue: "Mandarle opciones", que_busca: "Casa de tres recámaras", que_ofrece: "Un terreno", zona: "Otay", canal: "whatsapp",
      presupuesto: "2500000", presupuesto_moneda: "USD", aviso_privacidad: "aceptado", aviso_privacidad_el: "2026-10-01", archivada_el: "2026-11-01T00:00:00Z",
    });
    await unir(seVa, queda);
    expect(await leer(queda)).toMatchObject({
      lo_que_sigue: "Llamarle el lunes", zona: "Playas",
      que_busca: "Casa de tres recámaras", que_ofrece: "Un terreno", canal: "whatsapp", presupuesto: "2500000.00", presupuesto_moneda: "USD",
      aviso_privacidad: "aceptado", aviso_privacidad_el: "2026-10-01",
      // La que se queda estaba en la lista diaria: ahí sigue.
      archivada_el: null, deleted_at: null,
    });
    expect((await leer(seVa)).deleted_at).not.toBeNull();
  });
  it("su presupuesto y su aviso mandan sobre los de la otra", async () => {
    const queda = await ficha(ana, { presupuesto: "900000", presupuesto_moneda: "MXN", aviso_privacidad: "enviado", aviso_privacidad_el: "2026-11-10" });
    const seVa = await ficha(ana, { presupuesto: "100000", presupuesto_moneda: "USD", aviso_privacidad: "aceptado", aviso_privacidad_el: "2026-10-01" });
    await unir(seVa, queda);
    expect(await leer(queda)).toMatchObject({ presupuesto: "900000.00", presupuesto_moneda: "MXN", aviso_privacidad: "enviado", aviso_privacidad_el: "2026-11-10" });
  });
  it("queda archivada solo si las dos lo estaban; si la otra seguía en la lista, vuelve a ella", async () => {
    const ambas = await ficha(ana, { archivada_el: "2026-11-02T00:00:00Z" });
    await unir(await ficha(ana, { archivada_el: "2026-11-05T00:00:00Z" }), ambas);
    expect((await leer(ambas)).archivada_el).not.toBeNull();
    const archivada = await ficha(ana, { archivada_el: "2026-11-02T00:00:00Z" });
    await unir(await ficha(ana, {}), archivada);
    expect((await leer(archivada)).archivada_el).toBeNull();
  });
  it("el historial de contacto de la otra se sigue viendo en la que se queda, y la unión queda anotada", async () => {
    const queda = await ficha(ana, {});
    const seVa = await ficha(beto, { canal: "llamada", que_busca: "Local" });
    await db.query("insert into public.fortius_inmuebles_persona_contactos (persona_id, medio, resultado, quien_id, es_ejemplo) values ($1, 'llamada', 'contesto', $2, true)", [seVa, beto]);
    await unir(seVa, queda);
    // Ana ve la que se queda (es suya) y no veía la de Beto: aun así lee su contacto.
    const vistos = await como(ana, () => db.query<{ n: number }>("select count(*)::int n from public.fortius_inmuebles_persona_contactos where persona_id in ($1, $2)", [queda, seVa]));
    expect(vistos.rows[0].n).toBe(1);
    const nota = (await db.query<{ clase: string; resumen: string; detalle: { origen_id: string; campos: string[]; contactos: number }; actor_id: string }>(
      "select clase, resumen, detalle, actor_id from public.fortius_inmuebles_historial where entidad = 'persona' and entidad_id = $1 and clase = 'sistema'", [queda])).rows;
    expect(nota).toEqual([{ clase: "sistema", resumen: "Se unió otra ficha de esta persona", detalle: { origen_id: seVa, campos: ["canal", "que_busca"], contactos: 1 }, actor_id: director }]);
  });
  it("sigue siendo solo del director", async () => {
    const queda = await ficha(ana, {}), seVa = await ficha(ana, {});
    await expect(unir(seVa, queda, ana)).rejects.toMatchObject({ code: "PT403" });
  });
  it("fuera de una unión, los sellos de la ficha siguen igual: el aviso toma la fecha de hoy", async () => {
    const p = await ficha(ana, {});
    await db.query("update public.fortius_inmuebles_personas set aviso_privacidad = 'enviado', aviso_privacidad_el = '2020-01-01' where id = $1", [p]);
    const hoy = (await db.query<{ h: string }>("select public.fortius_inmuebles_hoy()::text h")).rows[0].h;
    expect((await leer(p)).aviso_privacidad_el).toBe(hoy);
  });
});

describe("la migración", () => {
  it("se puede volver a correr sin cambiar nada", async () => {
    const sql = await readFile(new URL("../../supabase/migrations/20261119100500_panel_22_unir_fichas_con_lo_del_directorio.sql", import.meta.url), "utf8");
    const firma = () => db.query<{ d: string }>(`select string_agg(pg_get_functiondef(p.oid), '' order by p.proname) d
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in (
        'fortius_inmuebles_unir_personas', 'fortius_inmuebles_sellos_persona')`).then((x) => x.rows[0].d);
    const antes = await firma();
    await db.exec(sql);
    expect(await firma()).toBe(antes);
  });
});
