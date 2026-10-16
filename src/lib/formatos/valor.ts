import Decimal from "decimal.js";

export type ValorRow = Record<string, unknown>;
const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const evidence = (v: unknown) => text(v) && !/^(?:NV|NA|pendiente|no verificado|no determinado)$/i.test(String(v).trim());
const number = (v: unknown, positive = false) => typeof v === "number" && Number.isFinite(v) && v >= 0 && (!positive || v > 0) && v <= 1e12;
const date = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
const rows = (v: unknown): ValorRow[] | null => Array.isArray(v) && v.every((row) => row && typeof row === "object" && !Array.isArray(row)) ? v as ValorRow[] : null;
const d = (v: unknown) => new Decimal(v as number);
const area = (data: ValorRow, key: string) => number(data[key], true) ? data[key] as number : null;
const pct = (v: unknown, positive = false) => number(v, positive) && (v as number) < 100;
const HEIDECKE = [0, 0.0252, 0.181, 0.526, 0.722, 1] as const;
export const CONSTRUCTION_STATES = ["Óptimo / nuevo", "Bueno / reparaciones menores", "Regular / reparaciones simples", "Malo / reparaciones importantes", "Muy malo / muchas reparaciones importantes", "Ruinoso / sin valor de construcción"];

export function valorReviewSnapshot(data: ValorRow): string {
  const normalize = (value: unknown): unknown => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)])) : value;
  return JSON.stringify(normalize(Object.fromEntries(Object.entries(data).filter(([key]) => !["revisionDatos", "revisionEstado", "indicadorRevisado", "versionRevisada"].includes(key)))));
}

export function calcularComparables(input: unknown, data: ValorRow, type: unknown) {
  const errors: string[] = [];
  const list = rows(input);
  const calculated: { id: string; precioMxn: number; unitario: number; factor: number; homologado: number }[] = [];
  if (!list || list.length > 5) return { errors: ["Captura hasta cinco comparables"], rows: calculated, media: null, minimo: null, maximo: null };
  const ids = new Set<string>(); const sources = new Set<string>();
  for (const [index, row] of list.entries()) {
    const label = `Comparable ${index + 1}`;
    if (!["incluir", "excluir"].includes(String(row.seleccion))) { errors.push(`${label}: define selección o exclusión`); continue; }
    if (!text(row.razonSeleccion)) errors.push(`${label}: razón de selección o exclusión`);
    if (row.seleccion === "excluir") continue;
    const before = errors.length;
    for (const key of ["id", "ubicacion", "fuente", "fuenteSuperficie", "razonZona", "razonUbicacion", "razonSuperficie", "razonNegociacion"]) if (!evidence(row[key])) errors.push(`${label}: ${key}`);
    const id = String(row.id ?? "").trim().toLowerCase(); const source = String(row.fuente ?? "").trim().toLowerCase().replace(/\/$/, "");
    if (ids.has(id) || sources.has(source)) errors.push(`${label}: fuente duplicada`);
    ids.add(id); sources.add(source);
    if (!date(row.fechaConsulta) || !date(row.fechaPrecio) || !date(data.fechaEmision) || !date(data.fechaValor) || row.fechaConsulta > data.fechaEmision || row.fechaPrecio > data.fechaValor) errors.push(`${label}: fechas de consulta y precio`);
    if (!["oferta", "cierre"].includes(String(type)) || row.tipoPrecio !== type) errors.push(`${label}: no mezclar tipos de precio`);
    if (!["MXN", "USD"].includes(String(row.moneda))) errors.push(`${label}: moneda`);
    if (!number(row.precio, true) || !number(row.superficie, true)) errors.push(`${label}: precio y superficie positivos`);
    for (const key of ["fZona", "fUbicacion", "fSuperficie", "fNegociacion"]) if (!number(row[key], true)) errors.push(`${label}: ${key} positivo`);
    if (row.moneda === "USD" && (!number(data.tipoCambio, true) || !date(data.fechaCambio) || !date(data.fechaValor) || data.fechaCambio > data.fechaValor || !evidence(data.fuenteCambio))) errors.push(`${label}: conversión USD con fecha y fuente`);
    if (errors.length !== before) continue;
    const precio = d(row.precio).mul(row.moneda === "USD" ? data.tipoCambio as number : 1);
    const factor = d(row.fZona).mul(row.fUbicacion as number).mul(row.fSuperficie as number).mul(row.fNegociacion as number);
    const unitario = precio.div(row.superficie as number);
    calculated.push({ id: String(row.id), precioMxn: precio.toNumber(), unitario: unitario.toNumber(), factor: factor.toNumber(), homologado: unitario.mul(factor).toNumber() });
  }
  if (calculated.length < 3) errors.push("Mínimo tres comparables completos");
  const media = errors.length ? null : calculated.reduce((sum, row) => sum.add(row.homologado), new Decimal(0)).div(calculated.length).toNumber();
  return { errors, rows: calculated, media, minimo: media === null ? null : Math.min(...calculated.map((row) => row.homologado)), maximo: media === null ? null : Math.max(...calculated.map((row) => row.homologado)) };
}

