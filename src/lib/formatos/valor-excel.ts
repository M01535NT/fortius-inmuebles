import JSZip from "jszip";

/*
  Opinión de valor 07 en Excel: llena la plantilla del titular (public/plantillas/07_OpinionValor.xlsx,
  copia de 07_OpinionValor.xlsx del 17/10/2026 con sus fórmulas simplificadas a lo que captura el
  panel) celda por celda, sin tocar estilos, fórmulas ni dibujos. Excel recalcula al abrir.
  Los porcentajes del panel (0–100) se escriben como fracción, igual que la plantilla.
*/

type Data = Record<string, unknown>;
type Valor = string | number | null;
export const PLANTILLA_07 = "/plantillas/07_OpinionValor.xlsx";

/** Archivo de cada hoja dentro del libro (xl/worksheets/sheetN.xml, en el orden de la plantilla). */
const HOJAS = { antecedentes: 4, urbanas: 5, inmueble: 6, terreno: 7, construido: 8, ingresos: 9, fisico: 10, conciliacion: 11, fotografias: 12 } as const;

const texto = (value: unknown): Valor => typeof value === "string" && value.trim() ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : null;
const numero = (value: unknown): Valor => typeof value === "number" && Number.isFinite(value) ? value : null;
const fraccion = (value: unknown): Valor => typeof value === "number" && Number.isFinite(value) ? value / 100 : null;
/** Fecha ISO a número de serie de Excel (las celdas de fecha de la plantilla ya tienen formato de fecha). */
const serie = (value: unknown): Valor => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? (Date.UTC(+value.slice(0, 4), +value.slice(5, 7) - 1, +value.slice(8, 10)) - Date.UTC(1899, 11, 30)) / 864e5 : null;
const filas = (value: unknown): Data[] => Array.isArray(value) ? value.filter((row): row is Data => !!row && typeof row === "object") : [];
/** Un factor vacío en un comparable capturado vale 1 («sin ajuste»), como indica la plantilla. */
const factor = (row: Data, key: string): Valor => numero(row[key]) ?? 1;

