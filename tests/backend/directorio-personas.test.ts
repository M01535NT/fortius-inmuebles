import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireStaff, rpc } = vi.hoisted(() => ({ requireStaff: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient: vi.fn() }));

import { POST as leadADirectorioPOST } from "@/app/api/admin/leads/[id]/a-directorio/route";
import type { PersonaDirectorio } from "@/lib/backend/directorio-contrato";
import {
  cambiarPersona, cambioPersonaSchema, COLUMNAS_PERSONA, COLUMNAS_PERSONA_ANTES, listarDirectorio, columnaArchivada, columnasDeInteres, filtrarDirectorio, filtroSchema, hoyTijuana, interesDe,
  leadADirectorio, nuevoContactoSchema, sinSeguimiento,
} from "@/lib/backend/directorio";
import { ApiError } from "@/lib/backend/http";
import { anotarContacto, cambioFichaSchema } from "@/lib/backend/personas-ficha";

const persona = (p: Partial<PersonaDirectorio> = {}): PersonaDirectorio => ({
  id: "11111111-1111-4111-8111-111111111111", clase: "persona", nombre: "Persona de ejemplo", fallecida: false, telefonos: [], correo: null,
  no_contactar: false, volver_a_llamar: null, nota: "", es_ejemplo: true, version: 1, lo_que_sigue: "", archivada_el: null,
  responsable_id: "a1", canal: null, aviso_privacidad: "pendiente",
  interes: { que_busca: "", que_ofrece: "", presupuesto: null, moneda: "MXN", zona: "" },
  ultimo_contacto: null, sin_seguimiento: false, asuntos: [], ...p,
});
const asunto = (cerrado: boolean) => ({ id: "s1", folio: "F-1", nombre: "Asunto", encargos: [], en_que_va: null, cerrado, papeles: ["propietario"] });

describe("sin seguimiento", () => {
  const hoy = "2026-11-19";
  it("una persona activa sin asunto abierto, sin lo que sigue y sin fecha no tiene seguimiento", () => {
    expect(sinSeguimiento(persona(), hoy)).toBe(true);
    expect(sinSeguimiento(persona({ volver_a_llamar: "2026-11-18" }), hoy)).toBe(true);
    expect(sinSeguimiento(persona({ asuntos: [asunto(true)] }), hoy)).toBe(true);
  });
  it("una fecha de hoy o futura, lo que sigue, un asunto abierto o estar archivada sí cuentan", () => {
    expect(sinSeguimiento(persona({ volver_a_llamar: hoy }), hoy)).toBe(false);
    expect(sinSeguimiento(persona({ volver_a_llamar: "2026-12-01" }), hoy)).toBe(false);
    expect(sinSeguimiento(persona({ lo_que_sigue: "Mandarle la opinión de valor" }), hoy)).toBe(false);
    expect(sinSeguimiento(persona({ asuntos: [asunto(false)] }), hoy)).toBe(false);
    expect(sinSeguimiento(persona({ archivada_el: "2026-11-01T00:00:00Z" }), hoy)).toBe(false);
  });
  it("hoy es la fecha de Tijuana, no la de Greenwich", () => {
    // 19/11 a las 07:30 en UTC todavía es 18/11 en Tijuana.
    expect(hoyTijuana(new Date("2026-11-19T07:30:00Z"))).toBe("2026-11-18");
  });
});

describe("qué ver", () => {
  const lista = [
    persona({ id: "1", responsable_id: "a1" }),
    persona({ id: "2", responsable_id: "a2", archivada_el: "2026-11-01T00:00:00Z" }),
    persona({ id: "3", responsable_id: "a1", sin_seguimiento: true }),
  ];
  const ids = (xs: PersonaDirectorio[]) => xs.map((x) => x.id);
  it("por omisión salen las activas; las archivadas aparte; todas juntas", () => {
    expect(filtroSchema.parse({})).toEqual({ ver: "activas" });
    expect(ids(filtrarDirectorio(lista, { ver: "activas" }))).toEqual(["1", "3"]);
    expect(ids(filtrarDirectorio(lista, { ver: "archivadas" }))).toEqual(["2"]);
    expect(ids(filtrarDirectorio(lista, { ver: "todas" }))).toEqual(["1", "2", "3"]);
    expect(ids(filtrarDirectorio(lista, { ver: "sin_seguimiento" }))).toEqual(["3"]);
  });
  it("por asesor, solo las que lleva", () => {
    expect(ids(filtrarDirectorio(lista, { ver: "todas", asesor: "a1" }))).toEqual(["1", "3"]);
  });
  it("rechaza una vista o un asesor que no existen", () => {
    expect(() => filtroSchema.parse({ ver: "borradas" })).toThrow();
    expect(() => filtroSchema.parse({ ver: "activas", asesor: "no-es-uuid" })).toThrow();
  });
});