function constructionErrors(row: ValorRow): string[] {
  const errors: string[] = [];
  for (const key of ["id", "tipo", "uso", "fuenteCosto", "fuenteEdadVida", "fuenteEstado"]) if (!evidence(row[key])) errors.push(key);
  for (const key of ["superficie", "costoNuevo", "vidaUtil"]) if (!number(row[key], true)) errors.push(key);
  if (!number(row.edad) || !number(row.vidaUtil, true) || (row.edad as number) > (row.vidaUtil as number)) errors.push("edad no mayor que vida útil");
  if (!Number.isInteger(row.estado) || (row.estado as number) < 1 || (row.estado as number) > 6) errors.push("conservación 1–6");
  return errors;
}

export function calcularConstruccion(row: ValorRow) {
  const errors = constructionErrors(row);
  if (errors.length) return { errors, ross: null, heidecke: null, neto: null, unitarioNeto: null, parcial: null };
  const ratio = d(row.edad).div(row.vidaUtil as number);
  const ross = ratio.add(ratio.pow(2)).div(2);
  const heidecke = HEIDECKE[(row.estado as number) - 1];
  const neto = new Decimal(1).sub(ross).mul(new Decimal(1).sub(heidecke));
  const unitarioNeto = d(row.costoNuevo).mul(neto);
  return { errors, ross: ross.toNumber(), heidecke, neto: neto.toNumber(), unitarioNeto: unitarioNeto.toNumber(), parcial: unitarioNeto.mul(row.superficie as number).toNumber() };
}

