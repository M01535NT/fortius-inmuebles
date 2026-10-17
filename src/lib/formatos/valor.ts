import Decimal from "decimal.js";

/*
  Cálculos de la opinión de valor 07, con las mismas fórmulas de la plantilla del titular
  (07_OpinionValor.xlsx). No bloquean nada: cada enfoque se calcula cuando tiene lo que
  necesita y `pendientes` dice qué falta para cada resultado, solo como aviso.
*/

export type ValorRow = Record<string, unknown>;
const number = (v: unknown, positive = false): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && (!positive || v > 0) && v <= 1e12;
const rows = (v: unknown): ValorRow[] => Array.isArray(v) ? v.filter((row): row is ValorRow => !!row && typeof row === "object" && !Array.isArray(row)) : [];
const d = (v: number) => new Decimal(v);
/** Compara sin mayúsculas ni acentos, para aceptar también capturas anteriores («construccion»). */
const same = (value: unknown, expected: string) => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === expected.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Un factor vacío vale 1: la plantilla indica que 1 significa «sin ajuste». */
const factor = (v: unknown) => number(v, true) ? v : 1;

/** Coeficientes de Heidecke de la plantilla («8. Físico», tabla de conservación, estados 1 a 6). */
export const HEIDECKE = [0, 0.0252, 0.181, 0.526, 0.752, 1] as const;
export const CONSTRUCTION_STATES = ["Óptimo / nuevo", "Bueno, reparaciones menores", "Regular, reparaciones simples", "Malo, reparaciones importantes", "Muy malo, reparaciones mayores", "Ruinoso, sin valor de construcción"];

/** Superficie base del sujeto según la base de mercado elegida («4. Inmueble», Q16). */
export function superficieBase(data: ValorRow): number | null {
  const key = same(data.baseMercado, "Terreno") ? "terreno" : same(data.baseMercado, "Construcción") ? "construccion" : same(data.baseMercado, "Privativa") ? "privativa" : null;
  return key && number(data[key], true) ? data[key] : null;
}

export type ComparableCalculado = { index: number; precioMxn: number; unitario: number; factor: number; homologado: number };
/** Tabla de comparables (hojas 5, 6 y 7): precio en MXN, $/m², factor resultante y $/m² homologado. Media con tres o más. */
export function calcularComparables(input: unknown, data: ValorRow) {
  const calculated: ComparableCalculado[] = [];
  for (const [index, row] of rows(input).entries()) {
    if (!number(row.precio, true) || !number(row.superficie, true)) continue;
    const usd = row.moneda === "USD";
    if (usd && !number(data.tipoCambio, true)) continue;
    const precio = d(row.precio).mul(usd ? data.tipoCambio as number : 1);
    const f = d(factor(row.fZona)).mul(factor(row.fUbicacion)).mul(factor(row.fSuperficie)).mul(factor(row.fNegociacion));
    const unitario = precio.div(row.superficie);
    calculated.push({ index, precioMxn: precio.toNumber(), unitario: unitario.toNumber(), factor: f.toNumber(), homologado: unitario.mul(f).toNumber() });
  }
  const media = calculated.length >= 3 ? calculated.reduce((sum, row) => sum.add(row.homologado), new Decimal(0)).div(calculated.length).toNumber() : null;
  const desviacion = media !== null && calculated.length > 1 ? Math.sqrt(calculated.reduce((sum, row) => sum + (row.homologado - media) ** 2, 0) / (calculated.length - 1)) : null;
  return { rows: calculated, media, desviacion, variacion: desviacion !== null && media ? desviacion / media : null };
}

/** Una construcción del enfoque físico: Ross-Heidecke sin valor de rescate, como la plantilla. */
export function calcularConstruccion(row: ValorRow) {
  const empty = { ross: null, heidecke: null, neto: null, unitarioNeto: null, parcial: null };
  if (!number(row.edad) || !number(row.vidaUtil, true) || row.edad > row.vidaUtil) return empty;
  const ratio = d(row.edad).div(row.vidaUtil);
  const ross = ratio.add(ratio.pow(2)).div(2);
  const heidecke = Number.isInteger(row.estado) && (row.estado as number) >= 1 && (row.estado as number) <= 6 ? HEIDECKE[(row.estado as number) - 1] : null;
  if (heidecke === null) return { ...empty, ross: ross.toNumber() };
  const neto = new Decimal(1).sub(ross).mul(new Decimal(1).sub(heidecke));
  const unitarioNeto = number(row.costoNuevo, true) ? d(row.costoNuevo).mul(neto) : null;
  const parcial = unitarioNeto && number(row.superficie, true) && String(row.id ?? "").trim() ? unitarioNeto.mul(row.superficie).toNumber() : null;
  return { ross: ross.toNumber(), heidecke, neto: neto.toNumber(), unitarioNeto: unitarioNeto?.toNumber() ?? null, parcial };
}

