import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";
import { nuevoTramite, type CualquierTramite } from "@/lib/tramites";
import { nuevoTramiteGuia } from "@/lib/panel/datos/tramites-guias";

// Panel 19 (19/11/2026): Agenda y Trámites con las personas del Directorio, las guías de Trámites y los trámites sin
// frenos, sobre la base de ensayo con todas las migraciones. El panel provisional, con su cliente, sigue igual. Solo
// datos de ejemplo.
let db: PGlite;
const ana = "59100000-0000-4000-8000-000000000001", beto = "59100000-0000-4000-8000-000000000002", director = "59100000-0000-4000-8000-000000000003";
let pAna = "", pAna2 = "", pBeto = "", pBorrada = "", aAna = "", aBeto = "";

async function como<T>(user: string, fn: () => Promise<T>): Promise<T> {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
  try { return await fn(); } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}
type Fila<T> = { id: string; data: T; version: number };
const put = <T,>(coleccion: string, id: string, data: unknown, version: number | null) =>
  db.query<{ r: Fila<T> }>("select public.fortius_inmuebles_put_record($1, $2, $3::jsonb, $4) r", [coleccion, id, JSON.stringify(data), version]).then((x) => x.rows[0].r);
const ve = (coleccion: string, id: string) =>
  db.query("select id from public.fortius_inmuebles_records where collection = $1 and id = $2", [coleccion, id]).then((x) => x.rows.length === 1);
const persona = async (nombre: string, responsable: string, borrada = false) => (await db.query<{ id: string }>(
  `insert into public.fortius_inmuebles_personas (nombre, responsable_id, creado_por, es_ejemplo, deleted_at)
   values ($1, $2, $2, true, case when $3 then now() end) returning id`, [nombre, responsable, borrada])).rows[0].id;
const asunto = async (nombre: string, responsable: string) => (await db.query<{ id: string }>(
  `insert into public.fortius_inmuebles_asuntos (nombre, responsable_id, creado_por, es_ejemplo) values ($1, $2, $2, true) returning id`,
  [nombre, responsable])).rows[0].id;
const cita = (id: string, extra: Record<string, string>) => ({ id, titulo: "Visita de ejemplo", fecha: "2026-11-25", tipo: "visita", asesorId: "ase-ana", ...extra });
const archivo = (id: string, tramiteId: string, ligas: Record<string, string>) => db.query(
  "insert into public.fortius_inmuebles_records(collection, id, data) values ('archivos', $1, $2::jsonb)",
  [id, JSON.stringify({ id, nombre: "doc.pdf", url: "/api/admin/files?path=x", tipo: "pdf", tramiteId, pasoClave: "liquidado", visibility: "private", ...ligas })]);

beforeAll(async () => {
  db = await createRehearsalDatabase();
  await db.exec(`insert into auth.users values ('${ana}'), ('${beto}'), ('${director}');
    insert into public.fortius_inmuebles_staff(user_id, role) values ('${ana}', 'editor'), ('${beto}', 'editor'), ('${director}', 'admin');
    insert into public.fortius_inmuebles_records(collection, id, data) values
      ('asesores', 'ase-ana', '{"id":"ase-ana","nombre":"Ana","cargo":"Asesora","iniciales":"AA","activo":true}'),
      ('asesores', 'ase-beto', '{"id":"ase-beto","nombre":"Beto","cargo":"Asesor","iniciales":"BB","activo":true}'),
      ('clientes', 'cli-ana', '{"id":"cli-ana","nombre":"Cliente de ejemplo","telefono":"6640000000","tipo":"propietario","asesorId":"ase-ana","notas":"","creadoEl":"2026-11-01","actualizadoEl":"2026-11-01"}'),
      ('clientes', 'cli-beto', '{"id":"cli-beto","nombre":"Otro cliente","telefono":"6640000001","tipo":"propietario","asesorId":"ase-beto","notas":"","creadoEl":"2026-11-01","actualizadoEl":"2026-11-01"}');
    insert into public.fortius_inmuebles_adviser_accounts(user_id, asesor_id) values ('${ana}', 'ase-ana'), ('${beto}', 'ase-beto');`);
  pAna = await persona("Persona de Ana", ana);
  pAna2 = await persona("Otra persona de Ana", ana);
  pBeto = await persona("Persona de Beto", beto);
  pBorrada = await persona("Persona en Eliminados", ana, true);
  aAna = await asunto("Asunto de Ana", ana);
  aBeto = await asunto("Asunto de Beto", beto);
});
afterAll(async () => { await db?.close(); });