export function calcularValor(data: ValorRow) {
  const errors: string[] = [];
  const baseKey = { terreno: "terreno", construccion: "construccion", privativa: "privativa" }[String(data.baseMercado)];
  const surface = baseKey ? area(data, baseKey) : null;
  let mercado: number | null = null;
  let ingresos: { mensual: number; bruto: number; perdida: number; efectivo: number; gastos: number; noi: number; valor: number } | null = null;
  let fisico: { terreno: number; construccion: number; obras: number; valor: number } | null = null;
  const results: Record<string, ReturnType<typeof calcularComparables>> = {};
  if (surface === null) errors.push("Superficie base del sujeto positiva");
  for (const key of ["pesoMercado", "pesoIngresos", "pesoFisico"]) if (!number(data[key]) || (data[key] as number) > 100) errors.push("Pesos entre 0 y 100");
  if (!errors.includes("Pesos entre 0 y 100") && !d(data.pesoMercado).add(data.pesoIngresos as number).add(data.pesoFisico as number).equals(100)) errors.push("Los pesos deben sumar 100 %");
  if ((data.pesoMercado as number) > 0) {
    const terrain = data.baseMercado === "terreno";
    const result = calcularComparables(data[terrain ? "comparablesTerreno" : "comparablesConstruccion"], data, data[terrain ? "tipoPrecioTerreno" : "tipoPrecioConstruccion"]);
    results[terrain ? "terreno" : "construccion"] = result;
    errors.push(...result.errors.map((error) => `Mercado: ${error}`));
    if (!number(data.factorMercado, true) || !text(data.razonFactorMercado) || !text(data.criterioMercado)) errors.push("Factor adicional y criterio del mercado con justificación");
    else if (surface !== null && result.media !== null) mercado = d(surface).mul(result.media).mul(data.factorMercado as number).toNumber();
  }
  if ((data.pesoIngresos as number) > 0) {
    const result = calcularComparables(data.comparablesRenta, data, data.tipoPrecioRenta);
    results.renta = result;
    errors.push(...result.errors.map((error) => `Ingresos: ${error}`));
    if (!pct(data.vacanciaPct) || !pct(data.gastosPct) || !pct(data.tasaCapPct, true) || !text(data.sustentoIngresos) || !text(data.criterioRenta)) errors.push("Vacancia, gastos y tasa neta sustentados; porcentajes menores a 100");
    else if (surface !== null && result.media !== null) {
      const mensual = d(surface).mul(result.media); const bruto = mensual.mul(12); const perdida = bruto.mul(data.vacanciaPct as number).div(100);
      const efectivo = bruto.sub(perdida); const gastos = efectivo.mul(data.gastosPct as number).div(100); const noi = efectivo.sub(gastos);
      ingresos = { mensual: mensual.toNumber(), bruto: bruto.toNumber(), perdida: perdida.toNumber(), efectivo: efectivo.toNumber(), gastos: gastos.toNumber(), noi: noi.toNumber(), valor: noi.div(d(data.tasaCapPct).div(100)).toNumber() };
    }
  }
  if ((data.pesoFisico as number) > 0) {
    const result = results.terreno ?? calcularComparables(data.comparablesTerreno, data, data.tipoPrecioTerreno);
    results.terreno = result;
    errors.push(...result.errors.map((error) => `Físico / terreno: ${error}`));
    const before = errors.length;
    const list = rows(data.construcciones); const works = rows(data.obras);
    if (area(data, "terreno") === null || !number(data.factorTerreno, true) || !text(data.razonFactorTerreno) || !text(data.criterioTerreno) || data.terrenoDerechos !== "revisado") errors.push("Terreno atribuible y factor físico revisados");
    for (const key of ["Terreno", "Construccion"]) if (!["documentado", "observado", "medido", "declarado"].includes(String(data[`origen${key}`])) || !evidence(data[`fuente${key}`])) errors.push(`Físico: origen y fuente de ${key.toLowerCase()}`);
    if (!list || list.length < 1 || list.length > 4) errors.push("De una a cuatro construcciones en el enfoque físico");
    if (data.inventarioFisico !== "revisado" || data.metodoFisico !== "revisado" || !text(data.supuestosDepreciacion)) errors.push("Inventario y pertinencia de la depreciación revisados");
    let building = new Decimal(0); let totalArea = new Decimal(0); const ids = new Set<string>();
    for (const [index, row] of (list ?? []).entries()) {
      const part = calcularConstruccion(row);
      errors.push(...part.errors.map((error) => `Construcción ${index + 1}: ${error}`));
      const id = String(row.id ?? "").trim().toLowerCase(); if (ids.has(id)) errors.push("Construcción: ID duplicado"); ids.add(id);
      if (part.parcial !== null) { building = building.add(part.parcial); totalArea = totalArea.add(row.superficie as number); }
    }
    if (!number(data.construccion, true) || !totalArea.equals(data.construccion as number)) errors.push("Las superficies de construcciones deben sumar la construcción del sujeto");
    let totalWorks = new Decimal(0);
    if (!works || works.length > 3 || !["incluidas", "no_aplican"].includes(String(data.obrasEstado))) errors.push("Estado y registro de obras complementarias");
    else if (data.obrasEstado === "no_aplican" && works.length) errors.push("Obras: el estado contradice las partidas");
    else if (data.obrasEstado === "incluidas") {
      if (!works.length || !text(data.obrasFuente)) errors.push("Fuentes de obras y exclusión de doble conteo");
      for (const [index, row] of works.entries()) {
        if (!["concepto", "unidad", "fuente"].every((key) => text(row[key])) || !number(row.cantidad, true) || !number(row.costoNuevo, true) || !number(row.factorConservacion) || (row.factorConservacion as number) > 1) errors.push(`Obra ${index + 1}: concepto, unidad, costo, cantidad, factor 0–1 y fuente`);
        else totalWorks = totalWorks.add(d(row.cantidad).mul(row.costoNuevo as number).mul(row.factorConservacion as number));
      }
    }
    if (errors.length === before && result.media !== null) {
      const terrain = d(data.terreno).mul(result.media).mul(data.factorTerreno as number);
      fisico = { terreno: terrain.toNumber(), construccion: building.toNumber(), obras: totalWorks.toNumber(), valor: terrain.add(building).add(totalWorks).toNumber() };
    }
  }
  let indicador: number | null = null; let concluido: number | null = null;
  if (!errors.length) {
    indicador = [[data.pesoMercado, mercado], [data.pesoIngresos, ingresos?.valor], [data.pesoFisico, fisico?.valor]].reduce<Decimal>((sum, [weight, value]) => sum.add((weight as number) > 0 ? d(weight).div(100).mul(value as number) : 0), new Decimal(0)).toNumber();
    if (number(data.redondeo, true) && data.revisionEstado === "revisada" && data.versionRevisada === data.versionInforme && data.revisionDatos === valorReviewSnapshot(data) && number(data.indicadorRevisado) && d(data.indicadorRevisado).sub(indicador).abs().lte(0.01)) concluido = d(indicador).div(data.redondeo as number).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).mul(data.redondeo as number).toNumber();
  }
  return { errors: [...new Set(errors)], results, mercado, ingresos, fisico, indicador, concluido };
}

