import { expect, it, vi } from "vitest";
const { requireStaff, createServerClient, prepareFormatoEmission } = vi.hoisted(() => ({ requireStaff: vi.fn(), createServerClient: vi.fn(), prepareFormatoEmission: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient }));
vi.mock("@/lib/formatos/pdf", () => ({ prepareFormatoEmission }));
import { POST } from "@/app/api/admin/formatos/[id]/emitir/route";

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
