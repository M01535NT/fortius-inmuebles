import { formatoById } from "../catalog";
import { OPINION_TABLES, estadoDocumento, estadoEtapa, resultadoOpinion } from "../opinion-juridica";
import type { JuridicaRow } from "../juridica";
import { a, fecha, type Block, type Documento } from "./modelo";

/*
  06 · Opinión jurídica del inmueble. No hay plantilla del titular para el 06: conserva el diseño
  de los formatos (título, banda de destinatario, secciones numeradas en prosa y firma del abogado)
  con el orden que el titular aprobó el 12/11/2026 (DOC-06): conclusión con su resultado, objeto y
  alcance, antecedentes en tabla, marco jurídico, análisis, condiciones por etapa y recomendaciones,
  documentos revisados, y vigencia y límites. El contenido lo redacta el profesional en el panel;
  de la revisión 05 sólo llegan el resultado, el estado de cada etapa y los documentos con su estado.
  Captura sobre el documento (EXT-12, 28/10/2026): cada párrafo dice qué campo lo llena («zona»).
*/

type Data = Record<string, unknown>;
const etiqueta = (key: string) => formatoById("06").fields.find(field => field.key === key)?.label ?? key;
const LINEA = "____________________";
/** En las celdas de tabla, una línea corta que no se parte en dos renglones. */
const CELDA = "__________";
/** Un párrafo con sangría por cada párrafo capturado; si falta, la línea para completarlo. Pulsarlo abre su campo. */
const prosa = (d: Data, key: string, strong = false, opcional = false): Block[] => {
  const parts = a(d[key]).split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean);
  if (!parts.length && opcional) return [];
  return (parts.length ? parts : [LINEA]).map(text => ({ kind: "p", text, indent: true, strong, zona: { keys: [key], label: etiqueta(key) } }));
};
const filas = (d: Data, key: string) => Array.isArray(d[key]) ? (d[key] as JuridicaRow[]).filter(row => row && typeof row === "object") : [];

function antecedentes(d: Data): Block[] {
  const rows = filas(d, "antecedentesTabla").filter(row => [row.acto, row.fecha, row.acredita].some(value => a(value)));
  return [
    { kind: "table", zona: { keys: ["antecedentesTabla", "antecedentes"], label: OPINION_TABLES.antecedentesTabla.label }, widths: [4, 2, 5], header: ["Acto o documento", "Fecha", "Qué acredita"],
      rows: rows.length ? rows.map(row => [a(row.acto), a(row.fecha), a(row.acredita)]) : [[CELDA, CELDA, CELDA]] },
    ...prosa(d, "antecedentes", false, true),
  ];
}

function etapas(d: Data): Block[] {
  const saved = filas(d, "etapasCliente");
  const rows = (OPINION_TABLES.etapasCliente.fixed ?? []).map(stage => {
    const row = saved.find(item => item.concepto === stage.key);
    return [stage.label, estadoEtapa(row?.estado) || CELDA, a(row?.condicion)];
  });
  return [{ kind: "table", zona: { keys: ["etapasCliente"], label: OPINION_TABLES.etapasCliente.label }, widths: [3, 2, 6], header: ["Etapa", "Estado", "Condición"], rows }];
}

function documentos(d: Data): Block[] {
  const rows = filas(d, "documentosRevisados").filter(row => a(row.documento));
  return [
    { kind: "table", zona: { keys: ["documentosRevisados", "documentos"], label: OPINION_TABLES.documentosRevisados.label }, widths: [8, 3], header: ["Documento", "Estado"],
      rows: rows.length ? rows.map(row => [a(row.documento), estadoDocumento(row.estado)]) : [[CELDA, CELDA]] },
    ...prosa(d, "documentos", false, true),
  ];
}

export function opinionJuridicaDocumento(d: Data): Documento {
  const corte = d.fechaEmision ? fecha(d.fechaEmision) : LINEA;
  const resultado = resultadoOpinion(d.resultado);
  const blocks: Block[] = [
    { kind: "title", text: "Opinión jurídica del inmueble", bold: true },
    { kind: "caption", text: "Factibilidad para comercialización y cierre notarial" },
    { kind: "fields", zona: { keys: ["destinatario", "inmueble", "operacion", "fechaEmision"], label: "Destinatario, inmueble y fecha" }, dark: true, widths: [2200, 8024], rows: [["Destinatario", a(d.destinatario) || LINEA], ["Inmueble", a(d.inmueble) || LINEA], ["Operación y etapa", a(d.operacion) || LINEA], ["Fecha de corte", corte]] },
    { kind: "numbered", num: "01", text: "Conclusión" },
    { kind: "fields", zona: { keys: ["resultado"], label: etiqueta("resultado") }, widths: [2200, 8024], rows: [["Resultado", resultado || LINEA]] },
    ...prosa(d, "conclusion", true),
    ...prosa(d, "sustento"),
    { kind: "numbered", num: "02", text: "Objeto y alcance del análisis" },
    ...prosa(d, "objeto"),
    ...prosa(d, "alcance"),
    { kind: "p", indent: true, text: "Los puntos que requieran certificación registral, intervención notarial, cálculo fiscal o revisión física se identifican como pendientes cuando afecten la conclusión." },
    { kind: "numbered", num: "03", text: "Antecedentes" },
    ...antecedentes(d),
    { kind: "numbered", num: "04", text: "Marco jurídico" },
    ...prosa(d, "marcoJuridico"),
    { kind: "numbered", num: "05", text: "Análisis jurídico" },
    { kind: "h2", text: "Titularidad y facultades para disponer" },
    ...prosa(d, "titularidad"),
    { kind: "h2", text: "Situación registral e identidad del inmueble" },
    ...prosa(d, "registro"),
    { kind: "h2", text: "Impedimentos y condiciones de la operación" },
    ...prosa(d, "impedimentos"),
    { kind: "numbered", num: "06", text: "Condiciones por etapa y recomendaciones" },
    ...etapas(d),
    ...prosa(d, "recomendaciones"),
    ...prosa(d, "responsables"),
    { kind: "numbered", num: "07", text: "Documentos revisados" },
    ...documentos(d),
    { kind: "numbered", num: "08", text: "Vigencia y límites de la opinión" },
    { kind: "p", indent: true, text: `Esta opinión tiene fecha de corte ${corte}. Las condiciones pendientes continúan hasta que su cumplimiento quede acreditado.` },
    ...prosa(d, "actualizacion"),
    ...prosa(d, "limites"),
    { kind: "signatures", zona: { keys: ["abogado", "cedula"], label: "Abogado responsable" }, parties: [{ role: "Abogado responsable", name: [a(d.abogado) || LINEA, d.cedula ? `Cédula profesional ${a(d.cedula)}` : ""].filter(Boolean).join("\n") }] },
  ];
  return { title: "Opinión jurídica del inmueble", subject: `Formato 06 · ${a(d.folio)}`, estilo: "opinion", blocks };
}
