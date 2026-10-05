type Column = { key: string; label: string; options?: readonly { value: string; label: string }[]; type?: "date" };
const select = (values: readonly [string, string][]) => values.map(([value, label]) => ({ value, label }));
const yesNoPending = select([["si", "Sí"], ["no", "No"], ["pendiente", "Por determinar"]]);
const docState = select([["no_recibido", "No recibido"], ["recibido", "Recibido"], ["insuficiente", "Insuficiente"], ["verificado", "Verificado"]]);
const controlState = select([["conforme", "Conforme"], ["hallazgo", "Hallazgo"], ["pendiente", "Pendiente"], ["no_aplica", "No aplica"], ["fuera_alcance", "Fuera de alcance"]]);
const stageState = select([["avanza", "Puede avanzar"], ["condicionado", "Condicionado"], ["bloqueado", "Bloqueado"], ["pendiente", "Pendiente"], ["no_aplica", "No aplica"]]);
const fixed = (items: readonly [string, string][]) => items.map(([key, label]) => ({ key, label }));

export const JURIDICA_TABLES: Record<string, { label: string; columns: readonly Column[]; fixed?: { key: string; label: string }[]; min?: number }> = {
  personas: { label: "Personas, titularidad y facultades", min: 1, columns: [{ key: "persona", label: "Nombre o razón social e ID" }, { key: "calidad", label: "Calidad" }, { key: "participacion", label: "Participación" }, { key: "facultad", label: "Facultad o consentimiento y documento" }] },
  documentos: { label: "Control documental", fixed: fixed([
    ["D01", "Escritura o título"], ["D02", "Inscripción"], ["D03", "Certificado de gravámenes"], ["D04", "Tracto"],
    ["D05", "Catastro o plano"], ["D06", "Predial y adeudos"], ["D07", "CESPT y estado de cuenta"], ["D08", "Domicilio personal"],
    ["D09", "Identificaciones"], ["D10", "CURP"], ["D11", "RFC o situación fiscal"], ["D12", "Matrimonio y capitulaciones"],
    ["D13", "Divorcio, liquidación o defunción"], ["D14", "Poder y facultades"], ["D15", "Sociedad y acuerdos"],
    ["D16", "Sucesión o adjudicación"], ["D17", "Hipoteca y cancelación"], ["D18", "Arrendamientos y compromisos"],
    ["D19", "Condominio y cuotas"], ["D20", "Uso, licencias o regularizaciones"], ["D21", "Régimen especial"], ["D22", "Otros documentos"],
  ]), columns: [{ key: "aplica", label: "Aplica", options: yesNoPending }, { key: "estado", label: "Estado", options: docState }, { key: "referencia", label: "ID, emisor, folio y fecha" }, { key: "verificacion", label: "Verificación, pendiente o motivo de no aplica" }] },
  tracto: { label: "Cadena de titularidad", min: 1, columns: [{ key: "acto", label: "Acto, fecha e instrumento" }, { key: "transmitente", label: "Transmitente" }, { key: "adquirente", label: "Adquirente" }, { key: "inscripcion", label: "Inscripción, fuente y continuidad" }] },
  contraste: { label: "Contraste de identidad del inmueble", fixed: fixed([["titular", "Titular y derecho"], ["ubicacion", "Lote, manzana, unidad y domicilio"], ["superficie", "Superficie, medidas y colindancias"], ["construccion", "Construcción, accesorios e indiviso"]]), columns: [{ key: "titulo", label: "Título o registro" }, { key: "catastro", label: "Catastro o levantamiento 04" }, { key: "resultado", label: "Coincide, diferencia y evidencia" }] },
  cargas: { label: "Gravámenes y restricciones", columns: [{ key: "carga", label: "Carga, limitación o acreedor" }, { key: "asiento", label: "Asiento, expediente, fecha y evidencia" }, { key: "efecto", label: "Efecto y salida propuesta" }] },
  especiales: { label: "Controles especiales", fixed: fixed([
    ["urbanistico", "Urbanístico: uso y licencias"], ["condominio", "Condominio o plaza"], ["agrario", "Origen ejidal o comunal"],
    ["extranjero", "Extranjero o fideicomiso"], ["capacidad", "Sucesión, copropiedad o capacidad"],
    ["litigio", "Litigio, remate o adjudicación"], ["territorio", "Terreno, costa o industria"], ["cumplimiento", "PLD y consumo"],
  ]), columns: [{ key: "estado", label: "Estado", options: controlState }, { key: "evidencia", label: "Evidencia, resultado, acción o motivo de NA/FA" }] },
  hallazgos: { label: "Hallazgos y subsanación", columns: [{ key: "id", label: "ID hallazgo" }, { key: "tema", label: "Tema y etapa" }, { key: "impacto", label: "Impacto y probabilidad" }, { key: "hecho", label: "Hecho y evidencia" }, { key: "fundamento", label: "Fundamento vigente o criterio" }, { key: "accion", label: "Acción correctiva" }, { key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha límite", type: "date" }, { key: "estado", label: "Abierto o cerrado", options: select([["abierto", "Abierto"], ["cerrado", "Cerrado"]]) }, { key: "subsanacion", label: "Evidencia de cierre o pendiente" }] },
  etapas: { label: "Decisión por etapa", fixed: fixed([["captacion", "Captación y publicidad"], ["negociacion", "Negociación y oferta"], ["anticipo", "Anticipo o apartado"], ["promesa", "Promesa"], ["firma", "Firma y desembolso"], ["posesion", "Posesión jurídica"]]), columns: [{ key: "estado", label: "Estado", options: stageState }, { key: "condicion", label: "Condición, hallazgo, evidencia y decisión" }] },
  cierre: { label: "Condiciones de cierre", fixed: fixed([
    ["actualizacion", "Actualizar certificados y facultades"], ["gravamen", "Cancelar gravamen"], ["instrumento", "Validar escritura o contrato"],
    ["impuestos", "Revisar impuestos, gastos y adeudos"], ["fondos", "Verificar origen y destino de fondos"], ["firma", "Acreditar firma y pagos"],
    ["registro", "Seguimiento registral"], ["posesion", "Obligaciones de posesión y acta 16"],
  ]), columns: [{ key: "responsable", label: "Responsable" }, { key: "fecha", label: "Fecha límite", type: "date" }, { key: "estado", label: "Estado", options: controlState }, { key: "evidencia", label: "Evidencia o motivo de NA/FA" }] },
};
export type JuridicaTable = keyof typeof JURIDICA_TABLES;
export type JuridicaRow = Record<string, string | undefined>;
const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const date = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function mostrarColumnaJuridica(kind: string, column: string, row: JuridicaRow): boolean {
  if (kind !== "documentos") return true;
  if (["estado", "referencia"].includes(column) && row.aplica !== "si") return false;
  if (column === "referencia" && row.estado === "no_recibido") return false;
  return true;
}

export function validarJuridica(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const [key, config] of Object.entries(JURIDICA_TABLES)) {
    const rows = data[key];
    if (!Array.isArray(rows) || rows.length > 35 || (config.min && rows.length < config.min) || (config.fixed && rows.length !== config.fixed.length)) { errors.push(config.label); continue; }
    if (config.fixed && config.fixed.some((item, index) => (rows[index] as JuridicaRow)?.concepto !== item.key)) { errors.push(config.label); continue; }
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push(config.label); continue; }
      const item = row as JuridicaRow;
      for (const column of config.columns) {
        if (!mostrarColumnaJuridica(key, column.key, item)) continue;
        const value = item[column.key];
        if (column.options && !column.options.some((option) => option.value === value)) errors.push(config.label);
        else if (column.type === "date" && !date(value)) errors.push(config.label);
        else if (!column.options && column.type !== "date" && !filled(value)) {
          if (key === "documentos" && column.key === "verificacion" && item.aplica === "si" && item.estado === "no_recibido") continue;
          if (key === "cargas" && rows.length === 0) continue;
          errors.push(config.label);
        }
      }
      if (key === "documentos" && item.aplica === "no" && !filled(item.verificacion)) errors.push(config.label);
    }
  }
  if (data.hallazgosEstado === "abiertos" && (!Array.isArray(data.hallazgos) || data.hallazgos.length === 0)) errors.push("Conclusión jurídica");
  if (data.hallazgosEstado === "abiertos" && Array.isArray(data.hallazgos) && !data.hallazgos.some((row) => row.estado === "abierto")) errors.push("Conclusión jurídica");
  if (data.hallazgosEstado === "cerrados" && (!Array.isArray(data.hallazgos) || data.hallazgos.length === 0 || data.hallazgos.some((row) => row.estado !== "cerrado"))) errors.push("Conclusión jurídica");
  if (data.resultado === "factible" && (data.hallazgosEstado === "abiertos" || (Array.isArray(data.etapas) && data.etapas.some((row) => row.estado === "bloqueado" || row.estado === "condicionado")))) errors.push("Conclusión jurídica");
  if (data.hallazgosEstado === "ninguno" && Array.isArray(data.hallazgos) && data.hallazgos.length > 0) errors.push("Hallazgos y subsanación");
  return [...new Set(errors)];
}
