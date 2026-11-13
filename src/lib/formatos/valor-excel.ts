import JSZip from "jszip";

/*
  Opinión de valor 07 en Excel: llena la plantilla del titular (public/plantillas/07_OpinionValor.xlsx,
  copia de 07_OpinionValor.xlsx del 30/10/2026 preparada con tools/plantilla-07.mjs: fórmulas
  simplificadas a lo que captura el panel) celda por celda, sin tocar estilos, fórmulas ni dibujos.
  Excel recalcula al abrir. Los porcentajes del panel (0–100) se escriben como fracción, igual que
  la plantilla. Las fotografías elegidas (portada, croquis y las ocho del reporte) se colocan en
  sus recuadros, centradas y sin deformarse.
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
    // E17 en la plantilla arma el domicilio con sus partes (Q45 a Q51); el panel lo tiene en un solo texto.
    E16: texto(d.cuentaCatastral), E17: texto(d.inmueble), E18: serie(d.fechaSolicitud), E21: texto(d.objeto), E22: texto(d.proposito), E24: serie(d.fechaInspeccion),
    // E26 (vigencia) es fórmula de la plantilla: seis meses desde la emisión.
    E25: serie(d.fechaEmision), E29: texto(d.alcance), E32: texto(d.empresa), E33: texto(d.asesor), E34: texto(d.contacto),
    ...Object.fromEntries([0, 1, 2, 3, 4].map(i => [`A${37 + i}`, texto(filas(d.documentos)[i]?.documento)])),
  });
  put(HOJAS.urbanas, {
    E10: texto(d.clasificacionZona), E13: texto(d.zonificacion), E14: texto(d.dinamicaMercado), E15: texto(d.usoPredominante), E18: texto(d.servicios),
    E24: texto(d.educacion), E25: texto(d.comercios), E26: texto(d.salud), E27: texto(d.transporte), E30: texto(d.vialidades),
    D35: texto(d.latitud), I35: texto(d.longitud), D36: texto(d.orientacion),
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

/** Foto ya preparada para el libro: bytes JPG o PNG con sus medidas en píxeles (ya orientada). */
export type FotoExcel = { bytes: Uint8Array; tipo: "jpg" | "png"; width: number; height: number };
/**
  Recuadro de una foto en su hoja: columnas y renglones (base 1) de la celda combinada y su rótulo
  («FOTOGRAFÍA 1», «CROQUIS…»), que la plantilla centra como marcador y se vacía al poner la foto.
*/
type Recuadro = { hoja: number; col1: number; col2: number; row1: number; row2: number; nombre: string; rotulo: string };
const MITADES = [[1, 6], [7, 12]] as const;
const RECUADROS = {
  portada: { hoja: 1, col1: 1, col2: 12, row1: 15, row2: 26, nombre: "Fotografía principal", rotulo: "A15" },
  croquis: { hoja: HOJAS.urbanas, col1: 1, col2: 12, row1: 38, row2: 46, nombre: "Croquis de localización", rotulo: "A38" },
  reporte: [10, 20, 30, 40].flatMap(row => MITADES.map(([col1, col2]) => ({ hoja: HOJAS.fotografias, col1, col2, row1: row, row2: row + 7, nombre: "", rotulo: `${col1 === 1 ? "A" : "G"}${row}` }))),
};

/** Qué foto va en cada recuadro, según lo capturado (IDs de los adjuntos). */
export function fotosValor(d: Data): Array<{ id: string; recuadro: Recuadro }> {
  const out: Array<{ id: string; recuadro: Recuadro }> = [];
  if (typeof d.fotoPrincipalId === "string" && d.fotoPrincipalId) out.push({ id: d.fotoPrincipalId, recuadro: RECUADROS.portada });
  if (typeof d.croquisId === "string" && d.croquisId) out.push({ id: d.croquisId, recuadro: RECUADROS.croquis });
  filas(d.fotografias).slice(0, 8).forEach((row, i) => { if (typeof row.assetId === "string" && row.assetId) out.push({ id: row.assetId, recuadro: { ...RECUADROS.reporte[i], nombre: `Fotografía ${i + 1}` } }); });
  return out;
}

const EMU_PX = 9525, EMU_PT = 12700;
/** Ancho de columna de Excel (caracteres) a EMU, con la fuente de 7 px por dígito de la plantilla. */
const anchoColumna = (chars: number) => Math.trunc(((256 * chars + Math.trunc(128 / 7)) / 256) * 7) * EMU_PX;
function medidas(xml: string) {
  const defCol = Number(xml.match(/<sheetFormatPr[^>]*defaultColWidth="([\d.]+)"/)?.[1] ?? 9.140625);
  const defRow = Number(xml.match(/<sheetFormatPr[^>]*defaultRowHeight="([\d.]+)"/)?.[1] ?? 15);
  const cols = new Map<number, number>();
  for (const c of xml.matchAll(/<col min="(\d+)" max="(\d+)"[^>]*?width="([\d.]+)"/g)) for (let i = +c[1]; i <= +c[2]; i++) cols.set(i, +c[3]);
  const rows = new Map<number, number>();
  for (const r of xml.matchAll(/<row r="(\d+)"[^>]*?ht="([\d.]+)"/g)) rows.set(+r[1], +r[2]);
  return { col: (i: number) => anchoColumna(cols.get(i) ?? defCol), row: (i: number) => Math.round((rows.get(i) ?? defRow) * EMU_PT) };
}
/** Posición absoluta (EMU desde la celda A1) a celda base 0 con su desplazamiento, como la pide el ancla. */
function celda(pos: number, size: (i: number) => number) {
  let i = 1;
  while (pos >= size(i) && i < 16384) { pos -= size(i); i++; }
  return { index: i - 1, off: Math.round(pos) };
}
const suma = (from: number, to: number, size: (i: number) => number) => { let total = 0; for (let i = from; i <= to; i++) total += size(i); return total; };

