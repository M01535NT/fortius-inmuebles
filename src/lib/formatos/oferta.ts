import Decimal from "decimal.js";

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const validMoney = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;

export function respuestaRequiereRatificacion(data: Record<string, unknown>): boolean {
  if (data.estadoRespuesta !== "registrada" || data.decisionPropietario === "rechazar") return false;
  if (!hasText(data.fechaRespuesta) || !hasText(data.fechaLimitePropuesta)) return false;
  if (String(data.fechaRespuesta) > String(data.fechaLimitePropuesta)) return true;
  return data.fechaRespuesta === data.fechaLimitePropuesta && hasText(data.horaRespuesta) && hasText(data.horaLimitePropuesta) && String(data.horaRespuesta) > String(data.horaLimitePropuesta);
}

export function validarOferta(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (data.precioPropuesto === 0) errors.push("Precio propuesto");
  if (validMoney(data.recursosPropios) && validMoney(data.credito) && validMoney(data.precioPropuesto)) {
    if (!new Decimal(data.recursosPropios as number).plus(data.credito as number).equals(data.precioPropuesto as number)) errors.push("Desglose de recursos y crédito");
  }
  if (typeof data.credito === "number" && data.credito > 0) {
    if (!hasText(data.institucionCredito)) errors.push("Institución del crédito");
    if (!hasText(data.estadoCredito)) errors.push("Estado del crédito");
  }
  if (hasText(data.fechaPropuesta) && hasText(data.fechaLimitePropuesta) && String(data.fechaLimitePropuesta) < String(data.fechaPropuesta)) errors.push("Límite de respuesta a la propuesta");
  if (hasText(data.fechaPropuesta) && hasText(data.fechaFormalizacion) && String(data.fechaFormalizacion) < String(data.fechaPropuesta)) errors.push("Fecha propuesta para formalizar");
  if (hasText(data.fechaCondiciones) && hasText(data.fechaFormalizacion) && String(data.fechaCondiciones) > String(data.fechaFormalizacion)) errors.push("Límite para resolver condiciones");
  if (data.estadoRespuesta === "registrada") {
    if (respuestaRequiereRatificacion(data) && !hasText(data.confirmacionVigencia)) errors.push("Confirmación de vigencia por el comprador");
    for (const [key, label] of [
      ["lugarRespuesta", "Lugar de la respuesta"], ["fechaRespuesta", "Fecha de la respuesta"],
      ["horaRespuesta", "Hora de la respuesta"], ["caracterPropietario", "Carácter y facultades del propietario"],
      ["decisionPropietario", "Decisión del propietario"], ["motivoRespuesta", "Motivo de la respuesta"],
    ]) if (!hasText(data[key])) errors.push(label);
    if (hasText(data.fechaRespuesta) && hasText(data.fechaPropuesta) && String(data.fechaRespuesta) < String(data.fechaPropuesta)) errors.push("Fecha de la respuesta");
    if (data.decisionPropietario === "contraoferta") {
      for (const [key, label] of [
        ["monedaContraoferta", "Moneda de la contraoferta"], ["impuestosContraoferta", "Impuestos de la contraoferta"],
        ["cambiosContraoferta", "Cambios precisos de la contraoferta"], ["fechaLimiteContraoferta", "Límite de respuesta a la contraoferta"],
        ["horaLimiteContraoferta", "Hora límite de la contraoferta"],
      ]) if (!hasText(data[key])) errors.push(label);
      if (!validMoney(data.precioContraoferta) || data.precioContraoferta === 0) errors.push("Precio de la contraoferta");
      if (hasText(data.fechaLimiteContraoferta) && hasText(data.fechaRespuesta) && String(data.fechaLimiteContraoferta) < String(data.fechaRespuesta)) errors.push("Límite de respuesta a la contraoferta");
    }
  }
  return [...new Set(errors)];
}
