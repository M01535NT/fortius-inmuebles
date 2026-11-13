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