describe("qué busca y qué ofrece", () => {
  it("lee el presupuesto aunque la base lo mande como texto y pone MXN si falta la moneda", () => {
    expect(interesDe({ que_busca: "Casa", que_ofrece: null, presupuesto: "2500000.00", presupuesto_moneda: null, zona: "Playas" }))
      .toEqual({ que_busca: "Casa", que_ofrece: "", presupuesto: 2500000, moneda: "MXN", zona: "Playas" });
  });
  it("solo cambia las columnas que vienen", () => {
    expect(columnasDeInteres({ moneda: "USD", presupuesto: null })).toEqual({ presupuesto_moneda: "USD", presupuesto: null });
    expect(columnasDeInteres({})).toEqual({});
  });
  it("archivar pone la fecha; recuperar la quita", () => {
    const ahora = new Date("2026-11-19T18:00:00Z");
    expect(columnaArchivada(true, ahora)).toEqual({ archivada_el: "2026-11-19T18:00:00.000Z" });
    expect(columnaArchivada(false, ahora)).toEqual({ archivada_el: null });
  });
});

describe("validación de entrada", () => {
  it("el cambio desde el Directorio acepta lo que sigue y archivar, y nada más", () => {
    expect(cambioPersonaSchema.parse({ version: 3, lo_que_sigue: "  Llamarle el lunes ", archivada: true }))
      .toEqual({ version: 3, lo_que_sigue: "Llamarle el lunes", archivada: true });
    expect(() => cambioPersonaSchema.parse({ version: 3, responsable_id: "otro" })).toThrow();
    expect(() => cambioPersonaSchema.parse({ version: 3, lo_que_sigue: "x".repeat(301) })).toThrow();
  });
  it("la ficha acepta canal, aviso e interés con sus límites", () => {
    expect(cambioFichaSchema.parse({ persona: { version: 1, canal: " ", aviso_privacidad: "aceptado", interes: { zona: "Otay" } } }))
      .toEqual({ persona: { version: 1, canal: null, aviso_privacidad: "aceptado", interes: { zona: "Otay" } } });
    expect(() => cambioFichaSchema.parse({ persona: { version: 1, aviso_privacidad: "firmado" } })).toThrow();
    expect(() => cambioFichaSchema.parse({ persona: { version: 1, interes: { presupuesto: -1 } } })).toThrow();
    expect(() => cambioFichaSchema.parse({ persona: { version: 1, interes: { moneda: "EUR" } } })).toThrow();
  });
  it("un contacto lleva medio y resultado de sus listas", () => {
    expect(nuevoContactoSchema.parse({ version: 2, medio: "llamada", resultado: "no_contesto" })).toEqual({ version: 2, medio: "llamada", resultado: "no_contesto" });
    expect(() => nuevoContactoSchema.parse({ version: 2, medio: "paloma", resultado: "no_contesto" })).toThrow();
    expect(() => nuevoContactoSchema.parse({ version: 2, medio: "llamada", resultado: "bien" })).toThrow();
    expect(() => nuevoContactoSchema.parse({ version: 2, medio: "llamada", resultado: "cita", quien_id: "otro" })).toThrow();
  });
});

