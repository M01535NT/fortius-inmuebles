import { TIPOS_INMUEBLE, tipoInmueble } from "@/lib/inmueble-tipos";
import type { LevantamientoId } from "./levantamiento";

/*
  Checklist de documentos del propietario (decisión del titular, 16/10/2026): se arma
  con lo que dijo en la entrevista inicial (02) y usa los códigos del control documental
  de la revisión jurídica (05), para que el dictamen parta de lo ya recibido.
  COR-06 (29/10/2026), con las listas B-06 y B-07 aprobadas el 26/10/2026: la lista es preliminar
  y revisable. Usa solo datos que la entrevista captura; lo que depende de un dato que no se
  pregunta queda «por confirmar» con su pregunta, y se resuelve con un clic («Sí aplica» o
  «No aplica»). Cada documento admite «No aplica» con motivo, que cuenta como completo; también
  se pueden agregar otros (D22).
*/

type Data = Record<string, unknown>;
/** Un documento de la lista; si `porConfirmar` trae una pregunta, aún no se sabe si aplica. */
export type ChecklistItem = { id: string; texto: string; porConfirmar?: string };
/** Un renglón guardado: recibido (`hecho`), «No aplica» con su motivo o pendiente. */
/** `aplica` guarda que el asesor respondió «Sí» a la pregunta; `archivoId`, el documento del cliente que lo cubre. */
export type PasoChecklist = { id: string; texto: string; hecho: boolean; noAplica?: string; porConfirmar?: string; aplica?: boolean; archivoId?: string };

const is = (data: Data, key: string, ...values: string[]) => values.includes(String(data[key] ?? ""));
const sinAcentos = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type Municipio = "tijuana" | "rosarito" | "ensenada" | "tecate";
/** Municipio del domicilio escrito en la entrevista (Fortius trabaja en estos cuatro, titular 26/10/2026). */
export function municipioDe(domicilio: unknown): Municipio | undefined {
  const texto = sinAcentos(String(domicilio ?? ""));
  return (["rosarito", "ensenada", "tecate", "tijuana"] as const).find(m => texto.includes(m));
}
const AGUA: Record<Municipio, string> = {
  tijuana: "Constancia de no adeudo de la CESPT y estado de cuenta del agua",
  rosarito: "Constancia de no adeudo de la CESPT y estado de cuenta del agua",
  ensenada: "Constancia de la CESPE (deslinde reciente y cuenta sin adeudo)",
  tecate: "Certificado de libertad de gravamen de la CESPTE y estado de cuenta del agua",
};
const ACREEDOR: Record<string, string> = { banco: "del banco", infonavit: "del Infonavit", fovissste: "del Fovissste", otro: "del acreedor" };

/** Si aplica: sí, no o la pregunta que falta responder (con el motivo que se anota si no aplica). */
type Regla = boolean | { pregunta: string; siNo: string };
const pregunta = (texto: string, siNo: string): Regla => ({ pregunta: texto, siNo });
const tipo = (data: Data) => tipoInmueble(data.tipoInmueble);

const DOCUMENTS: Array<{ code: string; label: string | ((data: Data) => string); when?: (data: Data) => Regla }> = [
  { code: "D01", label: "Escritura o título de propiedad inscrito en el Registro Público" },
  { code: "D02", label: "Boleta de inscripción en el Registro Público" },
  { code: "D03", label: "Certificado de inscripción con o sin gravámenes del Registro Público" },
  { code: "D05", label: d => tipo(d) === "terreno" ? "Deslinde catastral certificado por catastro y clave catastral" : "Plano o clave catastral" },
  { code: "D06", label: "Recibo de predial al corriente" },
  { code: "D07", label: d => { const m = municipioDe(d.inmueble); return m ? AGUA[m] : "Constancia de no adeudo del agua (CESPT, CESPE o CESPTE, según el municipio) y estado de cuenta"; },
    when: d => tipo(d) === "terreno" ? pregunta("¿El terreno tiene toma de agua?", "El terreno no tiene toma de agua") : true },
  { code: "D08", label: "Comprobante de domicilio del propietario" },
  { code: "D09", label: "Identificación oficial vigente de cada propietario" },
  { code: "D10", label: "CURP de cada propietario" },
  { code: "D11", label: "Constancia de situación fiscal (RFC)" },
  { code: "D12", label: "Acta de matrimonio y, en su caso, capitulaciones",
    when: d => is(d, "estadoCivilActual", "casado") || is(d, "estadoCivilAdquisicion", "casado") || (is(d, "estadoCivilActual", "otro") && pregunta("¿Estaba casado cuando adquirió el inmueble?", "No estaba casado al adquirirlo")) },
  { code: "D13", label: "Acta de divorcio, liquidación o defunción", when: d => is(d, "estadoCivilActual", "divorciado", "viudo") || is(d, "cambioEstadoCivil", "si") },
  { code: "D14", label: "Poder notarial del representante", when: d => is(d, "representacion", "si") || is(d, "relacion", "representante") },
  { code: "D15", label: "Acta constitutiva y poderes de la empresa", when: d => is(d, "tipoPropietario", "moral") },
  { code: "D16", label: "Documentos de la sucesión o adjudicación",
    when: d => is(d, "adquisicion", "herencia", "adjudicacion") || is(d, "relacion", "heredero") || (!!d.relacion && pregunta("¿Lo recibió por herencia o adjudicación?", "No lo recibió por herencia ni adjudicación")) },
  { code: "D17", label: d => `Carta ${ACREEDOR[String(d.gravamen)] ?? "del acreedor"} con el saldo y la instrucción de cancelación de la hipoteca`,
    when: d => is(d, "gravamen", "banco", "infonavit", "fovissste", "otro") || (is(d, "gravamen", "no_sabe") && pregunta("¿Tiene hipoteca o crédito sobre el inmueble?", "No tiene hipoteca ni crédito")) },
  { code: "D18", label: d => is(d, "ocupacion", "inquilino") ? "Contrato de arrendamiento vigente" : "Contrato de arrendamiento, promesa u otro compromiso sobre el inmueble",
    when: d => is(d, "ocupacion", "inquilino") || is(d, "acuerdoOcupacion", "si") || is(d, "promesaPrevia", "si") || (!!d.ocupacion && pregunta("¿Hay contrato de renta, promesa u otro compromiso sobre el inmueble?", "No hay contratos ni compromisos sobre el inmueble")) },
  { code: "D19", label: "Constancia de no adeudo de cuotas del condominio y reglamento",
    when: d => ["departamento", "plaza"].includes(tipo(d) ?? "") || (["casa", "terreno", "local", "oficina"].includes(tipo(d) ?? "") && pregunta("¿Está en un condominio o fraccionamiento con cuotas?", "No está en condominio")) },
  { code: "D20", label: "Dictamen de uso de suelo o constancia de zonificación, y licencia de construcción", when: d => ["local", "nave-industrial", "plaza", "oficina"].includes(tipo(d) ?? "") },
  { code: "D21", label: "Constancia de no adeudo del INDIVI", when: d => ["casa", "terreno"].includes(tipo(d) ?? "") && pregunta("¿El inmueble viene del INDIVI?", "No viene del INDIVI") },
];
const POR_CODIGO = new Map(DOCUMENTS.map(doc => [doc.code, doc]));

