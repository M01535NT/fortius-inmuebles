import Decimal from "decimal.js";
import type { FormatoField } from "./catalog";
import { PROMESA_ORIGINAL } from "./promesa-text";
import { formatAmount } from "@/lib/finance/money";

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text"): FormatoField => ({ section, key, label, type, required: true });
const choice = (section: string, key: string, label: string, options: string[][]): FormatoField => ({ ...field(section, key, label, "choice"), options: options.map(([value, label]) => ({ value, label })) });
const yesNo = [["si", "Sí"], ["no", "No"]];
const reviewed = [["revisada", "Revisada y compatible"], ["pendiente", "Pendiente"], ["bloqueada", "Con impedimento"]];
const s = ["01 / Alcance y modelo", "02 / Parte vendedora", "03 / Parte compradora", "04 / Inmueble y anexos", "05 / Precio y pagos", "06 / Condiciones y financiamiento", "07 / Documentación y formalización", "08 / Entrega y gastos", "09 / Garantía y remedios", "10 / Revisión profesional"];
export const promesaFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"), field(s[0], "versionContrato", "Versión del contrato", "number"), field(s[0], "lugar", "Lugar de celebración"), field(s[0], "fecha", "Fecha de la promesa", "date"),
  choice(s[0], "entidad", "Entidad de la operación", [["BC", "Baja California"], ["otra", "Otra entidad"]]),
  choice(s[0], "calidadVendedor", "Calidad de la parte vendedora", [["particular", "Particular en venta ocasional"], ["proveedor", "Proveedor o comercializador"], ["pendiente", "Por determinar"]]),
  choice(s[0], "destino", "Destino del inmueble", [["vivienda", "Vivienda"], ["terreno_vivienda", "Terreno destinado a vivienda"], ["comercial", "Comercial"], ["industrial", "Industrial"], ["otro", "Otro"], ["pendiente", "Por determinar"]]),
  choice(s[0], "negociacion", "Forma de acordar los términos", [["individual", "Negociados individualmente"], ["adhesion", "Condiciones uniformes del proveedor"], ["pendiente", "Por determinar"]]),
  choice(s[0], "marcoConsumo", "Aplicabilidad de protección al consumidor", [["no_aplica", "No aplica, con fundamento revisado"], ["aplica", "Aplica"], ["pendiente", "Por determinar"]]),
  field(s[0], "fundamentoAlcance", "Hechos y fundamento de la clasificación", "long"),
  choice(s[0], "derechoTipo", "Tipo de derecho que se promete vender", [["pleno_dominio", "Pleno dominio documentado"], ["otro", "Otro derecho: requiere adaptar el modelo"]]),
  ...["Vendedor", "Comprador"].flatMap((suffix, index) => {
    const section = s[index + 1]; const lower = suffix.toLowerCase();
    return [field(section, lower, `Nombre completo de la parte ${index ? "compradora" : "vendedora"}`),
      choice(section, `comparece${suffix}`, `Comparecencia del ${lower}`, [["propia", "Por propio derecho"], ["representante", "Por representante"]]),
      field(section, `representante${suffix}`, `Representante ${lower}`), field(section, `documentoRepresentacion${suffix}`, `Documento de representación del ${lower}`, "long"),
      field(section, `identificacion${suffix}`, `Identificación del ${lower}`), field(section, `rfc${suffix}`, `RFC del ${lower}`),
      field(section, `estadoCivil${suffix}`, `Estado civil del ${lower}`), field(section, `regimen${suffix}`, `Régimen patrimonial del ${lower} o no aplica`),
      field(section, `domicilio${suffix}`, `Domicilio del ${lower}`, "long"), field(section, `correo${suffix}`, `Correo del ${lower}`),
      ...(index === 0 ? [field(section, "consentimientosVendedor", "Consentimientos necesarios y soportes, o fundamento de no aplicación", "long")] : [])];
  }),
  field(s[2], "documentosExhibidos", "Documentos recibidos por el comprador", "long"), field(s[2], "estadoFisico", "Estado físico informado", "long"), field(s[2], "limitacionesInformadas", "Limitaciones informadas", "long"),
  field(s[3], "derechoObjeto", "Descripción del derecho objeto", "long"), field(s[3], "inmueble", "Domicilio del inmueble", "long"), field(s[3], "descripcionRegistral", "Descripción registral", "long"),
  field(s[3], "superficie", "Superficie y concepto según título"), field(s[3], "colindancias", "Colindancias según título", "long"), field(s[3], "claveCatastral", "Clave catastral"),
  field(s[3], "titulo", "Título de propiedad"), field(s[3], "inscripcion", "Inscripción registral"), field(s[3], "situacionRevelada", "Gravámenes, adeudos y ocupación revelados", "long"), field(s[3], "soportes", "Soportes de la situación revelada", "long"),
  field(s[3], "accesorios", "Accesorios incluidos o ninguno", "long"), field(s[3], "exclusiones", "Exclusiones o ninguna", "long"), field(s[3], "anexos", "Anexos a firmar con el contrato", "promesaRows"),
  field(s[4], "precio", "Precio", "money"), choice(s[4], "moneda", "Moneda del precio, garantía y pena", [["MXN", "MXN"], ["USD", "USD"]]),
  field(s[4], "tratamientoFiscal", "Tratamiento fiscal del precio", "long"), choice(s[4], "conversion", "¿Hay conversión de moneda?", yesNo), field(s[4], "reglaConversion", "Regla de conversión pactada", "long"),
  field(s[4], "recursosPropios", "Recursos propios previstos", "money"), field(s[4], "credito", "Crédito previsto", "money"), field(s[4], "pagosPrecio", "Pagos del precio al formalizar", "promesaRows"),
  field(s[5], "fechaCondiciones", "Fecha límite de condiciones", "date"), field(s[5], "condiciones", "Condiciones de formalización", "promesaRows"),
  choice(s[5], "condicionCredito", "¿La obligación depende del crédito?", yesNo), field(s[5], "institucionCredito", "Institución de crédito"), field(s[5], "estadoCredito", "Estado del crédito y soporte", "long"), field(s[5], "fechaSolicitud", "Fecha límite de solicitud de crédito", "date"),
  field(s[6], "documentosVendedor", "Documentos que entregará el vendedor a la notaría", "promesaRows"), field(s[6], "mecanismoGravamenes", "Liquidación y cancelación de cargas, o no aplica con motivo", "long"),
  field(s[6], "fechaLimite", "Fecha límite del contrato definitivo", "date"), field(s[6], "fechaFormalizacion", "Fecha de formalización", "date"), field(s[6], "horaFormalizacion", "Hora de formalización", "time"),
  field(s[6], "notaria", "Notaría acordada"), field(s[6], "domicilioNotaria", "Domicilio de la notaría", "long"), field(s[6], "diasConvocatoria", "Días naturales de anticipación de convocatoria", "number"),
  field(s[7], "fechaEntrega", "Fecha de entrega prevista", "date"), field(s[7], "condicionesPosesion", "Condiciones de posesión al entregar", "long"),
  field(s[7], "gastosVendedor", "Gastos a cargo del vendedor", "long"), field(s[7], "gastosComprador", "Gastos a cargo del comprador", "long"), field(s[7], "pactoAdeudos", "Pacto sobre adeudos anteriores, o ninguno", "long"),
  field(s[8], "garantia", "Garantía acordada, cero si no se pacta", "money"), field(s[8], "fechaGarantia", "Fecha de entrega de la garantía", "date"), field(s[8], "receptorGarantia", "Receptor de la garantía"), field(s[8], "cuentaGarantia", "Cuenta de la garantía"),
  choice(s[8], "custodioTipo", "Calidad del receptor de la garantía", [["parte", "Parte vendedora"], ["tercero", "Tercero con acuerdo independiente"], ["inmobiliaria", "Inmobiliaria: este modelo no autoriza custodia"]]), field(s[8], "acuerdoCustodia", "Acuerdo independiente y aceptación del tercero", "long"),
  field(s[8], "pena", "Pena recíproca, cero si no se pacta", "money"), field(s[8], "diasSubsanacion", "Días naturales para subsanar", "number"), field(s[8], "diasAviso", "Días naturales para avisar fuerza mayor", "number"), field(s[8], "diasDevolucion", "Días naturales para devolver la garantía", "number"),
  choice(s[9], "identidadEstado", "Revisión de identidad", reviewed), choice(s[9], "titularidadEstado", "Revisión de titularidad", reviewed), choice(s[9], "facultadesEstado", "Revisión de facultades y consentimientos", reviewed),
  choice(s[9], "anexosEstado", "Revisión de las copias de anexos", [["revisados", "Revisados y compatibles"], ["pendiente", "Pendiente"]]),
  field(s[9], "abogado", "Abogado responsable de la revisión"), field(s[9], "cedula", "Cédula profesional del revisor"), field(s[9], "fechaRevision", "Fecha de revisión", "date"), field(s[9], "referenciaRevision", "Referencia y versión de la revisión jurídica"), field(s[9], "conclusionRevision", "Conclusión de revisión de este modelo y sus términos", "long"),
];

