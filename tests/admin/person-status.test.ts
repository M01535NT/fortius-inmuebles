import { expect, test } from "vitest";
import { captureStatus, clientStatus, leadStatus, type StatusDossier } from "@/lib/admin/person-status";
import type { ContractSignature } from "@/lib/formatos/operation-workflow";

const firma = (extra: Partial<ContractSignature> = {}): ContractSignature => ({ tipo: "intermediacion", fecha: "2026-11-10", firmantes: [{ nombre: "Persona de ejemplo", parte: "propietario" }], archivo: "51000000-0000-4000-8000-0000000000aa", completa: true, revisada: false, ...extra });
const op = (cliente_id: string, propiedad_slug: string | null, firmaContrato?: ContractSignature, extra: Partial<NonNullable<StatusDossier["flujo"]>> = {}): StatusDossier => ({ cliente_id, propiedad_slug, flujo: { ruta: "captacion", estado: "activa", ...(firmaContrato ? { firmaContrato } : {}), ...extra } });

test("COR-10: una persona es prospecto hasta firmar; con la firma registrada es cliente y con el contrato terminado, cliente anterior", () => {
  expect(clientStatus("c1", [])).toBe("prospecto");
  expect(clientStatus("c1", [op("c1", "casa")])).toBe("prospecto");
  expect(clientStatus("c1", [op("c1", "casa", firma({ completa: false, faltan: "La copropietaria" }))])).toBe("prospecto");
  expect(clientStatus("c1", [op("c1", "casa", firma())])).toBe("cliente");
  expect(clientStatus("c1", [op("c1", "casa", firma({ revisada: true, revisadoEl: "2026-11-11T10:00:00Z" }))])).toBe("cliente");
  const ended = op("c1", "casa", firma({ terminacion: { fecha: "2026-11-12", motivo: "Venció" } }));
  expect(clientStatus("c1", [ended])).toBe("cliente_anterior");
  expect(clientStatus("c1", [ended, op("c1", "otra", firma())])).toBe("cliente");
  expect(clientStatus("c2", [op("c1", "casa", firma())])).toBe("prospecto");
});

test("COR-10 (RP-93): el interesado que firma con el cliente es contraparte, nunca cliente", () => {
  const sale = op("c1", "casa", firma(), { contraparteLeadId: "l9" });
  expect(leadStatus({ id: "l9" }, [sale])).toBe("contraparte");
  expect(leadStatus({ id: "l8" }, [sale])).toBe("prospecto");
  expect(leadStatus({ id: "l7", clienteId: "c1" }, [sale])).toBe("cliente");
});

test("COR-10 (RP-97): el inmueble está en captación hasta la firma; captado por revisar hasta que el director la revisa", () => {
  expect(captureStatus("casa", [])).toBeNull();
  expect(captureStatus("casa", [op("c1", "casa")])).toBe("en_captacion");
  expect(captureStatus("casa", [op("c1", "casa", firma())])).toBe("captado_por_revisar");
  expect(captureStatus("casa", [op("c1", "casa", firma({ revisada: true, revisadoEl: "2026-11-11T10:00:00Z" }))])).toBe("captado");
  expect(captureStatus("casa", [{ ...op("c1", "casa", firma()), flujo: { ruta: "compra", estado: "activa", firmaContrato: firma() } }])).toBeNull();
});