describe("una cita con la persona del Directorio y el asunto del panel", () => {
  it("se guarda si quien la agenda ve a la persona y el asunto; la ve quien los ve", async () => {
    const c = await como(ana, () => put("eventos", "cita-1", cita("cita-1", { personaId: pAna, asuntoId: aAna }), null));
    expect(c.data).toMatchObject({ personaId: pAna, asuntoId: aAna });
    expect(await como(ana, () => ve("eventos", "cita-1"))).toBe(true);
    expect(await como(beto, () => ve("eventos", "cita-1"))).toBe(false);
    expect(await como(director, () => ve("eventos", "cita-1"))).toBe(true);
  });
  it("lo que no te toca ver responde «sin acceso», exista o no: ajena, en Eliminados o inexistente, lo mismo", async () => {
    await como(ana, async () => {
      const sinAcceso = { code: "PT403", message: "Vínculo de evento sin acceso" };
      await expect(put("eventos", "cita-x1", cita("cita-x1", { personaId: pBeto }), null)).rejects.toMatchObject(sinAcceso);
      await expect(put("eventos", "cita-x2", cita("cita-x2", { asuntoId: aBeto }), null)).rejects.toMatchObject(sinAcceso);
      // Un asesor no ve Eliminados: su propia ficha borrada responde igual que una ajena.
      await expect(put("eventos", "cita-x3", cita("cita-x3", { personaId: pBorrada }), null)).rejects.toMatchObject(sinAcceso);
      await expect(put("eventos", "cita-x4", cita("cita-x4", { personaId: "00000000-0000-4000-8000-000000000999" }), null)).rejects.toMatchObject(sinAcceso);
      // Lo que no es un id del panel es un dato inválido.
      await expect(put("eventos", "cita-x5", cita("cita-x5", { personaId: "cli-ana" }), null)).rejects.toMatchObject({ code: "PT400" });
    });
  });
  it("el director, que ve todo, sí sabe que está en Eliminados o que no existe: dato inválido", async () => {
    await como(director, async () => {
      const invalido = { code: "PT400", message: "Vínculo de evento inexistente" };
      await expect(put("eventos", "cita-d1", cita("cita-d1", { personaId: pBorrada }), null)).rejects.toMatchObject(invalido);
      await expect(put("eventos", "cita-d2", cita("cita-d2", { personaId: "00000000-0000-4000-8000-000000000999" }), null)).rejects.toMatchObject(invalido);
      await expect(put("eventos", "cita-d3", cita("cita-d3", { personaId: pBeto, asuntoId: aBeto }), null)).resolves.toBeDefined();
    });
  });
  it("en una cita, quien la ve cambia a la persona por otra que también ve", async () => {
    const c = await como(ana, () => put<Record<string, string>>("eventos", "cita-2", cita("cita-2", { personaId: pAna }), null));
    const cambiada = await como(ana, () => put<Record<string, string>>("eventos", "cita-2", { ...c.data, personaId: pAna2 }, c.version));
    expect(cambiada.data.personaId).toBe(pAna2);
    await expect(como(ana, () => put("eventos", "cita-2", { ...cambiada.data, personaId: pBeto }, cambiada.version))).rejects.toMatchObject({ code: "PT403" });
  });
});

describe("el panel provisional, con su cliente, sigue igual", () => {
  it("una cita y un trámite con el cliente se guardan y se ven como antes", async () => {
    await como(ana, () => put("eventos", "cita-cli", cita("cita-cli", { clienteId: "cli-ana" }), null));
    await expect(como(ana, () => put("eventos", "cita-cli-x", cita("cita-cli-x", { clienteId: "cli-beto" }), null))).rejects.toMatchObject({ code: "PT403" });
    await como(ana, () => put("tramites", "tr-cli", nuevoTramite({ id: "tr-cli", acreedor: "infonavit", titulo: "Casa de ejemplo", clienteId: "cli-ana", asesorId: "ase-ana" }), null));
    expect(await como(ana, () => ve("tramites", "tr-cli"))).toBe(true);
    expect(await como(beto, () => ve("tramites", "tr-cli"))).toBe(false);
  });
  it("quién ve qué da lo mismo que antes para los registros con cliente o sin ligas", async () => {
    const casos: [string, Record<string, string>, boolean][] = [
      ["archivos", { visibility: "private", clienteId: "cli-ana" }, true],
      ["archivos", { visibility: "private", clienteId: "cli-beto" }, false],
      ["archivos", { visibility: "private" }, false],
      ["archivos", { visibility: "public" }, true],
      ["tramites", { clienteId: "cli-ana", asesorId: "ase-ana" }, true],
      ["tramites", { clienteId: "cli-beto", asesorId: "ase-ana" }, false],
      ["eventos", {}, true],
      ["eventos", { clienteId: "cli-beto" }, false],
      ["tareas", { clienteId: "cli-ana" }, true],
      ["notas", { clienteId: "cli-beto" }, false],
      ["clientes", { asesorId: "ase-ana" }, true],
      ["clientes", { asesorId: "ase-beto" }, false],
      ["propiedades", {}, true],
    ];
    for (const [c, d, esperado] of casos) {
      const r = await como(ana, () => db.query<{ v: boolean }>("select public.fortius_inmuebles_record_visible($1, $2::jsonb) v", [c, JSON.stringify(d)]));
      expect([c, d, r.rows[0].v]).toEqual([c, d, esperado]);
    }
  });
  it("un asesor sigue sin cambiar el cliente de un trámite; un documento de otro cliente no se liga", async () => {
    const t = (await db.query<{ data: CualquierTramite; version: number }>("select data, version from public.fortius_inmuebles_records where collection = 'tramites' and id = 'tr-cli'")).rows[0];
    await expect(como(ana, () => put("tramites", "tr-cli", { ...t.data, clienteId: "cli-beto" }, t.version))).rejects.toMatchObject({ code: "PT403" });
    await expect(archivo("doc-cli-x", "tr-cli", { clienteId: "cli-beto" })).rejects.toMatchObject({ code: "PT400" });
    await archivo("doc-cli", "tr-cli", { clienteId: "cli-ana" });
  });
});