export type PromesaRow = Record<string, string | number>;
export const PROMESA_TABLES = {
  pagosPrecio: { label: "pago del precio", columns: [{ key: "importe", label: "Importe", type: "number" }, { key: "fecha", label: "Fecha al formalizar", type: "date" }, { key: "medio", label: "Medio de pago", type: "text" }, { key: "beneficiario", label: "Beneficiario", type: "text" }, { key: "cuenta", label: "Cuenta o instrucciones de pago", type: "text" }] },
  condiciones: { label: "condición", columns: [{ key: "condicion", label: "Condición", type: "text" }, { key: "responsable", label: "Responsable", type: "text" }, { key: "evidencia", label: "Evidencia de cumplimiento requerida", type: "text" }] },
  documentosVendedor: { label: "documento del vendedor", columns: [{ key: "documento", label: "Documento", type: "text" }, { key: "fecha", label: "Fecha límite de entrega", type: "date" }] },
  anexos: { label: "anexo", columns: [{ key: "documento", label: "Documento", type: "text" }, { key: "version", label: "Versión", type: "text" }, { key: "referencia", label: "Referencia de la copia revisada", type: "text" }] },
} as const;
export type PromesaTable = keyof typeof PROMESA_TABLES;

export function mostrarCampoPromesa(key: string, data: Record<string, unknown>): boolean {
  for (const suffix of ["Vendedor", "Comprador"]) if ([`representante${suffix}`, `documentoRepresentacion${suffix}`].includes(key)) return data[`comparece${suffix}`] === "representante";
  if (["institucionCredito", "estadoCredito"].includes(key)) return typeof data.credito === "number" && data.credito > 0;
  if (key === "fechaSolicitud") return data.condicionCredito === "si";
  if (key === "reglaConversion") return data.conversion === "si";
  if (["fechaGarantia", "receptorGarantia", "cuentaGarantia", "custodioTipo"].includes(key)) return typeof data.garantia === "number" && data.garantia > 0;
  if (key === "acuerdoCustodia") return typeof data.garantia === "number" && data.garantia > 0 && data.custodioTipo === "tercero";
  return true;
}