/** Celdas que se llenan, por hoja, a partir de los datos capturados. */
export function celdasValor(d: Data): Record<number, Record<string, Valor>> {
  const out: Record<number, Record<string, Valor>> = {};
  const put = (hoja: number, cells: Record<string, Valor>) => { out[hoja] = { ...out[hoja], ...cells }; };
  put(HOJAS.antecedentes, {
    Q9: texto(d.folio), Q10: serie(d.fechaValor), Q11: texto(d.operacion), Q13: texto(d.baseMercado), Q16: numero(d.tipoCambio), Q19: texto(d.inspeccionEstado),
    E10: texto(d.solicitante), E11: texto(d.relacionSolicitante), E12: texto(d.propietario), E13: texto(d.tipoInmueble), E14: texto(d.usoActual), E15: texto(d.regimen),
    E16: texto(d.cuentaCatastral), E17: texto(d.inmueble), E18: serie(d.fechaSolicitud), E21: texto(d.objeto), E22: texto(d.proposito), E24: serie(d.fechaInspeccion),
    E25: serie(d.fechaEmision), E26: serie(d.revisarAntes), E29: texto(d.alcance), E32: texto(d.empresa), E33: texto(d.asesor), E34: texto(d.contacto),
    ...Object.fromEntries([0, 1, 2, 3, 4].map(i => [`A${37 + i}`, texto(filas(d.documentos)[i]?.documento)])),
  });
  put(HOJAS.urbanas, {
    E10: texto(d.clasificacionZona), E13: texto(d.zonificacion), E14: texto(d.saturacion), E15: texto(d.dinamicaMercado), E16: texto(d.usoPredominante), E19: texto(d.servicios),
    E25: texto(d.educacion), E26: texto(d.comercios), E27: texto(d.salud), E28: texto(d.transporte), E31: texto(d.vialidades),
    D36: texto(d.latitud), I36: texto(d.longitud), D37: texto(d.altitud), I37: texto(d.orientacion),
  });
  const elementos = ["cimentacion", "estructura", "muros", "entrepisos", "azoteas", "acabados", "pisos", "carpinteria", "hidrosanitaria", "electrica", "especiales"];
  put(HOJAS.inmueble, {
    D10: numero(d.terreno), I10: texto(d.frente), D11: texto(d.indiviso), I11: texto(d.loteTipo), D12: texto(d.forma), I12: texto(d.topografia), D13: texto(d.linderos), D16: texto(d.restricciones),
    Q13: numero(d.privativa), D19: numero(d.construccion), I19: texto(d.niveles), D20: texto(d.recamaras), I20: texto(d.banos), D21: texto(d.estacionamientos), I21: texto(d.edad),
    D22: texto(d.conservacion), I22: texto(d.calidadProyecto), D23: texto(d.descripcion),
    ...Object.fromEntries(elementos.map((key, i) => [`D${37 + i}`, texto(d[key])])),
    ...Object.fromEntries([0, 1, 2, 3].flatMap(i => { const r = filas(d.construcciones)[i] ?? {}; const row = 31 + i; return [[`A${row}`, texto(r.id)], [`C${row}`, texto(r.tipo)], [`D${row}`, texto(r.uso)], [`G${row}`, numero(r.estado)], [`H${row}`, numero(r.edad)], [`I${row}`, numero(r.vidaUtil)], [`K${row}`, numero(r.superficie)]]; })),
  });
  // Comparables: la tabla impresa (fila 11 o 12 en adelante) y su ficha de captura en la columna Q (bloques de 19 filas desde Q11).
  const comparables = (key: string, primera: number) => Object.fromEntries([0, 1, 2, 3, 4].flatMap(i => {
    const r = filas(d[key])[i]; const row = primera + i, q = 11 + 19 * i;
    if (!r) return [[`B${row}`, null], [`D${row}`, null], [`G${row}`, null], [`H${row}`, null], [`I${row}`, null], [`J${row}`, null], [`Q${q + 2}`, null], [`Q${q + 4}`, null], [`Q${q + 6}`, null], [`Q${q + 7}`, null]];
    return [[`B${row}`, texto(r.ubicacion)], [`D${row}`, numero(r.superficie)], [`G${row}`, factor(r, "fZona")], [`H${row}`, factor(r, "fUbicacion")], [`I${row}`, factor(r, "fSuperficie")], [`J${row}`, factor(r, "fNegociacion")],
      [`Q${q}`, "Incluir"], [`Q${q + 2}`, texto(r.fuente)], [`Q${q + 4}`, serie(r.fechaPrecio)], [`Q${q + 6}`, texto(r.moneda) ?? "MXN"], [`Q${q + 7}`, numero(r.precio)]];
  }));
  put(HOJAS.terreno, { ...comparables("comparablesTerreno", 11), D20: numero(d.factorTerreno) ?? 1, J20: texto(d.razonFactorTerreno), A24: texto(d.criterioTerreno) });
  put(HOJAS.construido, { ...comparables("comparablesConstruccion", 11), D20: numero(d.factorMercado) ?? 1, J20: texto(d.razonFactorMercado), A24: texto(d.criterioMercado) });
  put(HOJAS.ingresos, { ...comparables("comparablesRenta", 12), H24: fraccion(d.vacanciaPct), H27: fraccion(d.gastosPct), H32: fraccion(d.tasaCapPct), A36: texto(d.sustentoIngresos) });
  put(HOJAS.fisico, {
    ...Object.fromEntries([0, 1, 2, 3].map(i => [`D${15 + i}`, numero(filas(d.construcciones)[i]?.costoNuevo)])),
    ...Object.fromEntries([0, 1, 2].flatMap(i => { const r = filas(d.obras)[i] ?? {}; const row = 23 + i; return [[`A${row}`, texto(r.concepto)], [`E${row}`, texto(r.unidad)], [`G${row}`, numero(r.cantidad)], [`H${row}`, numero(r.costoNuevo)], [`J${row}`, numero(r.factorConservacion)]]; })),
    Q9: texto(d.fuenteCosto), Q10: texto(d.fuenteEdadVida), Q16: texto(d.supuestosDepreciacion),
  });
  put(HOJAS.conciliacion, { D11: fraccion(d.pesoMercado), D12: fraccion(d.pesoIngresos), D13: fraccion(d.pesoFisico), Q9: numero(d.redondeo), A19: texto(d.justificacion), A27: texto(d.limites) });
  put(HOJAS.fotografias, Object.fromEntries(["C18", "I18", "C28", "I28", "C38", "I38", "C48", "I48"].map((ref, i) => [ref, texto(filas(d.fotografias)[i]?.pie)])));
  return out;
}

const escape = (value: string) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const columna = (ref: string) => ref.replace(/\d+/g, "").split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);

/** Escribe valores en la hoja conservando el estilo de cada celda; `null` deja la celda vacía. */
export function llenarHoja(xml: string, cells: Record<string, Valor>): string {
  for (const [ref, value] of Object.entries(cells)) {
    const pattern = new RegExp(`<c r="${ref}"(?=[ />])([^>]*?)(?:/>|>[\\s\\S]*?</c>)`);
    const match = xml.match(pattern);
    const style = (match?.[1] ?? "").match(/ s="\d+"/)?.[0] ?? "";
    const cell = value === null ? `<c r="${ref}"${style}/>` : typeof value === "number" ? `<c r="${ref}"${style}><v>${value}</v></c>` : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
    if (match) { xml = xml.replace(pattern, cell); continue; }
    if (value === null) continue;
    const row = ref.replace(/^[A-Z]+/, "");
    const rowPattern = new RegExp(`(<row r="${row}"[^>]*?)(/>|>([\\s\\S]*?)</row>)`);
    const found = xml.match(rowPattern);
    if (!found) continue;
    const existing = [...(found[3] ?? "").matchAll(/<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g)];
    const after = existing.find(c => columna(c[1]) > columna(ref));
    const body = after ? (found[3] ?? "").replace(after[0], cell + after[0]) : (found[3] ?? "") + cell;
    xml = xml.replace(rowPattern, `${found[1]}>${body}</row>`);
  }
  return xml;
}

/** Libro de Excel de la opinión, a partir de la plantilla (bytes) y los datos capturados. */
export async function valorExcel(data: Data, plantilla: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(plantilla);
  for (const [hoja, cells] of Object.entries(celdasValor(data))) {
    const name = `xl/worksheets/sheet${hoja}.xml`;
    const file = zip.file(name);
    if (file) zip.file(name, llenarHoja(await file.async("string"), cells));
  }
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
