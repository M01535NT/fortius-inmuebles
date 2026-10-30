import { beforeEach, describe, expect, it, vi } from "vitest";
const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { GET as contractDates } from "@/app/api/admin/vencimientos/route";
import { parseRecord, projectPublic } from "@/lib/backend/validation";
import { propiedades } from "../fixtures/propiedades";

const followup = {
  llaves: { copias: 2, lugar: "oficina", prestamos: [{ id: "k1", persona: "Ana Ruiz", motivo: "Visita", salida: "2026-10-28T17:00:00.000Z", regresoPrevisto: "2026-10-29" }] },
  preparacion: { fotos: { estado: "listo", fecha: "2026-10-20", responsable: "Ana Ruiz" }, letrero: { estado: "no_aplica" } },
  avisosCompradores: [{ id: "n1", personaId: "lead1", tipo: "lead", medio: "whatsapp", fecha: "2026-10-28T18:00:00.000Z" }],
};

describe("seguimiento privado del inmueble", () => {
  it("guarda llaves, preparación y avisos con la ficha", () => {
    const saved = parseRecord("propiedades", propiedades[0].slug, { ...propiedades[0], ...followup });
    expect(saved).toMatchObject(followup);
  });

  it("rechaza préstamos y estados mal formados", () => {
    const base = { ...propiedades[0], ...followup };
    for (const invalid of [
      { llaves: { prestamos: [{ id: "k1", persona: "", salida: "2026-10-28T17:00:00.000Z" }] } },
      { llaves: { prestamos: [{ id: "k1", persona: "Ana", salida: "2026-10-28T17:00:00.000Z", regreso: "2026-10-27T17:00:00.000Z" }] } },
      { llaves: { lugar: "cajuela", prestamos: [] } },
      { preparacion: { fotos: { estado: "casi" } } },
      { avisosCompradores: [{ id: "n1", personaId: "lead1", tipo: "vecino", medio: "whatsapp", fecha: "2026-10-28" }] },
    ]) expect(() => parseRecord("propiedades", propiedades[0].slug, { ...base, ...invalid })).toThrow();
  });

  it("el sitio público nunca recibe llaves, preparación ni avisos", () => {
    const published = { ...propiedades[0], ...followup, publicada: true, estado: "disponible", publicadaEl: "2026-10-01" };
    const [projected] = projectPublic("propiedades", [published]);
    expect(projected).toBeDefined();
    for (const key of ["llaves", "preparacion", "avisosCompradores"]) expect(projected).not.toHaveProperty(key);
  });

  it("acepta el canal del prospecto y rechaza uno desconocido", () => {
    const lead = { id: "lead1", nombre: "Ana", telefono: "6641234567", origen: "manual", estado: "nuevo", creadoEl: "2026-10-28T10:00:00Z", notas: [] };
    expect(parseRecord("leads", "lead1", { ...lead, canal: "referido" })).toMatchObject({ canal: "referido" });
    expect(() => parseRecord("leads", "lead1", { ...lead, canal: "paloma" })).toThrow();
  });
});

describe("fechas del contrato de servicio", () => {
  type Result = { data: unknown[]; error: null };
  const chain = (result: Result) => {
    const query: Record<string, unknown> = {};
    for (const step of ["select", "eq", "is", "order", "in"]) query[step] = vi.fn(() => query);
    query.range = vi.fn(async () => result);
    query.then = (resolve: (value: Result) => unknown) => resolve(result);
    return query;
  };
  beforeEach(() => requireStaff.mockReset());

  it("devuelve solo las fechas del 09 más reciente de cada operación y si está emitido", async () => {
    const drafts = chain({ data: [
      { id: "new", expediente_id: "e1", version: 3, inicio: "2026-06-01", fin: "2026-11-30", modalidad: "exclusiva", licenciaEstado: "vigente", licenciaNumero: " BC-123 ", licenciaVigencia: "2026-12-15", expediente: { folio: "EXP-1" } },
      { id: "old", expediente_id: "e1", version: 1, inicio: "2026-01-01", fin: "2026-03-01", modalidad: "no_exclusiva", licenciaEstado: null, licenciaNumero: null, licenciaVigencia: null, expediente: { folio: "EXP-1" } },
      { id: "other", expediente_id: "e2", version: 1, inicio: null, fin: "no es fecha", modalidad: null, licenciaEstado: "pendiente", licenciaNumero: "X", licenciaVigencia: "2026-12-01", expediente: [{ folio: "EXP-2" }] },
    ], error: null });
    const emissions = chain({ data: [{ draft_id: "new", draft_version: 3 }, { draft_id: "other", draft_version: 2 }], error: null });
    requireStaff.mockResolvedValue({ client: { from: (table: string) => table === "fortius_inmuebles_formato_drafts" ? drafts : emissions } });
    const response = await contractDates();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.contratos).toEqual([
      { expedienteId: "e1", folio: "EXP-1", emitido: true, inicio: "2026-06-01", fin: "2026-11-30", exclusiva: true, licencia: { numero: "BC-123", vigencia: "2026-12-15" } },
      { expedienteId: "e2", folio: "EXP-2", emitido: false, exclusiva: false },
    ]);
    expect(JSON.stringify(body)).not.toContain("\"data\"");
    expect(drafts.eq).toHaveBeenCalledWith("formato_id", "09");
  });
});