export function calcularValor(data: ValorRow) {
  const pendientes: string[] = [];
  const base = superficieBase(data);
  const terrain = same(data.baseMercado, "Terreno");
  const terreno = calcularComparables(data.comparablesTerreno, data);
  const construido = calcularComparables(data.comparablesConstruccion, data);
  const renta = calcularComparables(data.comparablesRenta, data);
  if (base === null) pendientes.push("Elige la base de mercado y captura su superficie");

  // Hoja 5: valor de mercado del terreno = superficie del terreno × valor unitario × factor adicional.
  const valorTerreno = number(data.terreno, true) && terreno.media !== null ? d(data.terreno).mul(terreno.media).mul(factor(data.factorTerreno)).toNumber() : null;
  // Hoja 6: valor por mercado = base del sujeto × valor unitario × factor adicional (no aplica con base terreno).
  const valorConstruido = !terrain && base !== null && construido.media !== null ? d(base).mul(construido.media).mul(factor(data.factorMercado)).toNumber() : null;
  const mercado = terrain ? valorTerreno : valorConstruido;

  // Hoja 7: renta mensual, deducciones y capitalización.
  let ingresos: { mensual: number; bruto: number; perdida: number; efectivo: number; gastos: number; noi: number; valor: number | null } | null = null;
  if (base !== null && renta.media !== null && number(data.vacanciaPct) && data.vacanciaPct < 100 && number(data.gastosPct) && data.gastosPct < 100) {
    const mensual = d(base).mul(renta.media), bruto = mensual.mul(12), perdida = bruto.mul(data.vacanciaPct).div(100);
    const efectivo = bruto.sub(perdida), gastos = efectivo.mul(data.gastosPct).div(100), noi = efectivo.sub(gastos);
    const valor = number(data.tasaCapPct, true) && data.tasaCapPct < 100 ? noi.div(d(data.tasaCapPct).div(100)).toNumber() : null;
    ingresos = { mensual: mensual.toNumber(), bruto: bruto.toNumber(), perdida: perdida.toNumber(), efectivo: efectivo.toNumber(), gastos: gastos.toNumber(), noi: noi.toNumber(), valor };
  }

  // Hoja 8: terreno (A) + construcciones (B) + obras complementarias (C).
  const partes = rows(data.construcciones).map(calcularConstruccion);
  const construcciones = partes.some((part) => part.parcial !== null) ? partes.reduce((sum, part) => sum.add(part.parcial ?? 0), new Decimal(0)).toNumber() : null;
  const obras = rows(data.obras).reduce((sum, row) => number(row.cantidad, true) && number(row.costoNuevo, true) && number(row.factorConservacion) && row.factorConservacion <= 1 ? sum.add(d(row.cantidad).mul(row.costoNuevo).mul(row.factorConservacion)) : sum, new Decimal(0)).toNumber();
  const fisico = valorTerreno !== null && construcciones !== null ? { terreno: valorTerreno, construccion: construcciones, obras, valor: valorTerreno + construcciones + obras } : null;

  // Hoja 9: ponderación (los pesos deben sumar 100 %) y redondeo.
  const pesos = [[data.pesoMercado, mercado, "mercado"], [data.pesoIngresos, ingresos?.valor ?? null, "ingresos"], [data.pesoFisico, fisico?.valor ?? null, "físico"]] as const;
  let indicador: number | null = null;
  const capturados = pesos.every(([peso]) => number(peso) && peso <= 100);
  if (!capturados || !d(Number(data.pesoMercado)).add(Number(data.pesoIngresos)).add(Number(data.pesoFisico)).equals(100)) pendientes.push("Los pesos de los tres enfoques deben sumar 100 %");
  else {
    const faltan = pesos.filter(([peso, valor]) => (peso as number) > 0 && valor === null).map(([, , name]) => name);
    if (faltan.length) pendientes.push(`Falta el valor del enfoque ${faltan.join(" y ")}: se necesitan al menos tres comparables completos y sus datos`);
    else indicador = pesos.reduce((sum, [peso, valor]) => sum.add((peso as number) > 0 ? d(peso as number).div(100).mul(valor as number) : 0), new Decimal(0)).toNumber();
  }
  const redondeo = number(data.redondeo, true) ? data.redondeo : 1;
  const concluido = indicador === null ? null : d(indicador).div(redondeo).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).mul(redondeo).toNumber();
  return { pendientes, base, results: { terreno, construccion: construido, renta }, valorTerreno, valorConstruido, mercado, ingresos, fisico, indicador, concluido };
}

/** Imágenes que usa el documento: fotografía principal, croquis y reporte fotográfico (solo las elegidas). */
export function valorAssetIds(data: ValorRow): string[] {
  const uuid = (v: unknown): v is string => typeof v === "string" && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
  return [...new Set([data.fotoPrincipalId, data.croquisId, ...rows(data.fotografias).map((row) => row.assetId)].filter(uuid))];
}