const text = (value: unknown) => typeof value === "string" && value.trim().length > 0 && !/[\[\]<>]|\bpendiente\b|por definir|por confirmar/i.test(value);
const amount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 999999999.99 && new Decimal(value).decimalPlaces() <= 2;
const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const rows = (value: unknown): PromesaRow[] | null => Array.isArray(value) && value.every((row) => row && typeof row === "object" && !Array.isArray(row)) ? value : null;

export function promesaReviewSnapshot(data: Record<string, unknown>): string {
  const normalize = (value: unknown): unknown => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, normalize(entry)])) : value;
  return JSON.stringify(normalize(Object.fromEntries(Object.entries(data).filter(([key]) => !["revisionEstado", "revisionDatos", "versionRevisada"].includes(key)))));
}

export function validarPromesa(data: Record<string, unknown>, review = true): string[] {
  const errors = promesaFields.filter((field) => field.type !== "promesaRows" && mostrarCampoPromesa(field.key, data) && !["money", "number", "date", "time", "choice"].includes(field.type) && !text(data[field.key])).map((field) => field.label);
  for (const field of promesaFields.filter((field) => mostrarCampoPromesa(field.key, data))) {
    const value = data[field.key];
    if (field.type === "choice" && !field.options?.some((option) => option.value === value) || field.type === "date" && !date(value) || field.type === "time" && (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) errors.push(field.label);
  }
  if (data.entidad !== "BC" || data.derechoTipo !== "pleno_dominio") errors.push("Este modelo requiere Baja California y pleno dominio documentado");
  if (data.marcoConsumo !== "no_aplica" || data.negociacion !== "individual" || data.calidadVendedor === "pendiente" || data.destino === "pendiente" || data.calidadVendedor === "proveedor" && ["vivienda", "terreno_vivienda"].includes(String(data.destino))) errors.push("Se requiere el modelo registrado aplicable; la plantilla civil 15 no habilita esta operación");
  if (["calidadVendedor", "destino", "negociacion", "marcoConsumo"].some((key) => data[key] === "pendiente")) errors.push("Resolver la clasificación de la operación antes de usar este modelo");
  for (const key of ["precio", "garantia", "pena", "recursosPropios", "credito"]) if (!amount(data[key]) || key === "precio" && data[key] === 0) errors.push(`${key}: importe válido con hasta dos decimales`);
  if (amount(data.precio) && amount(data.pena) && data.pena > data.precio) errors.push("La pena no puede superar el precio");
  if (amount(data.precio) && amount(data.garantia) && data.garantia > data.precio) errors.push("La garantía no puede superar el precio");
  if (amount(data.precio) && amount(data.recursosPropios) && amount(data.credito) && !new Decimal(data.recursosPropios as number).add(data.credito as number).equals(data.precio as number)) errors.push("Recursos propios y crédito deben sumar el precio");
  if (data.condicionCredito === "si" && !(typeof data.credito === "number" && data.credito > 0)) errors.push("Una condición de crédito exige crédito previsto positivo");
  if (data.condicionCredito === "si" && (!date(data.fechaSolicitud) || !date(data.fecha) || !date(data.fechaCondiciones) || data.fechaSolicitud < data.fecha || data.fechaSolicitud > data.fechaCondiciones)) errors.push("Fecha límite de solicitud de crédito");
  for (const suffix of ["Vendedor", "Comprador"]) if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data[`correo${suffix}`] ?? ""))) errors.push(`Correo del ${suffix.toLowerCase()}`);
  if (date(data.fecha) && date(data.fechaFormalizacion) && date(data.fechaLimite) && (data.fechaFormalizacion <= data.fecha || data.fechaFormalizacion > data.fechaLimite)) errors.push("La formalización debe ser posterior a la promesa y no exceder su fecha límite");
  if (date(data.fecha) && date(data.fechaCondiciones) && date(data.fechaFormalizacion) && (data.fechaCondiciones < data.fecha || data.fechaCondiciones > data.fechaFormalizacion)) errors.push("Las condiciones deben vencer entre la firma de la promesa y la formalización");
  if (date(data.fechaEntrega) && date(data.fechaFormalizacion) && data.fechaEntrega < data.fechaFormalizacion) errors.push("La entrega no puede preceder a la formalización");
  for (const key of ["diasConvocatoria", "diasSubsanacion", "diasAviso", "diasDevolucion"]) if (!Number.isInteger(data[key]) || (data[key] as number) < 1 || (data[key] as number) > 365) errors.push(`${key}: días naturales enteros entre 1 y 365`);
  if (date(data.fecha) && date(data.fechaFormalizacion) && (new Date(`${data.fechaFormalizacion}T00:00:00Z`).getTime() - new Date(`${data.fecha}T00:00:00Z`).getTime()) / 86400000 < (data.diasConvocatoria as number)) errors.push("La convocatoria no cabe entre la promesa y la formalización");
  if (typeof data.garantia === "number" && data.garantia > 0) {
    if (!date(data.fechaGarantia) || !date(data.fecha) || !date(data.fechaFormalizacion) || data.fechaGarantia < data.fecha || data.fechaGarantia > data.fechaFormalizacion) errors.push("Fecha de garantía entre promesa y formalización");
    if (data.custodioTipo === "inmobiliaria" || !["parte", "tercero"].includes(String(data.custodioTipo))) errors.push("Este contrato no autoriza a la inmobiliaria a custodiar la garantía");
    if (data.custodioTipo === "parte" && String(data.receptorGarantia).trim() !== String(data.vendedor).trim()) errors.push("El receptor debe ser la parte vendedora o un tercero con acuerdo independiente");
  }
  for (const [key, config] of Object.entries(PROMESA_TABLES)) {
    const entries = rows(data[key]);
    if (!entries || entries.length < 1 || entries.length > 30) { errors.push(`${config.label}: registro obligatorio de 1 a 30 filas`); continue; }
    for (const entry of entries) if (config.columns.some((column) => column.type === "number" ? !amount(entry[column.key]) || entry[column.key] === 0 : column.type === "date" ? !date(entry[column.key]) : !text(entry[column.key]))) errors.push(`${config.label}: fila incompleta o inválida`);
    if (key === "pagosPrecio") {
      if (entries.every((entry) => amount(entry.importe)) && amount(data.precio) && !entries.reduce((sum, entry) => sum.add(entry.importe), new Decimal(0)).equals(data.precio as number)) errors.push("El calendario de pagos debe sumar el precio sin descontar la garantía");
      if (entries.some((entry) => entry.fecha !== data.fechaFormalizacion)) errors.push("Los pagos del precio deben pactarse en la fecha de formalización");
    }
    if (key === "documentosVendedor" && entries.some((entry) => date(entry.fecha) && date(data.fecha) && date(data.fechaFormalizacion) && (entry.fecha < data.fecha || entry.fecha > data.fechaFormalizacion))) errors.push("Los documentos deben entregarse entre promesa y formalización");
    if (key === "anexos" && new Set(entries.map((entry) => `${String(entry.documento).trim().toLowerCase()}|${String(entry.referencia).trim().toLowerCase()}`)).size !== entries.length) errors.push("Anexo duplicado");
  }
  if (!["identidadEstado", "titularidadEstado", "facultadesEstado"].every((key) => data[key] === "revisada") || data.anexosEstado !== "revisados") errors.push("Resolver identidad, titularidad, facultades y copias de anexos antes de emitir");
  if (!Number.isInteger(data.versionContrato) || (data.versionContrato as number) < 1) errors.push("Versión del contrato positiva");
  if (!date(data.fechaRevision) || !date(data.fecha) || data.fechaRevision > data.fecha) errors.push("Fecha de revisión válida no posterior a la promesa");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (date(data.fechaRevision) && data.fechaRevision > today) errors.push("La revisión no puede fecharse en el futuro");
  if (review && (data.revisionEstado !== "revisada" || data.versionRevisada !== data.versionContrato || data.revisionDatos !== promesaReviewSnapshot(data))) errors.push("Registrar revisión de esta versión y sus datos");
  return [...new Set(errors)];
}

