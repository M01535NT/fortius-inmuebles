import { TIPO_INMUEBLE_KEYS } from "@/lib/inmueble-tipos";
import Decimal from "decimal.js";
import type { Property } from "@/data/propiedades";
import type { AppInput, AppResult } from "./types";

export type CommercialRow = Record<string, unknown>;
export const COMPARABLE_COLUMNS = ["label", "type", "operation", "source", "date", "currency", "areaBasis", "area", "price", "evidence", "adjustmentPct", "adjustmentReason"] as const;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const required = (value: unknown, label: string) => { const result = text(value); if (!result) throw new Error(`Falta ${label}.`); return result; };
function number(value: unknown, label: string, min = 0, max = 1e12) {
  if ((typeof value !== "number" && typeof value !== "string") || value === "" || (typeof value === "string" && !value.trim())) throw new Error(`Captura ${label}; desconocido no equivale a cero.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max) throw new Error(`${label}: valor fuera de rango (${min} a ${max}).`);
  return result;
}
function choice(value: unknown, options: readonly string[], label: string) { const result = text(value); if (!options.includes(result)) throw new Error(`Selecciona ${label}.`); return result; }
function date(value: unknown, label: string) {
  const result = required(value, label); const parsed = new Date(result + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result || result.startsWith("0000")) throw new Error(`${label}: fecha inválida.`);
  return result;
}
const currency = (value: unknown) => choice(value, ["MXN", "USD"], "moneda MXN o USD");
const round = (value: Decimal.Value) => new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const money = (value: Decimal.Value, unit: string) => { const [integer, fraction] = round(value).toFixed(2).split("."); return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction} ${unit}`; };
export function commercialRows(input: AppInput, key = "rows"): CommercialRow[] {
  const values = input[key];
  if (values === undefined) return [];
  if (!Array.isArray(values)) throw new Error(`La colección ${key} debe ser una lista de filas.`);
  if (values.length > 200) throw new Error(`La colección ${key} admite hasta 200 filas.`);
  return values.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`La fila ${index + 1} de ${key} es inválida. La captura se conserva sin cambios.`);
    return row as CommercialRow;
  });
}
function checkedRows(input: AppInput, key = "rows", minimum = 1) {
  if (!Array.isArray(input[key])) throw new Error(`La colección ${key} debe ser una lista de filas.`);
  const rows = commercialRows(input, key);
  if (rows.length < minimum) throw new Error(`Captura entre ${minimum} y 200 filas.`);
  return rows;
}
const summary = (label: string, value: string | number) => ({ label, value: String(value) });
/** Calendar-only sources stay unchanged; instants use the business timezone, including DST. */
export function commercialCalendarDate(value: string | Date = new Date()): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return date(value, "Fecha de fuente");
  if (typeof value === "string" && !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) throw new Error("La fecha de origen debe incluir zona horaria.");
  const instant = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error("Fecha de origen inválida.");
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (kind: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === kind)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function getCommercialDefaults(slug: string): AppInput {
  const localToday = commercialCalendarDate();
  switch (slug) {
    case "ficha-comercial": return { propertySlug: "", title: "", location: "", operation: "venta", propertyType: "casa", priceMode: "consulta", price: "", currency: "MXN", terrain: "", construction: "", areaSource: "", description: "", amenities: "", contact: "", photoUrls: [], publicConfirmed: false };
    case "comparables": return { rows: [], analysis: "", csvDraft: "" };
    case "ofertas": return { rows: [], recommendation: "" };
    case "informe-propietario": return { ownerLabel: "", from: localToday.slice(0, 7) + "-01", to: localToday, rows: [], nextSteps: "", conclusion: "" };
    case "cotizador": return { client: "", currency: "MXN", issuedAt: localToday, validUntil: "", items: [], terms: "" };
    case "revisor-expediente": return { checklistVersion: "1", asOf: localToday, operation: "venta", propertyType: "casa", reviewer: "", rows: [{ name: "Identificación de las partes", required: true, fileRef: "", reviewed: false, expires: "", finding: "" }, { name: "Documento de titularidad o derecho", required: true, fileRef: "", reviewed: false, expires: "", finding: "" }, { name: "Autorización del servicio", required: true, fileRef: "", reviewed: false, expires: "", finding: "" }] };
    default: throw new Error("Herramienta comercial no disponible.");
  }
}
export function isCommercialPhotoUrl(value: string): boolean {
  if (!value || /[\s\\]/.test(value) || value.startsWith("//")) return false;
  try {
    const url = new URL(value, "https://fortius.invalid");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    let decoded = url.href;
    for (let i = 0; i < 3; i++) { const next = decodeURIComponent(decoded); if (next === decoded) break; decoded = next; }
    return !/([a-z0-9-]+-(?:private|staging)|\/api\/admin(?:\/|\?|$)|\/storage\/v1\/object\/sign\/)/i.test(decoded);
  } catch { return false; }
}
export function publicPropertyInput(property: Property): AppInput {
  const canUsePhotos = property.publicada === true && !property.demo;
  return { ...getCommercialDefaults("ficha-comercial"), propertySlug: property.slug, title: property.titulo, location: [property.zona, property.direccionAproximada].filter(Boolean).join(" · "), operation: property.operacion, propertyType: property.tipo, priceMode: property.precio.modalidad, price: property.precio.modalidad === "publico" ? property.precio.monto : "", currency: property.precio.modalidad === "publico" ? property.precio.moneda : "MXN", terrain: property.ficha.terrenoM2 ?? "", construction: property.ficha.construccionM2 ?? "", bedrooms: property.ficha.recamaras ?? "", bathrooms: property.ficha.banos ?? "", parking: property.ficha.estacionamientos ?? "", areaSource: [property.informacionPublica?.fuenteTerreno, property.informacionPublica?.fuenteConstruccion].filter(Boolean).join(" / "), description: property.descripcion.join("\n\n"), amenities: property.amenidades.join("\n"), photoUrls: canUsePhotos ? property.galeria.map(p => p.src).filter(isCommercialPhotoUrl).slice(0, 20) : [] };
}
function comparable(row: CommercialRow) {
  const value = { label: required(row.label, "identificación del comparable"), type: choice(row.type, TIPO_INMUEBLE_KEYS, "tipo de inmueble"), operation: choice(row.operation, ["venta", "renta"], "operación"), source: required(row.source, "fuente"), date: date(row.date, "Fecha de fuente"), currency: currency(row.currency), areaBasis: choice(row.areaBasis, ["terreno", "construccion"], "base de superficie"), area: number(row.area, "Superficie", 0.01), price: number(row.price, "Precio", 0.01), evidence: choice(row.evidence, ["oferta", "cierre"], "naturaleza del precio"), adjustmentPct: number(row.adjustmentPct, "Ajuste porcentual", -99.99, 1000), adjustmentReason: text(row.adjustmentReason) };
  if (value.adjustmentPct !== 0 && !value.adjustmentReason) throw new Error("Documenta el motivo de cada ajuste distinto de cero.");
  return value;
}
/** RFC 4180-style comma CSV. Validation is a preview; callers explicitly accept the whole batch. */
export function parseComparablesCsv(source: string): { rows: CommercialRow[]; errors: string[] } {
  if (source.length > 1_000_000) return { rows: [], errors: ["El CSV excede 1 MB de texto."] };
  const grid: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false; let closed = false;
  const input = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) { if (char === '"') { if (input[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += char; }
    else if (char === '"') { if (cell || closed) return { rows: [], errors: ["Comillas inválidas en CSV."] }; quoted = true; }
    else if (char === "," || char === "\n") { row.push(cell); cell = ""; closed = false; if (char === "\n") { grid.push(row); row = []; } }
    else { if (closed) return { rows: [], errors: ["Texto inesperado después de comillas de cierre."] }; cell += char; }
  }
  if (quoted) return { rows: [], errors: ["CSV con comillas sin cerrar."] };
  if (cell || row.length || closed) { row.push(cell); grid.push(row); }
  const headers = grid.shift()?.map(value => value.trim()) ?? [];
  const missing = COMPARABLE_COLUMNS.filter(column => !headers.includes(column));
  if (missing.length || new Set(headers).size !== headers.length) return { rows: [], errors: [`Encabezados faltantes o repetidos: ${missing.join(", ")}. Usa la plantilla CSV.`] };
  if (!grid.length || grid.length > 200) return { rows: [], errors: ["El CSV debe tener entre 1 y 200 comparables."] };
  const rows: CommercialRow[] = []; const errors: string[] = [];
  grid.forEach((values, index) => {
    if (values.length !== headers.length) { errors.push(`Fila ${index + 2}: número de columnas incorrecto.`); return; }
    const record = Object.fromEntries(headers.map((key, i) => [key, values[i]]));
    try { rows.push(comparable(record)); } catch (error) { errors.push(`Fila ${index + 2}: ${error instanceof Error ? error.message : "datos inválidos"}`); }
  });
  return { rows, errors };
}
function calculateComparables(input: AppInput): AppResult {
  const rows = checkedRows(input).map(comparable); const groups = new Map<string, typeof rows>();
  rows.forEach(row => { const key = [row.currency, row.operation, row.type, row.areaBasis, row.evidence].join(" · "); groups.set(key, [...(groups.get(key) ?? []), row]); });
  return { title: "Análisis de comparables", summary: [summary("Observaciones", rows.length), summary("Grupos comparables", groups.size)], sections: [...Array.from(groups, ([key, group]) => {
    const units = group.map(row => new Decimal(row.price).div(row.area).mul(new Decimal(1).plus(new Decimal(row.adjustmentPct).div(100)))).sort((a, b) => a.comparedTo(b));
    const middle = Math.floor(units.length / 2); const median = units.length % 2 ? units[middle] : units[middle - 1].plus(units[middle]).div(2); const unit = group[0].currency + "/m²";
    return { title: `Muestra: ${key}`, text: `Rango observado ajustado: ${money(units[0], unit)} a ${money(units[units.length - 1], unit)}. Mediana descriptiva: ${money(median, unit)}. ${group.length} observación(es); no constituye una estimación automática de valor.`, columns: ["Comparable", "Fuente y fecha", "Precio", "Superficie", "Unitario", "Ajuste y sustento", "Unitario ajustado"], rows: group.map(row => [row.label, `${row.source} · ${row.date}`, money(row.price, row.currency), `${row.area} m² (${row.areaBasis})`, money(new Decimal(row.price).div(row.area), unit), `${row.adjustmentPct}% · ${row.adjustmentReason || "Sin ajuste"}`, money(new Decimal(row.price).div(row.area).mul(new Decimal(1).plus(new Decimal(row.adjustmentPct).div(100))), unit)]) };
  }), { title: "Lectura del asesor", text: text(input.analysis) || "Pendiente de interpretación del asesor." }], warnings: ["Los precios de oferta no acreditan cierres. Las referencias de cierre requieren soporte documental.", "Se separan moneda, operación, tipo, base de superficie y naturaleza del precio. No se convierten divisas ni se pondera evidencia automáticamente.", "Los decimales muestran el cálculo aritmético; no expresan certeza sobre el valor de mercado."] };
}
function calculateQuote(input: AppInput): AppResult {
  const client = required(input.client, "destinatario"); const unit = currency(input.currency); const issuedAt = date(input.issuedAt, "Emisión"); const validUntil = date(input.validUntil, "Vigencia");
  if (validUntil < issuedAt) throw new Error("La vigencia no puede ser anterior a la emisión.");
  let subtotal = new Decimal(0), discount = new Decimal(0), taxes = new Decimal(0), total = new Decimal(0);
  const rows = checkedRows(input, "items").map(row => {
    const concept = required(row.concept, "concepto"); const category = choice(row.category, ["servicios", "honorarios", "gastos"], "categoría"); const quantity = number(row.quantity, "Cantidad", 0.001, 1e6); const price = number(row.unitPrice, "Precio unitario", 0, 1e9); const disc = number(row.discountPct, "Descuento", 0, 100); const tax = number(row.taxPct, "Impuesto", 0, 100);
    if (new Decimal(row.unitPrice as string | number).decimalPlaces() > 2) throw new Error("Precio unitario: captura como máximo dos decimales; no se admiten fracciones de centavo.");
    const gross = round(new Decimal(quantity).mul(price)); const reduction = round(gross.mul(disc).div(100)); const net = gross.minus(reduction); const charge = round(net.mul(tax).div(100)); const line = net.plus(charge);
    subtotal = subtotal.plus(gross); discount = discount.plus(reduction); taxes = taxes.plus(charge); total = total.plus(line);
    return [concept, category, String(quantity), money(price, unit), `${disc}% · ${money(reduction, unit)}`, `${tax}% · ${money(charge, unit)}`, money(line, unit)];
  });
  return { title: "Cotización de servicios", summary: [summary("Para", client), summary("Emisión", issuedAt), summary("Válida hasta", validUntil), summary("Subtotal", money(subtotal, unit)), summary("Descuentos", money(discount, unit)), summary("Impuestos capturados", money(taxes, unit)), summary("Total", money(total, unit))], sections: [{ title: "Partidas", columns: ["Concepto", "Categoría", "Cantidad", "Unitario", "Descuento", "Impuesto", "Importe"], rows }, { title: "Condiciones", text: text(input.terms) || "Condiciones pendientes de acordar." }], warnings: ["Cotización informativa. No constituye CFDI ni contrato.", "Tasas y conceptos de impuestos capturados por el asesor; deben confirmarse para el servicio concreto. Redondeo por partida a dos decimales."] };
}
function calculateOffers(input: AppInput): AppResult {
  const rows = checkedRows(input).map(row => {
    const name = required(row.name, "referencia de la oferta"); const unit = currency(row.currency); const price = number(row.price, "Precio ofertado", 0.01); const deposit = number(row.deposit, "Anticipo", 0, price); const days = number(row.days, "Plazo en días", 0, 3650);
    if (!Number.isInteger(days)) throw new Error("El plazo debe ser un número entero de días.");
    const known = (value: unknown) => value !== "" && value !== undefined && value !== null;
    const expenses = known(row.expenses) ? number(row.expenses, "Gastos pendientes") : null; const debt = known(row.creditBalance) ? number(row.creditBalance, "Saldo de crédito") : null;
    return [name, money(price, unit), money(deposit, unit), expenses === null || debt === null ? "Pendiente: gastos o saldo desconocido" : money(new Decimal(price).minus(expenses).minus(debt), unit), `${days} días`, text(row.financing) || "Pendiente", text(row.paymentSchedule) || "Pendiente", text(row.conditions) || "Sin condiciones capturadas", expenses === null ? "Gastos pendientes" : `Gastos ${money(expenses, unit)}`, debt === null ? "Saldo pendiente" : `Saldo ${money(debt, unit)}`];
  });
  return { title: "Comparación de ofertas", summary: [summary("Ofertas", rows.length), summary("Decisión", "A cargo del propietario y asesor")], sections: [{ title: "Condiciones comparadas", columns: ["Referencia", "Precio", "Anticipo incluido en precio", "Neto preliminar", "Plazo", "Financiamiento", "Calendario de pagos", "Condiciones", "Gastos", "Crédito"], rows }, { title: "Recomendación del asesor", text: text(input.recommendation) || "Pendiente de recomendación humana." }], warnings: ["El neto resta únicamente gastos pendientes y saldo de crédito capturados. Confirma que los gastos incluyan honorarios e impuestos aplicables.", "No se elige una oferta automáticamente. Revisa soporte de pago, condiciones y fechas; precios en distintas monedas no son directamente comparables."] };
}
function calculateSheet(input: AppInput): AppResult {
  const title = required(input.title, "título"); const location = required(input.location, "ubicación publicable"); const contact = required(input.contact, "contacto comercial");
  if (input.publicConfirmed !== true) throw new Error("Confirma que la información está autorizada para uso comercial.");
  const mode = choice(input.priceMode, ["publico", "consulta"], "modalidad del precio"); const operation = choice(input.operation, ["venta", "renta"], "operación");
  const data: string[][] = [];
  for (const [key, label] of [["terrain", "Terreno (m²)"], ["construction", "Construcción (m²)"], ["bedrooms", "Recámaras"], ["bathrooms", "Baños"], ["parking", "Estacionamientos"]]) if (input[key] !== "" && input[key] !== undefined) data.push([label, String(number(input[key], label))]);
  return { title, summary: [summary("Operación", operation), summary("Ubicación", location), summary("Precio", mode === "publico" ? money(number(input.price, "Precio", 0.01), currency(input.currency)) + (operation === "renta" ? " / mes" : "") : "Consultar"), summary("Contacto", contact)], sections: [{ title: "Descripción", text: required(input.description, "descripción") }, { title: "Características", columns: ["Concepto", "Dato"], rows: [...data, ["Fuente de superficies", text(input.areaSource) || "Pendiente de confirmar"]] }, { title: "Amenidades", text: text(input.amenities) || "Sin amenidades adicionales capturadas." }], warnings: ["Disponibilidad, precio y características sujetos a confirmación. Superficies según la fuente indicada."] };
}
function calculateReport(input: AppInput): AppResult {
  const from = date(input.from, "Inicio del periodo"), to = date(input.to, "Fin del periodo"); if (to < from) throw new Error("El fin del periodo debe ser igual o posterior al inicio.");
  const rows = checkedRows(input, "rows", 0).map(row => ({ date: date(row.date, "Fecha de actividad"), kind: choice(row.kind, ["actividad", "visita", "oferta"], "tipo de actividad"), detail: required(row.detail, "detalle de actividad"), origin: choice(row.origin, ["registrado", "manual"], "origen") })).filter(row => row.date >= from && row.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  return { title: "Informe al propietario", summary: [summary("Destinatario", required(input.ownerLabel, "destinatario")), summary("Periodo", `${from} a ${to}`), summary("Visitas documentadas", rows.filter(r => r.kind === "visita").length), summary("Ofertas documentadas", rows.filter(r => r.kind === "oferta").length), summary("Actividades incluidas", rows.length)], sections: [{ title: "Actividad del periodo", columns: ["Fecha", "Tipo", "Descripción", "Origen"], rows: rows.map(r => [r.date, r.kind, r.detail, r.origin]) }, { title: "Balance del periodo", text: text(input.conclusion) || "Sin balance adicional capturado." }, { title: "Próximos pasos", text: required(input.nextSteps, "próximos pasos") }], warnings: ["Las cifras corresponden únicamente a las actividades incluidas en este informe; ausencia de registros no acredita ausencia de actividad.", "«Registrado» viene de la operación; «manual», de lo que capturó el asesor. Revisa qué compartes y si es confidencial antes de enviarlo."] };
}
function calculateReview(input: AppInput): AppResult {
  const asOf = date(input.asOf, "Fecha de revisión"); const version = required(input.checklistVersion, "versión de lista");
  let missing = 0, pending = 0, expired = 0, findings = 0;
  const rows = checkedRows(input).map(row => {
    const name = required(row.name, "requisito"), file = text(row.fileRef), finding = text(row.finding); const expires = text(row.expires) ? date(row.expires, "Vencimiento") : "";
    if (row.reviewed === true && !file) throw new Error(`No marques revisado «${name}» sin referencia a un archivo o evidencia.`);
    const status: string[] = [];
    if (!file) { status.push(row.required === true ? "Faltante" : "No recibido (opcional)"); if (row.required === true) missing++; }
    if (file && row.reviewed !== true) { status.push("Sin revisar"); pending++; }
    if (file && row.reviewed === true) status.push("Revisado por usuario");
    if (expires && expires < asOf) { status.push("Vencido"); expired++; }
    if (finding) { status.push("Hallazgo pendiente"); findings++; }
    return [name, row.required === true ? "Requerido" : "Opcional", file || "Sin archivo", expires || "No indicada", status.join(" · "), finding || "Sin hallazgo capturado"];
  });
  return { title: "Revisión documental de la operación", summary: [summary("Lista", `Versión ${version} · ${text(input.operation)} · ${text(input.propertyType)}`), summary("Fecha", asOf), summary("Revisor", text(input.reviewer) || "Pendiente"), summary("Faltantes", missing), summary("Sin revisar", pending), summary("Vencidos", expired), summary("Hallazgos pendientes", findings)], sections: [{ title: "Control de documentos", columns: ["Requisito", "Aplicabilidad", "Archivo / versión", "Vence", "Estado", "Hallazgo"], rows }], warnings: ["Lista operativa editable, sujeta a revisión humana. No certifica validez documental ni sustituye un dictamen jurídico.", "Recibir un archivo no acredita su autenticidad, vigencia o suficiencia. Confirmar requisitos aplicables al caso y registrar una nueva versión de la lista cuando cambien."] };
}
export function calculateCommercial(slug: string, input: AppInput): AppResult {
  switch (slug) { case "ficha-comercial": return calculateSheet(input); case "comparables": return calculateComparables(input); case "ofertas": return calculateOffers(input); case "informe-propietario": return calculateReport(input); case "cotizador": return calculateQuote(input); case "revisor-expediente": return calculateReview(input); default: throw new Error("Herramienta comercial no disponible."); }
}