/** Documentos que se le piden al propietario según su entrevista inicial. */
export function checklistFor(entrevista: Data): ChecklistItem[] {
  return DOCUMENTS.flatMap(doc => {
    const regla = doc.when ? doc.when(entrevista) : true;
    if (!regla) return [];
    const label = typeof doc.label === "function" ? doc.label(entrevista) : doc.label;
    return [{ id: doc.code, texto: `${doc.code} · ${label}`, ...(typeof regla === "object" ? { porConfirmar: regla.pregunta } : {}) }];
  });
}
/** Motivo que se anota al responder «No» a la pregunta de un documento por confirmar. */
export function motivoNoAplica(entrevista: Data, id: string): string {
  const regla = POR_CODIGO.get(id)?.when?.(entrevista);
  return typeof regla === "object" ? regla.siNo : "No aplica a esta operación";
}

/** Un renglón está listo si se recibió o si no aplica con su motivo (COR-06). */
export const pasoCompleto = (paso: Pick<PasoChecklist, "hecho" | "noAplica">) => paso.hecho === true || !!paso.noAplica?.trim();
export const checklistCompleto = <T extends Pick<PasoChecklist, "hecho" | "noAplica">>(pasos: readonly T[] | undefined) => !!pasos && pasos.length > 0 && pasos.every(pasoCompleto);
const esAgregado = (id: string) => !POR_CODIGO.has(id);

/**
  Rehace la lista con la entrevista vigente sin perder lo ya hecho: conserva lo recibido, lo que
  no aplica y lo agregado a mano; actualiza el texto y la pregunta de lo pendiente; agrega lo nuevo
  y quita lo pendiente que ya no corresponde.
*/
export function actualizarChecklist(pasos: PasoChecklist[], sugeridos: ChecklistItem[]): PasoChecklist[] {
  const actuales = new Map(pasos.map(paso => [paso.id, paso]));
  const lista: PasoChecklist[] = sugeridos.map(item => {
    const paso = actuales.get(item.id);
    if (!paso) return { ...item, hecho: false };
    if (pasoCompleto(paso)) return paso;
    const pendiente: PasoChecklist = { ...paso, texto: item.texto };
    if (item.porConfirmar && !paso.aplica) pendiente.porConfirmar = item.porConfirmar; else delete pendiente.porConfirmar;
    return pendiente;
  });
  const sugeridosIds = new Set(sugeridos.map(item => item.id));
  for (const paso of pasos) if (!sugeridosIds.has(paso.id) && (esAgregado(paso.id) || pasoCompleto(paso))) lista.push(paso);
  return lista;
}
/** Si la entrevista cambió lo que corresponde pedir. */
export function checklistDesactualizado(pasos: PasoChecklist[], sugeridos: ChecklistItem[]): boolean {
  return JSON.stringify(actualizarChecklist(pasos, sugeridos)) !== JSON.stringify(pasos);
}

/** Tipo de documento reconocido en «Documentos del cliente» → renglones de la lista que puede cubrir. */
export const CODIGOS_POR_TIPO_DOCUMENTO: Record<string, string[]> = {
  escritura: ["D01"], certificado_gravamenes: ["D03"], identificacion: ["D09"], curp: ["D10"], rfc: ["D11"],
  poder: ["D14"], acta: ["D12", "D13", "D15"], predial: ["D06"], agua: ["D07"], comprobante_domicilio: ["D08"],
};

export const checklistTaskId = (expedienteId: string) => `checklist-${expedienteId}`;
/** Formato de levantamiento que corresponde al tipo de inmueble de la entrevista. */
export function levantamientoFor(tipo: unknown): LevantamientoId {
  // Si el tipo todavía no se sabe, la operación propone casa y el asesor elige el levantamiento antes de iniciarlo.
  const key = tipoInmueble(tipo);
  return (TIPOS_INMUEBLE.find(item => item.key === key)?.levantamiento ?? "04B") as LevantamientoId;
}