/** Cliente de la base de mentira: cada llamada encadenada regresa el mismo objeto y al final la respuesta dada. */
function clienteQueResponde(respuesta: { data: unknown; error: unknown }) {
  const llamadas: { metodo: string; args: unknown[] }[] = [];
  const cadena: Record<string, unknown> = {};
  for (const m of ["from", "update", "eq", "is", "select"]) cadena[m] = (...args: unknown[]) => { llamadas.push({ metodo: m, args }); return cadena; };
  cadena.maybeSingle = async () => respuesta;
  return { cliente: cadena as never, llamadas };
}

describe("cambiar una persona", () => {
  it("archivar manda la fecha y respeta la versión", async () => {
    const { cliente, llamadas } = clienteQueResponde({ data: { version: 4 }, error: null });
    await expect(cambiarPersona(cliente, "p1", { version: 3, archivada: true }, new Date("2026-11-19T18:00:00Z"))).resolves.toEqual({ version: 4 });
    expect(llamadas.find((l) => l.metodo === "update")?.args[0]).toEqual({ archivada_el: "2026-11-19T18:00:00.000Z" });
    expect(llamadas).toContainEqual({ metodo: "eq", args: ["version", 3] });
    expect(llamadas).toContainEqual({ metodo: "is", args: ["deleted_at", null] });
  });
  it("si alguien la cambió antes responde 409", async () => {
    const { cliente } = clienteQueResponde({ data: null, error: null });
    await expect(cambiarPersona(cliente, "p1", { version: 3, lo_que_sigue: "Algo" })).rejects.toMatchObject({ status: 409 });
  });
  it("sin cambios responde 400", async () => {
    const { cliente } = clienteQueResponde({ data: null, error: null });
    await expect(cambiarPersona(cliente, "p1", { version: 3 })).rejects.toMatchObject({ status: 400 });
  });
});

describe("anotar un contacto", () => {
  beforeEach(() => { rpc.mockReset(); });
  const fila = { id: "c1", persona_id: "p1", cuando: "2026-11-19T18:00:00Z", medio: "llamada", resultado: "contesto", nota: "", quien_id: "a1" };
  it("manda todo a una sola función de la base y le pone nombre a quien lo hizo", async () => {
    rpc.mockResolvedValue({ data: { contacto: fila, version: "5" }, error: null });
    const r = await anotarContacto({ rpc } as never, "p1", { version: 4, medio: "llamada", resultado: "contesto", lo_que_sigue: "Mandarle fotos" }, new Map([["a1", "Ana"]]));
    expect(r).toEqual({ contacto: { id: "c1", cuando: fila.cuando, medio: "llamada", resultado: "contesto", nota: "", quien_id: "a1", quien_nombre: "Ana" }, version: 5 });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("fortius_inmuebles_anotar_contacto", {
      p_persona: "p1", p_version: 4, p_medio: "llamada", p_resultado: "contesto", p_nota: "", p_cuando: null,
      p_cambia_volver: false, p_volver: null, p_sigue: "Mandarle fotos",
    });
  });
  it("quitar la fecha de volver a llamar es distinto de no tocarla", async () => {
    rpc.mockResolvedValue({ data: { contacto: fila, version: 5 }, error: null });
    await anotarContacto({ rpc } as never, "p1", { version: 4, medio: "whatsapp", resultado: "no_contesto", volver_a_llamar: null });
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_cambia_volver: true, p_volver: null, p_sigue: null });
  });
  it.each([["PT409", 409], ["PT404", 404]])("traduce %s a %s", async (code, status) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: "DETALLE INTERNO" } });
    const e = await anotarContacto({ rpc } as never, "p1", { version: 4, medio: "llamada", resultado: "cita" }).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status });
    expect(String((e as Error).message)).not.toContain("DETALLE");
  });
});

