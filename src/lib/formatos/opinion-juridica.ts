import { JURIDICA_TABLES, type JuridicaRow } from "./juridica";

/*
  06 · Opinión jurídica del inmueble (DOC-06, 12/11/2026). No hay plantilla del titular para el 06;
  el titular aprobó este diseño ese día. Se entrega al cliente: toma de la revisión 05 (interna)
  solo la conclusión, el estado de cada etapa y la lista de documentos con su estado (D-10). Nunca
  copia folios, escrituras, expedientes, acreedores, hallazgos ni las notas internas de la 05.
*/

type Column = { key: string; label: string; options?: readonly { value: string; label: string }[]; type?: "date" };
const select = (values: readonly [string, string][]) => values.map(([value, label]) => ({ value, label }));

/** Los cinco resultados de la conclusión de la 05 (sección 10 de su plantilla). */
export const RESULTADOS_OPINION = select([
  ["factible", "Factible"], ["condiciones", "Factible con condiciones"], ["no_factible_temporal", "No factible temporalmente"],
  ["no_recomendable", "No recomendable"], ["indeterminada", "Indeterminada por falta de evidencia"],
]);
const ESTADO_ETAPA = select([["avanza", "Puede avanzar"], ["condicionado", "Condicionado"], ["bloqueado", "Bloqueado"], ["pendiente", "Pendiente"], ["no_aplica", "No aplica"]]);
const ESTADO_DOCUMENTO = select([["recibido", "Recibido"], ["insuficiente", "Insuficiente"], ["verificado", "Verificado"]]);

export type OpinionTable = "antecedentesTabla" | "etapasCliente" | "documentosRevisados";
export const OPINION_TABLES: Record<OpinionTable, { label: string; columns: readonly Column[]; fixed?: { key: string; label: string }[]; min?: number }> = {
  antecedentesTabla: { label: "Antecedentes", columns: [{ key: "acto", label: "Acto o documento" }, { key: "fecha", label: "Fecha" }, { key: "acredita", label: "Qué acredita" }] },
  etapasCliente: { label: "Condiciones por etapa", fixed: JURIDICA_TABLES.etapas.fixed, columns: [{ key: "estado", label: "Estado", options: ESTADO_ETAPA }, { key: "condicion", label: "Condición, en palabras para el cliente" }] },
  documentosRevisados: { label: "Documentos revisados", columns: [{ key: "documento", label: "Documento" }, { key: "estado", label: "Estado", options: ESTADO_DOCUMENTO }] },
};

const label = (options: readonly { value: string; label: string }[], value: unknown) => options.find(option => option.value === value)?.label ?? "";
export const resultadoOpinion = (value: unknown) => label(RESULTADOS_OPINION, value);
export const estadoEtapa = (value: unknown) => label(ESTADO_ETAPA, value);
export const estadoDocumento = (value: unknown) => label(ESTADO_DOCUMENTO, value);

/**
  Lo que el 06 toma de la revisión 05 al empezar: el resultado, el estado de cada etapa (la condición
  la redacta el abogado) y los documentos que aplican y se recibieron, solo con nombre y estado.
*/
export function semillaOpinion(revision?: Record<string, unknown>): Record<string, unknown> {
  if (!revision) return {};
  const seed: Record<string, unknown> = {};
  if (RESULTADOS_OPINION.some(option => option.value === revision.resultado)) seed.resultado = revision.resultado;
  const etapas = Array.isArray(revision.etapas) ? revision.etapas as JuridicaRow[] : [];
  if (etapas.length) seed.etapasCliente = (OPINION_TABLES.etapasCliente.fixed ?? []).map(stage => {
    const estado = etapas.find(row => row?.concepto === stage.key)?.estado;
    return { concepto: stage.key, ...(ESTADO_ETAPA.some(option => option.value === estado) ? { estado } : {}) };
  });
  const documentos = Array.isArray(revision.documentos) ? revision.documentos as JuridicaRow[] : [];
  const revisados = (JURIDICA_TABLES.documentos.fixed ?? []).flatMap(doc => {
    const row = documentos.find(item => item?.concepto === doc.key);
    return row?.aplica === "si" && ESTADO_DOCUMENTO.some(option => option.value === row.estado) ? [{ documento: doc.label, estado: row.estado }] : [];
  });
  if (revisados.length) seed.documentosRevisados = revisados;
  return seed;
}
