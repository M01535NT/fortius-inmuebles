import Decimal from "decimal.js";

export const REPORTE_TABLES = {
  canales: { label: "Canales y actividad", columns: [{ key: "canal", label: "Canal o actividad" }, { key: "accion", label: "Ejecutado frente al plan" }, { key: "resultado", label: "Resultado y soporte" }] },
  oportunidades: { label: "Oportunidades en seguimiento", columns: [{ key: "referencia", label: "Referencia anónima" }, { key: "situacion", label: "Situación al corte" }, { key: "seguimiento", label: "Siguiente acción, responsable y fecha" }] },
  publicidad: { label: "Publicidad pagada", columns: [{ key: "portal", label: "Portal y periodo" }, { key: "autorizado", label: "Autorizado con impuestos" }, { key: "ejercido", label: "Ejercido con impuestos" }, { key: "soporte", label: "Soporte y pago" }] },
  acciones: { label: "Acciones del siguiente periodo", columns: [{ key: "accion", label: "Acción y motivo" }, { key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha" }, { key: "dependencia", label: "Dependencia o autorización" }] },
} as const;
export type ReporteTable = keyof typeof REPORTE_TABLES;
export type ReporteRow = Record<string, string | number | undefined>;

const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const count = (value: unknown) => amount(value) && Number.isInteger(value);
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function calcularPublicidadReporte(data: Record<string, unknown>) {
  const rows = Array.isArray(data.publicidad) ? data.publicidad as ReporteRow[] : [];
  const sum = (key: "autorizado" | "ejercido") => rows.reduce((total, row) => total.plus(amount(row[key]) ? row[key] as number : 0), new Decimal(0));
  const saldo = new Decimal(amount(data.saldoInicial) ? data.saldoInicial as number : 0)
    .plus(amount(data.fondosRecibidos) ? data.fondosRecibidos as number : 0)
    .minus(amount(data.fondosAplicados) ? data.fondosAplicados as number : 0)
    .minus(amount(data.fondosDevueltos) ? data.fondosDevueltos as number : 0);
  return { autorizado: sum("autorizado").toNumber(), ejercido: sum("ejercido").toNumber(), saldoFondos: saldo.toNumber(), pagosDirectos: amount(data.pagosDirectos) ? data.pagosDirectos as number : 0 };
}

export function validarReporte(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (date(data.periodoInicio) && date(data.periodoFin) && String(data.periodoInicio) > String(data.periodoFin)) errors.push("Periodo informado");
  if (date(data.periodoFin) && date(data.fechaEmision) && String(data.fechaEmision) < String(data.periodoFin)) errors.push("Fecha de emisión");
  if (date(data.primeraPublicacion) && date(data.periodoFin) && String(data.primeraPublicacion) > String(data.periodoFin)) errors.push("Primera publicación");
  if (!count(data.diasActivos)) errors.push("Días activos en el mercado");
  for (const [key, label] of [["contactos", "Contactos nuevos"], ["visitas", "Visitas realizadas"], ["ofertas", "Ofertas recibidas"]] as const) {
    if (data[`${key}Estado`] === "comprobado" && !count(data[key])) errors.push(label);
  }
  if (data.registroVisitas === "comprobado") for (const [key, label] of [["agendadas", "Visitas agendadas"], ["realizadas", "Visitas realizadas de las citas"], ["canceladas", "Visitas canceladas"], ["reprogramadas", "Visitas reprogramadas"], ["pendientes", "Visitas pendientes al corte"]] as const) if (!count(data[key])) errors.push(label);
  if (data.registroVisitas === "comprobado" && count(data.agendadas) && count(data.realizadas) && (data.realizadas as number) > (data.agendadas as number)) errors.push("Visitas realizadas de las citas");
  for (const [key, config] of Object.entries(REPORTE_TABLES)) {
    const rows = data[key];
    if (!Array.isArray(rows) || rows.length > 30) { errors.push(config.label); continue; }
    if ((key === "canales" || key === "acciones") && rows.length === 0) errors.push(config.label);
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push(config.label); continue; }
      for (const column of config.columns) {
        const value = (row as Record<string, unknown>)[column.key];
        if (key === "publicidad" && (column.key === "autorizado" || column.key === "ejercido")) {
          if (!amount(value)) errors.push(config.label);
        } else if (key === "acciones" && column.key === "fecha") {
          if (!date(value)) errors.push(config.label);
        } else if (!text(value)) errors.push(config.label);
      }
    }
  }
  if (data.publicidadEstado === "no_contratada" && Array.isArray(data.publicidad) && data.publicidad.length > 0) errors.push("Publicidad pagada");
  if (data.publicidadEstado === "no_contratada" && ["saldoInicial", "fondosRecibidos", "fondosAplicados", "fondosDevueltos", "pagosDirectos"].some((key) => typeof data[key] === "number" && data[key] !== 0)) errors.push("Publicidad pagada");
  if (data.publicidadEstado === "contratada") {
    if (!Array.isArray(data.publicidad) || data.publicidad.length === 0) errors.push("Publicidad pagada");
    if (!text(data.monedaPublicidad)) errors.push("Moneda de publicidad");
    for (const [key, label] of [["saldoInicial", "Saldo inicial"], ["fondosRecibidos", "Fondos recibidos"], ["fondosAplicados", "Fondos aplicados"], ["fondosDevueltos", "Fondos devueltos"], ["pagosDirectos", "Pagos directos al portal"]] as const) if (!amount(data[key])) errors.push(label);
    if (!text(data.soporteSaldo)) errors.push("Soporte y destino del saldo");
  }
  if (data.estadoRespuestaPropietario === "recibida" && !text(data.constanciaRespuesta)) errors.push("Constancia de respuesta del propietario");
  if (data.entregaInformeEstado === "entregado" && (!date(data.fechaEntregaInforme) || !text(data.medioEntregaInforme) || !text(data.acuseInforme))) errors.push("Entrega del informe");
  return [...new Set(errors)];
}
