import { expect, it, vi } from "vitest";
const { requireStaff, createServerClient, prepareFormatoEmission } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn(), prepareFormatoEmission: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
vi.mock("@/lib/formatos/pdf", () => ({ prepareFormatoEmission }));
import { POST } from "@/app/api/admin/formatos/[id]/emitir/route";
import { terrenoFields } from "@/lib/formatos/levantamiento";

const terrenoInput = {
  ...Object.fromEntries(terrenoFields.filter((field) => field.type !== "levantamientoRows").map((field) => [field.key, field.type === "date" ? "2026-10-04" : field.type === "time" ? "10:00" : "NV"])),
  horaTermino: "11:00", permisoFoto: "autorizado", permisoMedicion: "NV", respaldosEstado: "sin_respaldo", discrepanciasEstado: "ninguna",
  fotoPrincipalId: "51000000-0000-4000-8000-000000000021", croquisId: "51000000-0000-4000-8000-000000000022",
};

it("impide emitir un recibo guardado con datos faltantes y no toca Storage", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const client = { from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id, expediente_id: "51000000-0000-4000-8000-000000000010", formato_id: "18", data: {}, version: 1 }, error: null }) }) }) })) };
  requireStaff.mockResolvedValue({ client, user: { id: "51000000-0000-4000-8000-000000000002", role: "editor" } });
  createServerClient.mockClear();
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(409);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("usa el folio autorizado del expediente al emitir, aunque el borrador contenga otro", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const expedienteId = "51000000-0000-4000-8000-000000000010";
  const data = {
    folio: "FALSO", numeroRecibo: "R-1", lugarEmision: "Tijuana", fechaPago: "2026-10-05", pagador: "Cliente",
    importeRecibido: 12000, moneda: "MXN", importeLetra: "doce mil pesos", concepto: "Honorarios",
    contratoFecha: "Contrato del 1 de octubre", inmueble: "Casa Tijuana", beneficiario: "Fortius",
    representacionBeneficiario: "Cuenta propia", caracter: "Prestador", medioPago: "Transferencia",
    referenciaPago: "SPEI-1", soporteRecepcion: "Comprobante SPEI", pagoParcialTotal: "total",
    saldo: 0, monedaSaldo: "MXN", soporteSaldo: "Contrato", observaciones: "Ninguna",
    cfdiEstado: "Pendiente", receptor: "Ana",
  };
  const client = { from: vi.fn((table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
    data: table === "mnt_formato_drafts" ? { id, expediente_id: expedienteId, formato_id: "18", data, version: 1 } : { id: expedienteId, folio: "REAL" }, error: null,
  }) }) }) })) };
  requireStaff.mockResolvedValue({ client, user: { id: "51000000-0000-4000-8000-000000000002" } });
  prepareFormatoEmission.mockResolvedValue({ bytes: new Uint8Array([37, 80, 68, 70, 45]), sha256: "a".repeat(64) });
  const insert = vi.fn((payload: Record<string, unknown>) => ({ select: () => ({ single: async () => ({ data: { id: payload.id }, error: null }) }) }));
  const privileged = { storage: { from: () => ({ upload: async () => ({ error: null }) }) }, from: () => ({ insert }) };
  createServerClient.mockReturnValue(privileged);
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(201);
  expect(prepareFormatoEmission).toHaveBeenCalledWith("18", expect.objectContaining({ folio: "REAL" }));
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ snapshot: expect.objectContaining({ folio: "REAL" }) }));
});

it("bloquea un formato cuyo original aún no fue cotejado", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const client = { from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id, expediente_id: "51000000-0000-4000-8000-000000000010", formato_id: "07", data: {}, version: 1 }, error: null }) }) }) })) };
  requireStaff.mockResolvedValue({ client, user: { id: "51000000-0000-4000-8000-000000000002", role: "editor" } });
  createServerClient.mockClear();
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(409);
  expect((await response.json()).error).toMatch(/pendiente de cotejo/i);
  expect(createServerClient).not.toHaveBeenCalled();
});

it("rechaza seleccionar imágenes que no aparecen en el borrador autorizado", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const eq = vi.fn(() => ({
    maybeSingle: async () => ({ data: { id, expediente_id: id, formato_id: "04A", data: terrenoInput, folio: "REAL", version: 1 }, error: null }),
    in: async () => ({ data: [], error: null }),
  }));
  requireStaff.mockResolvedValue({ client: { from: () => ({ select: () => ({ eq }) }) }, user: { id } });
  prepareFormatoEmission.mockClear();
  const download = vi.fn();
  createServerClient.mockReturnValue({ storage: { from: () => ({ download }) } });
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(409);
  expect(eq).toHaveBeenCalledWith("draft_id", id);
  expect(download).not.toHaveBeenCalled();
  expect(prepareFormatoEmission).not.toHaveBeenCalled();
});

it("no emite un levantamiento si una imagen archivada perdió su integridad", async () => {
  const id = "51000000-0000-4000-8000-000000000011";
  const images = [{ id: terrenoInput.fotoPrincipalId, kind: "foto", path: "foto.jpg", sha256: "a".repeat(64) }, { id: terrenoInput.croquisId, kind: "croquis", path: "croquis.png", sha256: "a".repeat(64) }];
  requireStaff.mockResolvedValue({ client: { from: () => ({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: { id, expediente_id: id, formato_id: "04A", data: terrenoInput, folio: "REAL", version: 1 }, error: null }),
    in: async () => ({ data: images, error: null }),
  }) }) }) }, user: { id } });
  prepareFormatoEmission.mockClear();
  const upload = vi.fn();
  createServerClient.mockReturnValue({ storage: { from: () => ({ download: async () => ({ data: new Blob(["alterado"]), error: null }), upload }) } });
  const response = await POST(new Request(`https://panel.test/api/admin/formatos/${id}/emitir`, { method: "POST", headers: { origin: "https://panel.test" } }), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(503);
  expect(prepareFormatoEmission).not.toHaveBeenCalled();
  expect(upload).not.toHaveBeenCalled();
});
