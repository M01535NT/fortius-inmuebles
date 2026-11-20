import { afterAll, beforeAll, describe, expect, it } from "vitest";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// Panel 17 y 18 (19/11/2026), sobre la base de ensayo con todas las migraciones. Solo datos de ejemplo.
let db: PGlite;
const director = "59000000-0000-4000-8000-000000000001";

beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${director}');
    insert into public.fortius_inmuebles_staff(user_id, role) values ('${director}', 'admin');`);
});
afterAll(async () => { await db?.close(); });

async function comoDirector<T>(fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [director]);
  try { return await fn(); } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
const persona = async (nombre: string, telefono?: string) => (await db.query<{ id: string }>(
  `insert into public.fortius_inmuebles_personas (nombre, telefonos, responsable_id, creado_por, es_ejemplo)
   values ($1, $2::jsonb, $3, $3, true) returning id`,
  [nombre, JSON.stringify(telefono ? [{ pais: "+52", numero: telefono }] : []), director])).rows[0].id;

describe("las listas con un valor apagado", () => {
  it("una copia conserva el valor apagado sin «permiso denegado»; lo nuevo no lo acepta", async () => {
    await db.exec("update public.fortius_inmuebles_catalogo_valores set activo = false where catalogo = 'tipo_inmueble' and clave = 'casa'");
    try {
      const alta = (ejemplo: boolean) => comoDirector(() => db.query(
        `insert into public.fortius_inmuebles_consultas (datos, es_ejemplo, responsable_id, creado_por)
         values ('{"tipo":"casa"}', $1, $2, $2)`, [ejemplo, director]));
      await expect(alta(true)).resolves.toBeDefined();
      await expect(alta(false)).rejects.toThrow(/ya no se ofrece/);
    } finally {
      await db.exec("update public.fortius_inmuebles_catalogo_valores set activo = true where catalogo = 'tipo_inmueble' and clave = 'casa'");
    }
  });
  it("la pregunta de si una copia conserva sigue cerrada a todos; la revisión corre como dueña", async () => {
    const r = (await db.query<{ conserva: boolean; sellos: boolean; definer: boolean }>(`select
      has_function_privilege('authenticated', 'public.fortius_inmuebles_catalogo_conserva(text, jsonb, text, text)', 'execute') conserva,
      has_function_privilege('authenticated', 'public.fortius_inmuebles_sellos_persona()', 'execute') sellos,
      bool_and(p.prosecdef) definer
      from pg_proc p where p.proname in ('fortius_inmuebles_valida_catalogos', 'fortius_inmuebles_valida_consulta_catalogos')`)).rows[0];
    expect(r).toEqual({ conserva: false, sellos: false, definer: true });
  });
});

describe("la consulta del sitio pasa al Directorio", () => {
  it("un celular con «+52 1» encuentra la ficha que ya estaba, sin repetirla", async () => {
    const ya = await persona("Persona de ejemplo", "6641234567");
    await db.query(`insert into public.fortius_inmuebles_records (collection, id, data) values ('leads', 'lead-cel', $1::jsonb)`, [JSON.stringify({
      id: "lead-cel", nombre: "Persona de ejemplo", telefono: "+52 1 664 123 4567", origen: "contacto", estado: "nuevo",
      creadoEl: "2026-11-19T00:00:00.000Z", notas: [],
    })]);
    const version = (await db.query<{ version: number }>("select version from public.fortius_inmuebles_records where collection = 'leads' and id = 'lead-cel'")).rows[0].version;
    const r = await comoDirector(() => db.query<{ r: { persona_id: string; creada: boolean } }>(
      "select public.fortius_inmuebles_lead_a_persona('lead-cel', $1) r", [version]));
    expect(r.rows[0].r).toMatchObject({ persona_id: ya, creada: false });
  });
});

describe("una consulta abierta por consulta del sitio", () => {
  it("la segunda abierta del mismo mensaje se detiene; cerrada la primera, cabe otra", async () => {
    const alta = () => db.query<{ id: string }>(
      `insert into public.fortius_inmuebles_consultas (desde_lead, es_ejemplo, responsable_id, creado_por)
       values ('lead-doble', true, $1, $1) returning id`, [director]);
    const primera = (await alta()).rows[0].id;
    await expect(alta()).rejects.toThrow(/duplicate|unique/i);
    await db.query("update public.fortius_inmuebles_consultas set estado = 'no_procede' where id = $1", [primera]);
    await expect(alta()).resolves.toBeDefined();
  });
});

describe("abrir el asunto desde la consulta", () => {
  it("no cuelga del asunto una ficha que está en Eliminados: crea una nueva", async () => {
    const borrada = await persona("Ficha en Eliminados");
    await db.query("update public.fortius_inmuebles_personas set deleted_at = now() where id = $1", [borrada]);
    const consulta = (await db.query<{ id: string; version: number }>(
      `insert into public.fortius_inmuebles_consultas (quien_nombre, persona_id, es_ejemplo, responsable_id, creado_por)
       values ('Quien llamó', $1, true, $2, $2) returning id, version`, [borrada, director])).rows[0];
    const r = await comoDirector(() => db.query<{ r: { persona_id: string } }>(
      "select public.fortius_inmuebles_abrir_asunto_desde_consulta($1, $2, 'Asunto de ejemplo', '{}', '{}', 'propietario', null, '[]') r",
      [consulta.id, consulta.version]));
    expect(r.rows[0].r.persona_id).not.toBe(borrada);
  });
});
