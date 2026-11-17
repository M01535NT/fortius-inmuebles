import { esGuiaPropia, tipoDeAsunto, type TipoElegible } from "@/lib/guias";
import type { Acreedor } from "@/lib/tramites";
import { emptyWorkflow, type OperationWorkflow } from "./operation-workflow";

/*
  FLX-03 B (DEC-55): el tipo de un asunto se elige al abrirlo y se puede cambiar después. Cambiar
  conserva lo hecho (requisitos, contraparte, firmas, notas); solo cambian la operación, la ruta y
  la guía. Las guías propias se quedan con la operación que traían (venta o renta) y empiezan en
  su primera etapa, salvo que se elija otra.
*/
export function operacionYFlujo(tipo: TipoElegible, base: OperationWorkflow | null, operacionActual: string, opciones: { acreedor?: Acreedor; paso?: number } = {}): { operacion: "venta" | "renta"; flujo: OperationWorkflow } {
  const anterior = base ?? emptyWorkflow(operacionActual === "renta" ? "arrendador" : "captacion");
  const sinGuia: OperationWorkflow = { ...anterior };
  delete sinGuia.guia;
  if (tipo === "venta") return { operacion: "venta", flujo: { ...sinGuia, ruta: "captacion" } };
  if (tipo === "renta") return { operacion: "renta", flujo: { ...sinGuia, ruta: "arrendador" } };
  const operacion = operacionActual === "renta" ? "renta" : "venta";
  const mismaGuia = anterior.guia?.clave === tipo ? anterior.guia : undefined;
  return { operacion, flujo: { ...sinGuia, ruta: operacion === "renta" ? "arrendador" : "captacion",
    guia: { clave: tipo, paso: opciones.paso ?? mismaGuia?.paso ?? 0, ...(tipo === "cancelacion_hipoteca" ? { acreedor: opciones.acreedor ?? mismaGuia?.acreedor ?? "banco" } : {}) } } };
}

/** Se puede cambiar el tipo de los asuntos de propietario (venta, renta y las guías propias). */
export function cambiaDeTipo(flujo: OperationWorkflow | null | undefined, operacion: string) {
  const tipo = tipoDeAsunto(flujo, operacion);
  return ["venta", "renta"].includes(operacion) && (tipo === "venta" || tipo === "renta" || esGuiaPropia(tipo));
}