function enteroLetra(value: number): string {
  const small = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const apocope = (word: string) => word.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
  if (value < 30) return small[value];
  if (value < 100) return ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"][Math.floor(value / 10)] + (value % 10 ? ` y ${small[value % 10]}` : "");
  if (value === 100) return "cien";
  if (value < 1000) return ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"][Math.floor(value / 100)] + (value % 100 ? ` ${enteroLetra(value % 100)}` : "");
  if (value < 1000000) return (Math.floor(value / 1000) === 1 ? "mil" : `${apocope(enteroLetra(Math.floor(value / 1000)))} mil`) + (value % 1000 ? ` ${enteroLetra(value % 1000)}` : "");
  return (Math.floor(value / 1000000) === 1 ? "un millón" : `${apocope(enteroLetra(Math.floor(value / 1000000)))} millones`) + (value % 1000000 ? ` ${enteroLetra(value % 1000000)}` : "");
}

export function importePromesaLetra(value: number, currency: string): string {
  if (!amount(value) || !["MXN", "USD"].includes(currency)) throw new Error("Importe o moneda inválidos");
  const integer = Math.floor(value); const cents = new Decimal(value).minus(integer).mul(100).toFixed(0);
  const words = enteroLetra(integer).replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
  const unit = currency === "MXN" ? integer === 1 ? "peso" : "pesos" : integer === 1 ? "dólar" : "dólares";
  return `${words}${integer > 0 && integer % 1000000 === 0 ? " de" : ""} ${unit} ${cents.padStart(2, "0")}/100 ${currency}`;
}