describe("un trámite con la persona del Directorio", () => {
  it("la hipoteca lleva como propietario a la persona; la ve quien la ve", async () => {
    const t = await como(ana, () => put<CualquierTramite>("tramites", "tr-p", nuevoTramite({ id: "tr-p", acreedor: "banco", titulo: "Casa de ejemplo", personaId: pAna, asesorId: "ase-ana" }), null));
    expect(t.data).toMatchObject({ personaId: pAna, clienteId: "" });
    expect(await como(ana, () => ve("tramites", "tr-p"))).toBe(true);
    expect(await como(beto, () => ve("tramites", "tr-p"))).toBe(false);
    // Sin propietario, la hipoteca no se guarda.
    await expect(como(ana, () => put("tramites", "tr-sin", nuevoTramite({ id: "tr-sin", acreedor: "banco", titulo: "Casa", asesorId: "ase-ana" }), null))).rejects.toMatchObject({ code: "PT400" });
    // Ni con una persona que no le toca ver: ajena, en Eliminados (un asesor no ve Eliminados) o inexistente, lo mismo.
    for (const [id, personaId] of [["tr-ajena", pBeto], ["tr-borrada", pBorrada], ["tr-nadie", "00000000-0000-4000-8000-000000000999"]]) {
      await expect(como(ana, () => put("tramites", id, nuevoTramite({ id, acreedor: "banco", titulo: "Casa", personaId, asesorId: "ase-ana" }), null))).rejects.toMatchObject({ code: "PT403" });
    }
    // El director, que ve Eliminados, recibe «dato inválido».
    await expect(como(director, () => put("tramites", "tr-borrada-d", nuevoTramite({ id: "tr-borrada-d", acreedor: "banco", titulo: "Casa", personaId: pBorrada, asesorId: "ase-ana" }), null))).rejects.toMatchObject({ code: "PT400", message: "Esa persona no está en el Directorio" });
  });
  it("la persona ya puesta solo la cambia el director; su documento lleva la misma persona", async () => {
    const t = (await db.query<{ data: CualquierTramite; version: number }>("select data, version from public.fortius_inmuebles_records where collection = 'tramites' and id = 'tr-p'")).rows[0];
    await expect(como(ana, () => put("tramites", "tr-p", { ...t.data, personaId: pAna2 }, t.version))).rejects.toMatchObject({ code: "PT403", message: expect.stringMatching(/reasigna/) });
    await expect(archivo("doc-p-x", "tr-p", { personaId: pAna2 })).rejects.toMatchObject({ code: "PT400" });
    await archivo("doc-p", "tr-p", { personaId: pAna });
    expect(await como(ana, () => ve("archivos", "doc-p"))).toBe(true);
    expect(await como(beto, () => ve("archivos", "doc-p"))).toBe(false);
    const r = await como(director, () => put<CualquierTramite>("tramites", "tr-p", { ...t.data, personaId: pAna2 }, t.version));
    expect(r.data.personaId).toBe(pAna2);
  });
});

