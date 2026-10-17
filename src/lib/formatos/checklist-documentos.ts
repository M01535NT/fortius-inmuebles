import type { LevantamientoId } from "./levantamiento";

/*
  Checklist de documentos del propietario (decisión del titular, 16/10/2026): se arma
  con lo que dijo en la entrevista inicial (02) y usa los códigos del control documental
  de la revisión jurídica (05), para que el dictamen parta de lo ya recibido.
*/

type Data = Record<string, unknown>;
export type ChecklistItem = { id: string; texto: string };
const is = (data: Data, key: string, ...values: string[]) => values.includes(String(data[key] ?? ""));

const DOCUMENTS: Array<{ code: string; label: string; when?: (data: Data) => boolean }> = [
  { code: "D01", label: "Escritura o título de propiedad" },
  { code: "D02", label: "Boleta de inscripción en el Registro Público" },
  { code: "D03", label: "Certificado de libertad de gravamen" },
  { code: "D05", label: "Plano o clave catastral" },
  { code: "D06", label: "Recibo de predial al corriente" },
  { code: "D07", label: "Recibo de agua (CESPT) y estado de cuenta" },
  { code: "D08", label: "Comprobante de domicilio del propietario" },
  { code: "D09", label: "Identificación oficial de cada propietario" },
  { code: "D10", label: "CURP de cada propietario" },
  { code: "D11", label: "Constancia de situación fiscal (RFC)" },
  { code: "D12", label: "Acta de matrimonio y, en su caso, capitulaciones", when: d => is(d, "estadoCivilActual", "casado") || is(d, "estadoCivilAdquisicion", "casado") },
  { code: "D13", label: "Acta de divorcio, liquidación o defunción", when: d => is(d, "estadoCivilActual", "divorciado", "viudo") || is(d, "cambioEstadoCivil", "si") },
  { code: "D14", label: "Poder notarial del representante", when: d => is(d, "representacion", "si") || is(d, "relacion", "representante") },
  { code: "D15", label: "Acta constitutiva y poderes de la empresa", when: d => is(d, "tipoPropietario", "moral") },
  { code: "D16", label: "Documentos de la sucesión o adjudicación", when: d => is(d, "adquisicion", "herencia", "adjudicacion") || is(d, "relacion", "heredero") },
  { code: "D17", label: "Estado de cuenta del crédito o carta de no adeudo", when: d => !is(d, "gravamen", "no", "") },
  { code: "D18", label: "Contrato de arrendamiento u otros compromisos", when: d => is(d, "ocupacion", "inquilino") || is(d, "acuerdoOcupacion", "si") || is(d, "promesaPrevia", "si") },
  { code: "D19", label: "Reglamento de condominio y constancia de no adeudo de cuotas", when: d => is(d, "tipoInmueble", "departamento", "plaza") },
  { code: "D20", label: "Licencias de uso de suelo o de construcción", when: d => is(d, "tipoInmueble", "local", "nave", "plaza", "oficina") },
];

/** Documentos que se le piden al propietario según su entrevista inicial. */
export function checklistFor(entrevista: Data): ChecklistItem[] {
  return DOCUMENTS.filter(doc => !doc.when || doc.when(entrevista)).map(doc => ({ id: doc.code, texto: `${doc.code} · ${doc.label}` }));
}
export const checklistTaskId = (expedienteId: string) => `checklist-${expedienteId}`;
/** Formato de levantamiento que corresponde al tipo de inmueble de la entrevista. */
export function levantamientoFor(tipo: unknown): LevantamientoId {
  const map: Record<string, LevantamientoId> = { terreno: "04A", casa: "04B", departamento: "04C", oficina: "04D", local: "04E", nave: "04F", "nave-industrial": "04F", plaza: "04G" };
  return map[String(tipo ?? "")] ?? "04B";
}
