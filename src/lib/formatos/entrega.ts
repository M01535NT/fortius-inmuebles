export const ENTREGA_TABLAS = {
  diferencias: { label: "Daños, faltantes o diferencias", columns: [{ key: "area", label: "Área o elemento" }, { key: "observacion", label: "Observación o diferencia" }] },
  accesos: { label: "Llaves y accesos", columns: [{ key: "acceso", label: "Llave, control o tarjeta" }, { key: "cantidad", label: "Cantidad recibida y observación" }] },
  documentos: { label: "Documentos adicionales entregados", columns: [{ key: "documento", label: "Documento" }, { key: "ejemplares", label: "Ejemplares y original o copia" }] },
  servicios: { label: "Servicios y lecturas", columns: [{ key: "servicio", label: "Servicio y medidor" }, { key: "lectura", label: "Lectura y unidad" }, { key: "observacion", label: "Observación" }] },
  pendientes: { label: "Acciones pendientes", columns: [{ key: "accion", label: "Pendiente o acción" }, { key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha acordada o por acordar" }] },
} as const;
export type EntregaTabla = keyof typeof ENTREGA_TABLAS;
export type EntregaRow = Record<string, string>;

const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;

export function validarEntrega(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const result = String(data.resultadoEntrega ?? "");
  if (result !== "no_realizada") {
    if (!filled(data.recepcionFecha)) errors.push("Fecha de recepción efectiva");
    if (!filled(data.recepcionHora)) errors.push("Hora de recepción efectiva");
    if (!filled(data.areasEntregadas)) errors.push("Áreas y bienes entregados");
  }
  if (result === "parcial" && (!filled(data.areasSinEntregar) || String(data.areasSinEntregar).trim().toLocaleLowerCase("es-MX") === "ninguna")) errors.push("Áreas sin entregar");
  if (result === "no_realizada" && !filled(data.motivoNoEntrega)) errors.push("Motivo de la entrega no realizada");
  for (const [key, config] of Object.entries(ENTREGA_TABLAS)) {
    const rows = data[key] ?? [];
    if (!Array.isArray(rows) || rows.length > 30) { errors.push(config.label); continue; }
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row) || config.columns.some((column) => !filled((row as Record<string, unknown>)[column.key]))) errors.push(config.label);
    }
  }
  const conditional = [
    ["diferencias", "estadoDiferencias", "registradas"],
    ["accesos", "estadoAccesos", "registrados"],
    ["documentos", "estadoDocumentos", "registrados"],
    ["servicios", "estadoServicios", "registrados"],
    ["pendientes", "estadoPendientes", "registrados"],
  ] as const;
  for (const [key, state, value] of conditional) {
    const rows = data[key] ?? [];
    if (data[state] === value && (!Array.isArray(rows) || rows.length === 0)) errors.push(ENTREGA_TABLAS[key].label);
    if (data[state] !== value && Array.isArray(rows) && rows.length > 0) errors.push(ENTREGA_TABLAS[key].label);
  }
  return [...new Set(errors)];
}
