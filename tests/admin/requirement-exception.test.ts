import { describe, expect, it } from "vitest";
import { emptyWorkflow, exceptionCovers, exceptionKeys, PROTECTED_REQUIREMENTS, publicationBlockers, reviewComplete, WORKFLOW_REQUIREMENTS, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { EXCEPTION_TAG, operationTags } from "@/lib/admin/operation-view";

/* COR-20 y RP-31: el director cubre un requisito con una excepción y su motivo. */
const today = "2026-11-12";
const motivo = "El propietario entrega el plan firmado la próxima semana";
const withException = (key: keyof typeof WORKFLOW_REQUIREMENTS, text = motivo): OperationWorkflow => ({ ...emptyWorkflow(), requisitos: { [key]: { estado: "pendiente", soporte: "", excepcion: { motivo: text } } } });

describe("excepción autorizada", () => {
  it("cubre el requisito y la operación lleva su etiqueta", () => {
    const flow = withException("plan");
    expect(reviewComplete(flow, "plan", today)).toBe(true);
    expect(exceptionKeys(flow)).toEqual(["plan"]);
    expect(operationTags({ flujo: flow })).toContain(EXCEPTION_TAG);
    expect(publicationBlockers(flow, "comercializacion", today)).not.toContain(WORKFLOW_REQUIREMENTS.plan.label);
  });
  it("no cubre un requisito de protección ni un motivo corto", () => {
    for (const key of PROTECTED_REQUIREMENTS) expect(reviewComplete(withException(key), key, today)).toBe(false);
    expect(exceptionCovers(withException("plan", "Corto"), "plan")).toBe(false);
    expect(operationTags({ flujo: emptyWorkflow() })).not.toContain(EXCEPTION_TAG);
  });
});

/* COR-24: inventario heredado. */
import { inheritedExceptions, inheritedPending } from "@/lib/formatos/operation-workflow";
import { INHERITED_TAG } from "@/lib/admin/operation-view";
import { needsInitialGate } from "@/lib/formatos/operation-gates";
describe("inventario heredado", () => {
  const flow = (ruta: OperationWorkflow["ruta"]): OperationWorkflow => ({ ...emptyWorkflow(ruta), heredado: { desde: "2026-06-01" },
    requisitos: Object.fromEntries(inheritedExceptions(ruta).map(key => [key, { estado: "pendiente" as const, soporte: "", excepcion: { motivo } }])) });
  it("lleva su etiqueta y para publicar pide lo que protege al cliente, el precio y el contrato", () => {
    const sale = flow("captacion");
    expect(operationTags({ flujo: sale })).toContain(INHERITED_TAG);
    expect(inheritedPending(sale, today)).toEqual(["titularidad", "factibilidad", "valor", "precio", "intermediacion", "publicacion"]);
    expect(inheritedExceptions("arrendador")).not.toContain("plan");
    expect(inheritedPending(emptyWorkflow(), today)).toEqual([]);
  });
  it("no pide la 02, el 04 ni el checklist para salir de captación", () => {
    expect(needsInitialGate({ etapa: "captacion", operacion: "venta", flujo: flow("captacion") }, "documentacion")).toBe(false);
    expect(needsInitialGate({ etapa: "captacion", operacion: "venta", flujo: emptyWorkflow() }, "documentacion")).toBe(true);
  });
});