describe("crear persona desde una consulta del sitio", () => {
  beforeEach(() => { rpc.mockReset(); requireStaff.mockResolvedValue({ client: { rpc }, user: { id: "a1", role: "editor" } }); });
  const pedir = (body: unknown = { version: 7 }, origin = "https://panel.test") =>
    new Request("https://panel.test/api/admin/leads/l1/a-directorio", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
  const contexto = { params: Promise.resolve({ id: "l1" }) };

  it("usa la función nueva de la base, nunca la conversión a clientes", async () => {
    rpc.mockResolvedValue({ data: { persona_id: "p9", creada: true, lead_version: "8" }, error: null });
    const r = await leadADirectorioPOST(pedir(), contexto);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ persona_id: "p9", creada: true, lead_version: 8 });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("fortius_inmuebles_lead_a_persona", { p_lead_id: "l1", p_version: 7 });
  });
  it.each([{}, { version: 0 }, { version: 1.5 }, { version: 1, clienteId: "x" }])("rechaza %j antes de escribir", async (body) => {
    expect((await leadADirectorioPOST(pedir(body), contexto)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("protege el origen", async () => {
    expect((await leadADirectorioPOST(pedir({ version: 7 }, "https://otro.test"), contexto)).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([["PT403", 403], ["PT404", 404], ["PT409", 409]])("traduce %s a %s", async (code, status) => {
    rpc.mockResolvedValue({ data: null, error: { code, message: "DETALLE INTERNO" } });
    await expect(leadADirectorio({ rpc } as never, "l1", { version: 7 })).rejects.toMatchObject({ status });
  });
  it("si ya está ligada a una ficha de otro asesor, responde 409 sin decir cuál", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PT409", hint: "ligada", message: "DETALLE INTERNO" } });
    const e = await leadADirectorio({ rpc } as never, "l1", { version: 7 }).catch((x: unknown) => x);
    expect(e).toMatchObject({ status: 409 });
    expect((e as Error).message).toMatch(/otro asesor/);
    expect((e as Error).message).not.toMatch(/DETALLE/);
  });
  it("rechaza un identificador raro de consulta", async () => {
    await expect(leadADirectorio({ rpc } as never, "../clientes", { version: 7 })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("el Directorio mientras la base no tiene sus columnas nuevas", () => {
  /** Base de antes del Directorio: sin las columnas nuevas de la persona y sin la tabla de contactos. */
  function baseDeAntes() {
    const pedidas: string[] = [];
    const from = (tabla: string) => {
      let columnas = "";
      const cadena: Record<string, unknown> = {};
      cadena.select = (c: string) => { columnas = c; if (tabla === "fortius_inmuebles_personas") pedidas.push(c); return cadena; };
      for (const m of ["is", "eq", "order", "in"]) cadena[m] = () => cadena;
      cadena.limit = async () => {
        if (tabla === "fortius_inmuebles_persona_contactos") return { data: null, error: { code: "PGRST205", message: "falta la tabla" } };
        if (tabla === "fortius_inmuebles_personas") {
          if (columnas.includes("archivada_el")) return { data: null, error: { code: "42703", message: "falta la columna" } };
          return { data: [{ id: "p1", clase: "persona", nombre: "Persona de ejemplo", fallecida: false, telefonos: [], correo: null,
            no_contactar: false, volver_a_llamar: null, nota: "", es_ejemplo: true, version: 2, responsable_id: "a1", canal: null }], error: null };
        }
        return { data: [], error: null };
      };
      return cadena;
    };
    return { cliente: { from } as never, pedidas };
  }
  it("lee con las columnas de antes y lo nuevo sale vacío", async () => {
    const { cliente, pedidas } = baseDeAntes();
    const lista = await listarDirectorio(cliente, { ver: "activas" }, new Date("2026-11-19T18:00:00Z"));
    expect(pedidas).toEqual([COLUMNAS_PERSONA, COLUMNAS_PERSONA_ANTES]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({
      id: "p1", archivada_el: null, lo_que_sigue: "", aviso_privacidad: "pendiente", ultimo_contacto: null,
      interes: { que_busca: "", que_ofrece: "", presupuesto: null, moneda: "MXN", zona: "" },
    });
  });
  it("otro error de la base no se tapa", async () => {
    const cadena: Record<string, unknown> = {};
    for (const m of ["select", "is", "order"]) cadena[m] = () => cadena;
    cadena.limit = async () => ({ data: null, error: { code: "XX000", message: "otra cosa" } });
    await expect(listarDirectorio({ from: () => cadena } as never)).rejects.toBeInstanceOf(ApiError);
  });
});
