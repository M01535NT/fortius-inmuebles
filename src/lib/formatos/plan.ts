import Decimal from "decimal.js";

export const PLAN_TABLES = {
  atributos: { label: "Atributos, evidencia y mensaje", columns: [{ key: "atributo", label: "Atributo o condición" }, { key: "evidencia", label: "Evidencia y alcance" }, { key: "mensaje", label: "Mensaje comercial" }], fixed: [] },
  hitos: { label: "Preparación y calendario", columns: [{ key: "entregable", label: "Entregable o condición" }, { key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha" }], fixed: [{ key: "preparacion", label: "Preparación" }, { key: "produccion", label: "Producción" }, { key: "lanzamiento", label: "Lanzamiento" }, { key: "cortes", label: "Cortes 7, 14 y 21" }, { key: "continuidad", label: "Continuidad" }] },
  piezas: { label: "Materiales de difusión", columns: [{ key: "alcance", label: "Alcance o no aplica" }, { key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha" }], fixed: [{ key: "fotografias", label: "Fotografías" }, { key: "ficha", label: "Ficha comercial" }, { key: "video", label: "Video o plano" }, { key: "otras", label: "Otras piezas" }] },
  canales: { label: "Canales y piezas seleccionados", columns: [{ key: "motivo", label: "Canal y motivo" }, { key: "piezaPeriodo", label: "Pieza, periodo y frecuencia" }, { key: "autorizacion", label: "Estado y autorización" }], fixed: [{ key: "portales", label: "Portales gratuitos" }, { key: "mnt", label: "Sitio MNT y redes propias" }, { key: "referidos", label: "Referidos y colaboración" }] },
  extras: { label: "Publicidad pagada y extras", columns: [{ key: "concepto", label: "Concepto y periodo" }, { key: "importe", label: "Total MXN con impuestos" }, { key: "pagador", label: "A cargo de" }, { key: "estado", label: "Propuesto o autorizado" }, { key: "soporte", label: "Cotización o autorización y fecha" }], fixed: [] },
  decisiones: { label: "Decisiones para iniciar", columns: [{ key: "alcance", label: "Alcance autorizado o pendiente" }], fixed: [{ key: "difusion", label: "Precio, canales y materiales" }, { key: "gastos", label: "Presupuesto, acceso y datos" }, { key: "pendientes", label: "Pendientes, responsable y fecha" }] },
} as const;
export type PlanTable = keyof typeof PLAN_TABLES;
export type PlanRow = Record<string, string | number | undefined>;

const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const nonnegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const validDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

export function calcularExtras(rows: PlanRow[]) {
  const proposed = rows.reduce((sum, row) => sum.plus(nonnegative(row.importe) ? row.importe as number : 0), new Decimal(0));
  const authorized = rows.filter((row) => row.estado === "autorizado").reduce((sum, row) => sum.plus(nonnegative(row.importe) ? row.importe as number : 0), new Decimal(0));
  return { propuesto: proposed.toNumber(), autorizado: authorized.toNumber() };
}

export function validarPlan(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (data.precioSalida === 0) errors.push("Precio de salida autorizado");
  if (data.valorReferencia07 === 0) errors.push("Valor de referencia 07");
  if (text(data.fechaLanzamiento) && text(data.corte7) && text(data.corte14) && text(data.corte21)) {
    const dates = [data.fechaLanzamiento, data.corte7, data.corte14, data.corte21] as string[];
    if (!(dates[0] <= dates[1] && dates[1] < dates[2] && dates[2] < dates[3])) errors.push("Cortes de los días 7, 14 y 21");
  }
  if (text(data.fechaLanzamiento) && text(data.fechaRevision) && String(data.fechaRevision) < String(data.fechaLanzamiento)) errors.push("Fecha de revisión");
  for (const [key, config] of Object.entries(PLAN_TABLES)) {
    const rows = data[key];
    if (!Array.isArray(rows) || rows.length > 20) { errors.push(config.label); continue; }
    const fixed = config.fixed as readonly { key: string; label: string }[];
    if (fixed.length && (rows.length !== fixed.length || new Set(rows.map((row) => row?.concepto)).size !== fixed.length || fixed.some((item) => !rows.some((row) => row?.concepto === item.key)))) errors.push(config.label);
    if (key === "atributos" && rows.length === 0) errors.push(config.label);
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push(config.label); continue; }
      for (const column of config.columns) {
        const value = (row as Record<string, unknown>)[column.key];
        if ((key === "hitos" || key === "piezas") && column.key === "fecha") {
          if (!validDate(value)) errors.push(config.label);
        } else if (key === "extras" && column.key === "importe") {
          if (!nonnegative(value)) errors.push(config.label);
        } else if (!text(value)) errors.push(config.label);
      }
      if (key === "extras" && !["propuesto", "autorizado"].includes(String((row as Record<string, unknown>).estado))) errors.push(config.label);
    }
  }
  const extras = data.extras;
  if (Array.isArray(extras)) {
    if (data.estadoPublicidad === "no_contratada" && extras.some((row) => row?.estado === "autorizado")) errors.push("Publicidad pagada y extras");
    if (data.estadoPublicidad === "contratada" && !extras.some((row) => row?.estado === "autorizado")) errors.push("Publicidad pagada y extras");
  }
  if (data.estadoAprobacion === "registrada" && (!text(data.nombreAprobador) || !text(data.fechaAprobacion) || !text(data.acuseAprobacion))) errors.push("Constancia de aceptación del plan");
  return [...new Set(errors)];
}