export function validarValor(data: ValorRow, today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) {
  const errors = [...calcularValor(data).errors];
  if (data.operacion !== "venta" || !["en_estudio", "activa"].includes(String(data.estadoOperacion))) errors.push("Replantear alcance de la operación cancelada o distinta de venta");
  for (const key of ["fechaValor", "fechaEmision", "revisarAntes", "fechaSolicitud", "fechaRevision"]) if (!date(data[key])) errors.push(`${key}: fecha válida`);
  if (date(data.fechaValor) && date(data.fechaEmision) && date(data.revisarAntes) && (data.fechaEmision < data.fechaValor || data.fechaEmision > today || data.revisarAntes < data.fechaEmision || data.revisarAntes < today)) errors.push("Revisar fechas o vigencia de la opinión");
  if (date(data.fechaSolicitud) && date(data.fechaValor) && data.fechaSolicitud > data.fechaValor) errors.push("Solicitud posterior a la fecha de valor");
  if (!["realizada", "no_realizada"].includes(String(data.inspeccionEstado))) errors.push("Definir inspección");
  if (data.inspeccionEstado === "realizada" && (!date(data.fechaInspeccion) || !date(data.fechaValor) || data.fechaInspeccion > data.fechaValor)) errors.push("Fecha de inspección anterior o igual a fecha de valor");
  if (!["compatibles", "discrepancia_resuelta"].includes(String(data.superficiesEstado)) || data.superficiesEstado === "discrepancia_resuelta" && !text(data.superficiesEfecto)) errors.push("Conciliar superficies y efecto en valor");
  if (!["compatible", "condicionada"].includes(String(data.juridicaEstado)) || data.juridicaEstado === "condicionada" && !text(data.condicionesJuridicas)) errors.push("Resolver revisión jurídica y efecto de sus condiciones");
  const originKey = { terreno: "origenTerreno", construccion: "origenConstruccion", privativa: "origenPrivativa" }[String(data.baseMercado)];
  const sourceKey = { terreno: "fuenteTerreno", construccion: "fuenteConstruccion", privativa: "fuentePrivativa" }[String(data.baseMercado)];
  if (!originKey || !["documentado", "observado", "medido", "declarado"].includes(String(data[originKey])) || !sourceKey || !evidence(data[sourceKey])) errors.push("Origen y fuente de la superficie base");
  if (data.baseMercado === "terreno" && data.terrenoDerechos !== "revisado") errors.push("Terreno atribuible revisado");
  for (const [key, label] of [["razonMercado", "mercado"], ["razonIngresos", "ingresos"], ["razonFisico", "físico"]]) if (!text(data[key])) errors.push(`Justificación del enfoque ${label}`);
  if (!Number.isInteger(data.versionInforme) || (data.versionInforme as number) < 1) errors.push("Versión del informe positiva");
  const result = calcularValor(data);
  if (data.revisionDatos !== valorReviewSnapshot(data)) errors.push("Los datos cambiaron después de la revisión");
  if (result.concluido === null) errors.push("Registrar revisión del indicador y de la versión actuales y redondeo positivo");
  else if (result.concluido <= 0) errors.push("El redondeo no puede producir un valor concluido de cero");
  if (!date(data.fechaRevision) || !date(data.fechaValor) || !date(data.fechaEmision) || data.fechaRevision < data.fechaValor || data.fechaRevision > data.fechaEmision) errors.push("Fecha de revisión entre fecha de valor y emisión");
  const images = rows(data.fotografias);
  const uuid = (v: unknown) => typeof v === "string" && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
  if (!uuid(data.fotoPrincipalId) || !uuid(data.croquisId) || data.permisoImagenes !== "autorizado") errors.push("Fotografía principal y croquis autorizados");
  if (data.fotoPrincipalId === data.croquisId || images?.some((row) => row.assetId === data.croquisId)) errors.push("El croquis no puede usarse como fotografía");
  if (!images || !images.length || images.length > 8 || images.some((row) => !uuid(row.assetId) || !text(row.pie))) errors.push("De una a ocho fotografías identificadas con pie");
  else if (new Set(images.map((row) => row.assetId)).size !== images.length) errors.push("Fotografía duplicada en el reporte");
  const documents = rows(data.documentos);
  if (data.documentosEstado === "revisados" && (!documents || !documents.length || documents.length > 30 || documents.some((row) => !evidence(row.documento) || !evidence(row.referencia) || !date(row.fecha)))) errors.push("Documentos examinados: registro incompleto");
  if (data.documentosEstado === "sin_documentos" && documents?.length) errors.push("Documentos: el estado contradice los registros");
  return [...new Set(errors)];
}

export function valorAssetIds(data: ValorRow): string[] {
  return [...new Set([String(data.fotoPrincipalId), String(data.croquisId), ...(rows(data.fotografias) ?? []).map((row) => String(row.assetId))])];
}