/** Agrega las fotos al dibujo de cada hoja, ajustadas al recuadro con su proporción y centradas. */
async function colocarFotos(zip: JSZip, fotos: Array<{ foto: FotoExcel; recuadro: Recuadro }>) {
  const tipos = new Set<string>();
  for (const [i, { foto, recuadro }] of fotos.entries()) {
    const sheetName = `xl/worksheets/sheet${recuadro.hoja}.xml`, sheetXml = await zip.file(sheetName)?.async("string");
    const rels = await zip.file(`xl/worksheets/_rels/sheet${recuadro.hoja}.xml.rels`)?.async("string");
    const drawing = rels?.match(/Target="\.\.\/drawings\/(drawing\d+\.xml)"/)?.[1];
    const drawingXml = drawing ? await zip.file(`xl/drawings/${drawing}`)?.async("string") : undefined;
    if (!sheetXml || !drawing || !drawingXml) continue;
    const m = medidas(sheetXml);
    const x0 = suma(1, recuadro.col1 - 1, m.col), y0 = suma(1, recuadro.row1 - 1, m.row);
    const boxW = suma(recuadro.col1, recuadro.col2, m.col), boxH = suma(recuadro.row1, recuadro.row2, m.row);
    const margen = 4 * EMU_PX, scale = Math.min((boxW - 2 * margen) / foto.width, (boxH - 2 * margen) / foto.height);
    const w = Math.round(foto.width * scale), h = Math.round(foto.height * scale);
    const x = Math.round(x0 + (boxW - w) / 2), y = Math.round(y0 + (boxH - h) / 2);
    const from = { c: celda(x, m.col), r: celda(y, m.row) }, to = { c: celda(x + w, m.col), r: celda(y + h, m.row) };
    const ext = foto.tipo === "png" ? "png" : "jpeg";
    tipos.add(ext);
    const media = `fortius-foto-${i + 1}.${ext}`, rid = `rIdFortiusFoto${i + 1}`;
    zip.file(`xl/media/${media}`, foto.bytes);
    const drawingRels = `xl/drawings/_rels/${drawing}.rels`;
    const relXml = (await zip.file(drawingRels)?.async("string")) ?? '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
    zip.file(drawingRels, relXml.replace("</Relationships>", `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${media}"/></Relationships>`));
    const anchor = `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${from.c.index}</xdr:col><xdr:colOff>${from.c.off}</xdr:colOff><xdr:row>${from.r.index}</xdr:row><xdr:rowOff>${from.r.off}</xdr:rowOff></xdr:from>`
      + `<xdr:to><xdr:col>${to.c.index}</xdr:col><xdr:colOff>${to.c.off}</xdr:colOff><xdr:row>${to.r.index}</xdr:row><xdr:rowOff>${to.r.off}</xdr:rowOff></xdr:to>`
      + `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${5001 + i}" name="${escape(recuadro.nombre)}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>`
      + `<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>`
      + `<xdr:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`;
    zip.file(`xl/drawings/${drawing}`, drawingXml.replace("</xdr:wsDr>", () => `${anchor}</xdr:wsDr>`));
    zip.file(sheetName, llenarHoja(sheetXml, { [recuadro.rotulo]: null }));
  }
  if (!tipos.size) return;
  let types = await zip.file("[Content_Types].xml")!.async("string");
  for (const ext of tipos) if (!new RegExp(`<Default Extension="${ext}"`, "i").test(types)) types = types.replace("<Default ", `<Default Extension="${ext}" ContentType="image/${ext}"/><Default `);
  zip.file("[Content_Types].xml", types);
}

/**
  Quita la cadena de cálculo (xl/calcChain.xml). Algunas celdas que el panel llena son fórmulas en
  la plantilla (el domicilio, E17 de «2. Antecedentes»); si la cadena sigue apuntando a ellas, Excel
  no abre el libro. El libro se recalcula completo al abrir (fullCalcOnLoad) y Excel la rehace.
*/
async function sinCadenaDeCalculo(zip: JSZip) {
  if (!zip.file("xl/calcChain.xml")) return;
  zip.remove("xl/calcChain.xml");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (rels) zip.file("xl/_rels/workbook.xml.rels", rels.replace(/<Relationship [^>]*Target="calcChain\.xml"[^>]*\/>/, ""));
  const types = await zip.file("[Content_Types].xml")?.async("string");
  if (types) zip.file("[Content_Types].xml", types.replace(/<Override [^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/, ""));
}

/**
  Libro de Excel de la opinión, a partir de la plantilla (bytes) y los datos capturados.
  «fotos»: las imágenes elegidas, por ID del adjunto; la que falte deja su recuadro como en la plantilla.
*/
export async function valorExcel(data: Data, plantilla: ArrayBuffer | Uint8Array, fotos: Record<string, FotoExcel> = {}): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(plantilla);
  for (const [hoja, cells] of Object.entries(celdasValor(data))) {
    const name = `xl/worksheets/sheet${hoja}.xml`;
    const file = zip.file(name);
    if (file) zip.file(name, llenarHoja(await file.async("string"), cells));
  }
  await colocarFotos(zip, fotosValor(data).flatMap(({ id, recuadro }) => fotos[id] ? [{ foto: fotos[id], recuadro }] : []));
  await sinCadenaDeCalculo(zip);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
