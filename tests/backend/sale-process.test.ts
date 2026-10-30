import { describe, expect, it } from "vitest";
import { addMonths, emptyWorkflow, lastOwnerReport, operationWorkflowSchema, ownerReportApplies, ownerReportStatus, processPhase, processStageText, requirementPhase, SALE_PROCESS, verificationComplete, WORKFLOW_STAGES, type OperationWorkflow } from "@/lib/formatos/operation-workflow";

const today = "2026-10-15";
const reviewed = { estado: "revisado" as const, soporte: "Revisión ficticia", evidencia: { tipo: "externa" as const, referencia: "Carpeta ficticia v1", fecha: "2026-10-10", responsable: "Revisor ficticio", resultado: "Sin observaciones" }, vigenteHasta: "2026-12-31" };
function verified(resolution = true): OperationWorkflow {
  const flow = emptyWorkflow("captacion");
  for (const key of ["titularidad", "factibilidad", "valor", "precio"] as const) flow.requisitos[key] = reviewed;
  if (resolution) flow.resolucion = { tipo: "aceptada", fecha: "2026-10-12", motivo: "Encargo aceptado", siguienteAccion: "Firmar intermediación", fechaSiguiente: "2026-10-20" };
  return flow;
}

describe("proceso de comercialización", () => {
  it("define diez etapas en el orden del titular", () => {
    expect(SALE_PROCESS.map(p => p.label)).toEqual(["Prospecto", "Entrevista inicial", "Levantamiento", "Checklist de documentos", "Dictamen jurídico", "Opinión de valor y precio", "Contrato y preparación", "Publicación y seguimiento", "Visitas y ofertas", "Cierre y entrega"]);
    expect(new Set(SALE_PROCESS.flatMap(p => p.etapas))).toEqual(new Set(WORKFLOW_STAGES));
  });
  it("cada estado interno del propietario corresponde a una etapa", () => {
    const flow = emptyWorkflow("captacion");
    expect(WORKFLOW_STAGES.map(stage => processPhase(stage, flow, today))).toEqual(["prospecto", "dictamen", "publicacion", "visitas", "cierre", "cierre", "cierre", "cierre"]);
  });
  it("el propietario es prospecto hasta iniciar la entrevista inicial (02)", () => {
    const flow = emptyWorkflow("captacion");
    expect(processPhase("captacion", flow, today)).toBe("prospecto");
    expect(processPhase("captacion", flow, today, { iniciada: true })).toBe("captacion");
    expect(processStageText("captacion", flow, today)).toBe("Prospecto");
    expect(processStageText("captacion", flow, today, { iniciada: true })).toBe("Entrevista inicial");
    expect(processPhase("captacion", emptyWorkflow("compra"), today)).toBe("captacion");
    expect(processPhase("captacion", flow, today, { iniciada: true, emitida: true, levantamiento: "borrador" })).toBe("levantamiento");
    expect(processPhase("captacion", flow, today, { iniciada: true, emitida: true, levantamiento: "emitido", documentos: "pendiente" })).toBe("documentos");
    expect(processStageText("captacion", flow, today, { iniciada: true, levantamiento: "emitido", documentos: "pendiente" })).toBe("Checklist de documentos");
  });
  it("documentación pasa a contrato solo con verificación y decisión de captación", () => {
    expect(processPhase("documentacion", emptyWorkflow(), today)).toBe("dictamen");
    expect(processPhase("documentacion", verified(false), today)).toBe("verificacion");
    expect(verificationComplete(verified(), today)).toBe(true);
    expect(processPhase("documentacion", verified(), today)).toBe("contrato");
    const rejected = { ...verified(), resolucion: { ...verified().resolucion!, tipo: "rechazada" as const } };
    expect(processPhase("documentacion", rejected, today)).toBe("verificacion");
  });
  it("una factibilidad vencida regresa la operación al dictamen jurídico", () => {
    const flow = verified(); flow.requisitos.factibilidad = { ...reviewed, vigenteHasta: "2026-10-01" };
    expect(processPhase("documentacion", flow, today)).toBe("dictamen");
  });
  it("recibido no equivale a revisado", () => {
    const flow = verified(); flow.requisitos.titularidad = { estado: "recibido", soporte: "Copia recibida" };
    expect(processPhase("documentacion", flow, today)).toBe("dictamen");
    const valued = verified(); valued.requisitos.valor = { estado: "recibido", soporte: "Opinión recibida" };
    expect(processPhase("documentacion", valued, today)).toBe("verificacion");
  });
  it("expedientes históricos sin guía conservan su etapa equivalente", () => {
    expect(processPhase(undefined, null, today)).toBe("prospecto");
    expect(processPhase("documentacion", null, today)).toBe("dictamen");
    expect(processPhase("negociacion", null, today)).toBe("visitas");
    expect(processStageText("comercializacion", null, today)).toBe("Publicación y seguimiento");
  });
  it("compradores se integran en visitas y ofertas sin perder su etiqueta", () => {
    const buyer = emptyWorkflow("compra");
    expect(processPhase("captacion", buyer, today)).toBe("captacion");
    expect(processPhase("documentacion", buyer, today)).toBe("visitas");
    expect(processPhase("cierre", buyer, today)).toBe("cierre");
    expect(processStageText("documentacion", buyer, today)).toBe("Opciones");
  });
  it("el texto de la etapa distingue verificación de contrato", () => {
    expect(processStageText("documentacion", emptyWorkflow(), today)).toBe("Dictamen jurídico");
    expect(processStageText("documentacion", verified(), today)).toBe("Contrato y preparación");
    expect(processStageText("entrega", emptyWorkflow(), today)).toBe("Cierre y entrega · entrega");
  });
  it("los requisitos se agrupan por la etapa que cierran", () => {
    expect(requirementPhase("entrevista")).toBe("captacion");
    expect(requirementPhase("valor")).toBe("verificacion");
    expect(requirementPhase("titularidad")).toBe("dictamen");
    expect(requirementPhase("intermediacion")).toBe("contrato");
    expect(requirementPhase("comprador")).toBe("publicacion");
    expect(requirementPhase("oferta")).toBe("visitas");
    expect(requirementPhase("archivo")).toBe("cierre");
  });
});