export function promesaParagraphs(data: Record<string, unknown>): string[] {
  const v = (key: string) => String(data[key] ?? "").trim();
  const day = (key: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${v(key)}T00:00:00Z`));
  const cash = (key: string) => formatAmount(data[key] as number);
  const letters = (key: string) => importePromesaLetra(data[key] as number, v("moneda"));
  const list = (key: string, format: (row: PromesaRow) => string) => (rows(data[key]) ?? []).map((row, index) => `${index + 1}) ${format(row)}`).join("; ");
  const rowDay = (value: unknown) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${String(value)}T00:00:00Z`));
  const represent = (suffix: string) => data[`comparece${suffix}`] === "propia" ? "por propio derecho" : `por conducto de ${v(`representante${suffix}`)}, conforme a ${v(`documentoRepresentacion${suffix}`)}`;
  const replacements: Record<string, string> = {
    VENDEDOR: v("vendedor"), COMPRADOR: v("comprador"), "REPRESENTACIÓN VENDEDORA": represent("Vendedor"), "REPRESENTACIÓN COMPRADORA": represent("Comprador"), LUGAR: v("lugar"), FECHA: day("fecha"),
    "IDENTIFICACIÓN Y RFC VENDEDOR": `${v("identificacionVendedor")}; RFC ${v("rfcVendedor")}`, "IDENTIFICACIÓN Y RFC COMPRADOR": `${v("identificacionComprador")}; RFC ${v("rfcComprador")}`,
    "RÉGIMEN VENDEDOR": `${v("estadoCivilVendedor")}; ${v("regimenVendedor")}`, "RÉGIMEN COMPRADOR": `${v("estadoCivilComprador")}; ${v("regimenComprador")}`,
    "CONSENTIMIENTOS Y FACULTADES": `${v("consentimientosVendedor")}${data.compareceVendedor === "representante" ? `; ${v("documentoRepresentacionVendedor")}` : ""}`,
    "DOMICILIO VENDEDOR": v("domicilioVendedor"), "CORREO VENDEDOR": v("correoVendedor"), "DOMICILIO COMPRADOR": v("domicilioComprador"), "CORREO COMPRADOR": v("correoComprador"),
    "DERECHO OBJETO": v("derechoObjeto"), "DOMICILIO INMUEBLE": v("inmueble"), "DESCRIPCIÓN REGISTRAL, SUPERFICIE Y COLINDANCIAS": `${v("descripcionRegistral")}; superficie: ${v("superficie")}; colindancias: ${v("colindancias")}`,
    "CLAVE CATASTRAL": v("claveCatastral"), "TÍTULO": v("titulo"), "INSCRIPCIÓN": v("inscripcion"), "SITUACIÓN REVELADA": v("situacionRevelada"), SOPORTES: v("soportes"),
    "DOCUMENTOS EXHIBIDOS": v("documentosExhibidos"), "ESTADO FÍSICO Y LIMITACIONES INFORMADAS": `${v("estadoFisico")}; límites: ${v("limitacionesInformadas")}`,
    "RECURSOS PROPIOS Y FINANCIAMIENTO": `${cash("recursosPropios")} ${v("moneda")} de recursos propios y ${cash("credito")} ${v("moneda")} de crédito`, "ESTADO DEL CRÉDITO": (data.credito as number) > 0 ? v("estadoCredito") : "no se prevé crédito",
    "ANEXOS INCORPORADOS": list("anexos", (row) => `${row.documento}, versión ${row.version}, ${row.referencia}`), "ACCESORIOS INCLUIDOS": v("accesorios"), EXCLUSIONES: v("exclusiones"), "FECHA LÍMITE": day("fechaLimite"),
    "PRECIO NÚMERO": cash("precio"), MONEDA: v("moneda"), "PRECIO LETRA": letters("precio"), "TRATAMIENTO FISCAL": v("tratamientoFiscal"), "REGLA DE CONVERSIÓN": data.conversion === "si" ? v("reglaConversion") : "el pago en la moneda pactada, sin conversión",
    "CALENDARIO, IMPORTES, MEDIO Y BENEFICIARIO DE PAGO": list("pagosPrecio", (row) => `${formatAmount(row.importe as number)} ${v("moneda")} el ${rowDay(row.fecha)}, por ${row.medio}, a ${row.beneficiario}, ${row.cuenta}`),
    "FECHA CONDICIONES": day("fechaCondiciones"), "CONDICIONES, RESPONSABLES Y EVIDENCIA": list("condiciones", (row) => `${row.condicion}; responsable: ${row.responsable}; evidencia: ${row.evidencia}`),
    INSTITUCIÓN: v("institucionCredito"), "FECHA SOLICITUD": data.condicionCredito === "si" ? day("fechaSolicitud") : "no aplica",
    "DOCUMENTOS Y FECHA DE ENTREGA": list("documentosVendedor", (row) => `${row.documento}, a más tardar el ${rowDay(row.fecha)}`), "MECANISMO DE LIQUIDACIÓN Y CANCELACIÓN": v("mecanismoGravamenes"),
    "NOTARÍA Y DOMICILIO": `${v("notaria")}, ${v("domicilioNotaria")}`, "FECHA Y HORA": `el ${day("fechaFormalizacion")} a las ${v("horaFormalizacion")}`, "DÍAS DE CONVOCATORIA": v("diasConvocatoria"),
    "FECHA ENTREGA": day("fechaEntrega"), "CONDICIONES DE POSESIÓN": v("condicionesPosesion"), "GASTOS VENDEDOR": v("gastosVendedor"), "GASTOS COMPRADOR": v("gastosComprador"), "PACTO SOBRE ADEUDOS": v("pactoAdeudos"),
    "GARANTÍA NÚMERO": cash("garantia"), "GARANTÍA LETRA": letters("garantia"), "FECHA GARANTÍA": (data.garantia as number) > 0 ? `el ${day("fechaGarantia")}` : "no aplica", "RECEPTOR Y CUENTA": `${v("receptorGarantia")}, ${v("cuentaGarantia")}${data.custodioTipo === "tercero" ? `, conforme a ${v("acuerdoCustodia")}` : ""}`,
    "DÍAS SUBSANACIÓN": v("diasSubsanacion"), "PENA NÚMERO": cash("pena"), "PENA LETRA": letters("pena"), "DÍAS AVISO": v("diasAviso"), "DÍAS DEVOLUCIÓN": v("diasDevolucion"),
    "REPRESENTANTE VENDEDOR": data.compareceVendedor === "representante" ? `Representante: ${v("representanteVendedor")}` : "Por propio derecho", "REPRESENTANTE COMPRADOR": data.compareceComprador === "representante" ? `Representante: ${v("representanteComprador")}` : "Por propio derecho",
  };
  return PROMESA_ORIGINAL.map((paragraph) => {
    if (paragraph.startsWith("Si se pactó condición de crédito,")) paragraph = data.condicionCredito === "si" ? paragraph.replace("Si se pactó condición de crédito,", "Se pacta condición de crédito:").replace(" Si no se pactó condición de crédito, obtenerlo no condiciona la comparecencia.", "") : "No se pacta condición de crédito. Obtener financiamiento no condiciona la obligación de comparecer a la firma. La PARTE COMPRADORA aportará los recursos y atenderá los requisitos que le correspondan dentro del plazo pactado.";
    if (paragraph.startsWith("La garantía pactada es") && data.garantia === 0) paragraph = "No se pacta entrega ni custodia de garantía. La firma de esta promesa no acredita recepción de fondos. La inmobiliaria no asume la custodia de fondos por este contrato.";
    return paragraph.replace(/\[([^\]]+)\]/g, (_, key: string) => { if (!(key in replacements)) throw new Error(`Marcador de promesa sin correspondencia: ${key}`); return replacements[key]; });
  });
}
