import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// Panel 21 (19/11/2026): «Recibir los documentos» se marca sola cuando ya no falta ningún documento del asunto. Sobre
// la base de ensayo con todas las migraciones. Solo datos de ejemplo.
let db: PGlite;
const director = "59210000-0000-4000-8000-000000000001";

async function comoDirector<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [director]);
  try { return await fn(); } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
const asunto = async () => (await db.query<{ id: string }>(
  "insert into public.fortius_inmuebles_asuntos (nombre, responsable_id, creado_por, es_ejemplo) values ('Asunto de ejemplo', $1, $1, true) returning id",
  [director])).rows[0].id;
const tarea = (asuntoId: string, titulo: string) => comoDirector(() => db.query<{ id: string; clave: string | null }>(
  "insert into public.fortius_inmuebles_tareas (asunto_id, titulo, quien, creado_por) values ($1, $2, 'cliente', $3) returning id, clave",
  [asuntoId, titulo, director]).then((x) => x.rows[0]));
const documento = async (asuntoId: string, nombre: string) => (await db.query<{ id: string }>(
  "insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, creado_por) values ($1, $2, $3) returning id",
  [asuntoId, nombre, director])).rows[0].id;
const cambiarDoc = (id: string, cambio: string) => comoDirector(() => db.query(`update public.fortius_inmuebles_asunto_documentos set ${cambio} where id = $1`, [id]));
const estado = (id: string) => db.query<{ estado: string; hecha_por: string | null }>(
  "select estado, hecha_por from public.fortius_inmuebles_tareas where id = $1", [id]).then((x) => x.rows[0]);

beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${director}');
    insert into public.fortius_inmuebles_staff(user_id, role) values ('${director}', 'admin');`);
});
afterAll(async () => { await db?.close(); });

describe("la clave de la tarea", () => {
  it("la pone la base a «Recibir los documentos», con o sin espacios de más; a las demás no", async () => {
    const a = await asunto();
    expect((await tarea(a, "Recibir los documentos")).clave).toBe("recibir_documentos");
    expect((await tarea(a, "  recibir   los documentos ")).clave).toBe("recibir_documentos");
    expect((await tarea(a, "Estudiar el asunto")).clave).toBeNull();
  });
  it("no cambia después, aunque cambie el título o se mande otra", async () => {
    const a = await asunto();
    const t = await tarea(a, "Recibir los documentos");
    await comoDirector(() => db.query("update public.fortius_inmuebles_tareas set titulo = 'Pedir papeles', clave = 'otra' where id = $1", [t.id]));
    expect((await db.query<{ clave: string }>("select clave from public.fortius_inmuebles_tareas where id = $1", [t.id])).rows[0].clave).toBe("recibir_documentos");
  });
});

describe("«Recibir los documentos» se marca sola", () => {
  it("queda hecha cuando ya no falta ninguno, a nombre de quien hizo el último cambio", async () => {
    const a = await asunto(), otro = await asunto();
    const t = await tarea(a, "Recibir los documentos");
    const ajena = await tarea(otro, "Recibir los documentos");
    const estudiar = await tarea(a, "Estudiar el asunto");
    const [ine, escritura, predial] = [await documento(a, "INE"), await documento(a, "Escritura"), await documento(a, "Predial")];
    await documento(otro, "INE");
    await cambiarDoc(ine, "estado = 'recibido'");
    await cambiarDoc(escritura, "estado = 'no_aplica'");
    expect((await estado(t.id)).estado).toBe("pendiente");
    await cambiarDoc(predial, "deleted_at = now()");
    expect(await estado(t.id)).toEqual({ estado: "hecha", hecha_por: director });
    expect((await estado(ajena.id)).estado).toBe("pendiente");
    expect((await estado(estudiar.id)).estado).toBe("pendiente");
  });
  it("si después se pide otro documento, no se reabre sola; una ya cerrada de otro modo se respeta", async () => {
    const a = await asunto();
    const t = await tarea(a, "Recibir los documentos");
    const d = await documento(a, "INE");
    await comoDirector(() => db.query("update public.fortius_inmuebles_tareas set estado = 'no_aplica' where id = $1", [t.id]));
    await cambiarDoc(d, "estado = 'recibido'");
    expect((await estado(t.id)).estado).toBe("no_aplica");
    const t2 = await tarea(a, "Recibir los documentos");
    const d2 = await documento(a, "Acta");
    await cambiarDoc(d2, "estado = 'recibido'");
    expect((await estado(t2.id)).estado).toBe("hecha");
    await documento(a, "Otro más");
    expect((await estado(t2.id)).estado).toBe("hecha");
  });
  it("cambiar otra cosa de un documento no la marca", async () => {
    const a = await asunto();
    const t = await tarea(a, "Recibir los documentos");
    const d = await documento(a, "INE");
    await cambiarDoc(d, "estado = 'recibido'");
    await comoDirector(() => db.query("update public.fortius_inmuebles_tareas set estado = 'pendiente' where id = $1", [t.id]));
    await cambiarDoc(d, "nota = 'Copia legible'");
    expect((await estado(t.id)).estado).toBe("pendiente");
  });
});

describe("la migración", () => {
  it("se puede volver a correr sin cambiar nada", async () => {
    const sql = await readFile(new URL("../../supabase/migrations/20261119100400_panel_21_recibir_documentos_se_marca_sola.sql", import.meta.url), "utf8");
    const firma = () => db.query<{ d: string }>(`select string_agg(pg_get_functiondef(p.oid), '' order by p.proname) d
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in (
        'fortius_inmuebles_tarea_clave', 'fortius_inmuebles_documentos_ya_recibidos')`).then((x) => x.rows[0].d);
    const antes = await firma();
    await db.exec(sql);
    expect(await firma()).toBe(antes);
  });
  it("sus funciones no las llama nadie desde fuera", async () => {
    const r = (await db.query<{ a: boolean; b: boolean }>(`select
      has_function_privilege('authenticated', 'public.fortius_inmuebles_tarea_clave()', 'execute') a,
      has_function_privilege('authenticated', 'public.fortius_inmuebles_documentos_ya_recibidos()', 'execute') b`)).rows[0];
    expect(r).toEqual({ a: false, b: false });
  });
});