describe("informe mensual al propietario", () => {
  it("suma meses sin desbordar el fin de mes", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
  });
  it("vence un mes después del último informe", () => {
    expect(ownerReportStatus(null, today)).toEqual({ estado: "sin_informe" });
    expect(ownerReportStatus("2026-09-15T18:00:00Z", today)).toEqual({ estado: "al_dia", proximo: "2026-10-15" });
    expect(ownerReportStatus("2026-09-14", today)).toEqual({ estado: "vencido", proximo: "2026-10-14" });
  });
  it("preparado no es entregado: el aviso cuenta desde la última entrega cuando existe (COR-08)", () => {
    const entregas = [{ fecha: "2026-09-20", canal: "correo" as const, responsable: "Ana" }, { fecha: "2026-10-02", canal: "whatsapp" as const, responsable: "Ana" }];
    expect(lastOwnerReport({ entregasInforme: entregas }, "2026-09-01T10:00:00Z")).toBe("2026-10-02");
    expect(lastOwnerReport({}, "2026-09-01T10:00:00Z")).toBe("2026-09-01");
    expect(lastOwnerReport(null, null)).toBeUndefined();
    expect(ownerReportStatus(lastOwnerReport({ entregasInforme: entregas }, "2026-08-01"), today).estado).toBe("al_dia");
    expect(operationWorkflowSchema.safeParse({ ...emptyWorkflow(), entregasInforme: entregas }).success).toBe(true);
    expect(operationWorkflowSchema.safeParse({ ...emptyWorkflow(), entregasInforme: [{ ...entregas[0], canal: "fax" }] }).success).toBe(false);
    expect(operationWorkflowSchema.safeParse({ ...emptyWorkflow(), entregasInforme: [{ ...entregas[0], responsable: " " }] }).success).toBe(false);
  });
  it("aplica solo al propietario mientras se promueve o negocia", () => {
    expect(ownerReportApplies("comercializacion", emptyWorkflow())).toBe(true);
    expect(ownerReportApplies("negociacion", null)).toBe(true);
    expect(ownerReportApplies("documentacion", emptyWorkflow())).toBe(false);
    expect(ownerReportApplies("comercializacion", emptyWorkflow("compra"))).toBe(false);
  });
});