describe("las guías de Trámites", () => {
  it("una guía por pasos sin persona la ve quien la lleva; cerrar con pendientes avisa en el historial", async () => {
    const g = await como(ana, () => put<CualquierTramite>("tramites", "tr-avaluo", nuevoTramiteGuia({ id: "tr-avaluo", tipo: "avaluo", titulo: "Avalúo de ejemplo", asesorId: "ase-ana" }), null));
    expect(await como(ana, () => ve("tramites", "tr-avaluo"))).toBe(true);
    expect(await como(beto, () => ve("tramites", "tr-avaluo"))).toBe(false);
    const cerrada = await como(ana, () => put<CualquierTramite>("tramites", "tr-avaluo", { ...g.data, pasoActual: 1 }, g.version));
    expect(cerrada.data.pasoActual).toBe(1);
    expect(cerrada.data.notas[cerrada.data.notas.length - 1]).toMatchObject({ tipo: "evento", texto: "Se cerró el paso «Elegir perito o institución» con pendientes sin hacer", autor: ana });
    // Su documento privado lo ve quien ve la guía.
    await db.query("insert into public.fortius_inmuebles_records(collection, id, data) values ('archivos', 'doc-avaluo', $1::jsonb)",
      [JSON.stringify({ id: "doc-avaluo", nombre: "avaluo.pdf", url: "/api/admin/files?path=y", tipo: "pdf", tramiteId: "tr-avaluo", pasoClave: g.data.pasos[0].clave, visibility: "private" })]);
    expect(await como(ana, () => ve("archivos", "doc-avaluo"))).toBe(true);
    expect(await como(beto, () => ve("archivos", "doc-avaluo"))).toBe(false);
  });
  it("una guía por partes con persona deja cada cambio en el historial; el tipo no cambia", async () => {
    const g = await como(ana, () => put<CualquierTramite>("tramites", "tr-serv", nuevoTramiteGuia({ id: "tr-serv", tipo: "servicios", titulo: "Servicios de ejemplo", personaId: pAna, asesorId: "ase-ana" }), null));
    if (g.data.tipo === "cancelacion_hipoteca") throw new Error("Se esperaba una guía");
    const partes = g.data.partes.map((p, i) => (i === 0 ? { ...p, estado: "solicitado" as const } : p));
    const r = await como(ana, () => put<CualquierTramite>("tramites", "tr-serv", { ...g.data, partes }, g.version));
    expect(r.data.notas[r.data.notas.length - 1]).toMatchObject({ tipo: "evento", texto: `${partes[0].nombre}: solicitado`, autor: ana });
    await expect(como(ana, () => put("tramites", "tr-serv", { ...r.data, tipo: "avaluo" }, r.version))).rejects.toMatchObject({ code: "PT400" });
  });
});

describe("la hipoteca sin frenos", () => {
  it("cerrar un paso con pendientes y sin su documento se puede, y queda dicho con quién", async () => {
    let t = await como(ana, () => put<CualquierTramite>("tramites", "tr-sf", nuevoTramite({ id: "tr-sf", acreedor: "infonavit", titulo: "Casa de ejemplo", personaId: pAna, asesorId: "ase-ana" }), null));
    t = await como(ana, () => put<CualquierTramite>("tramites", "tr-sf", { ...t.data, pasoActual: 1 }, t.version));
    t = await como(ana, () => put<CualquierTramite>("tramites", "tr-sf", { ...t.data, pasoActual: 2 }, t.version));
    expect(t.data.pasoActual).toBe(2);
    expect(t.data.notas[t.data.notas.length - 1]).toMatchObject({ tipo: "evento", texto: "Se cerró el paso «Crédito liquidado» con pendientes sin hacer y sin su documento", autor: ana });
    expect(t.data.pasos[1]).toMatchObject({ cerradoPor: ana });
    // Lo demás sigue: de uno en uno.
    await expect(como(ana, () => put("tramites", "tr-sf", { ...t.data, pasoActual: 4 }, t.version))).rejects.toMatchObject({ code: "PT400" });
  });
});

describe("la migración", () => {
  it("se puede volver a correr sin cambiar nada", async () => {
    const sql = await readFile(new URL("../../supabase/migrations/20261119100200_panel_19_agenda_y_tramites_con_persona.sql", import.meta.url), "utf8");
    const firma = () => db.query<{ d: string }>(`select string_agg(pg_get_functiondef(p.oid), '' order by p.proname) d
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in (
        'fortius_inmuebles_record_visible', 'fortius_inmuebles_guard_event_links', 'fortius_inmuebles_guard_private_record',
        'fortius_inmuebles_validate_tramite', 'fortius_inmuebles_guard_tramite', 'fortius_inmuebles_persona_ligable')`).then((x) => x.rows[0].d);
    const antes = await firma();
    await db.exec(sql);
    expect(await firma()).toBe(antes);
  });
  it("las ayudas nuevas no las llama quien no tiene sesión", async () => {
    const r = (await db.query<{ anon: boolean }>("select has_function_privilege('anon', 'public.fortius_inmuebles_persona_ligable(text)', 'execute') anon")).rows[0];
    expect(r.anon).toBe(false);
  });
});
