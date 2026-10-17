import type { FormatoField } from "../catalog";
import { LEVANTAMIENTO_IMAGE_KEYS, LEVANTAMIENTO_TABLES, LEVANTAMIENTO_TITLES, levantamientoFields, type LevantamientoId } from "../levantamiento";
import { a, fecha, filas, junta, type Block, type Documento, type DocumentoContexto } from "./modelo";

/*
  04A–04G · Levantamiento sencillo (decisión del titular, 17/10/2026): identificación, qué
  inmueble es, fotografía principal, la visita y, después, cómo es, superficies, materiales,
  servicios, croquis y observaciones. Las secciones salen de los campos del panel; cada celda
  muestra lo capturado y, si no hay dato, queda el espacio para anotarlo a mano.
*/

type Data = Record<string, unknown>;
type Cell = { q: string; a: string; w: number };
const KIND: Record<LevantamientoId, string> = { "04A": "Terreno", "04B": "Casa habitación", "04C": "Departamento", "04D": "Oficina", "04E": "Local comercial", "04F": "Nave o bodega", "04G": "Plaza o conjunto" };
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : typeof value === "number" ? String(value) : a(value);
const sectionTitle = (section: string) => section.replace(" / ", " ");
const answer = (field: FormatoField, value: unknown) => field.type === "choice" ? field.options?.find(o => o.value === value)?.label ?? a(value) : f(value);
/** Parte una lista de celdas en renglones de dos; un texto largo ocupa el renglón completo. */
function pairs(cells: Array<Cell & { long?: boolean }>): Cell[][] {
  const rows: Cell[][] = [];
  for (const cell of cells) {
    const last = rows[rows.length - 1];
    if (!cell.long && last && last.length === 1 && last[0].w === 3) last.push({ q: cell.q, a: cell.a, w: 3 });
    else rows.push([{ q: cell.q, a: cell.a, w: cell.long ? 6 : 3 }]);
  }
  return rows.map(row => row.length === 1 ? [{ ...row[0], w: 6 }] : row);
}

export function levantamientoDocumento(id: LevantamientoId, d: Data, contexto: DocumentoContexto = {}): Documento {
  const fields = levantamientoFields(id);
  const foto = typeof d.fotoPrincipalId === "string" ? contexto.imagenes?.[d.fotoPrincipalId] : undefined;
  const croquis = typeof d.croquisId === "string" ? contexto.imagenes?.[d.croquisId] : undefined;
  const of = (section: string) => fields.filter(field => field.section === section && !(LEVANTAMIENTO_IMAGE_KEYS as readonly string[]).includes(field.key));
  const cells = (list: FormatoField[]) => pairs(list.filter(field => field.type !== "levantamientoRows").map(field => ({ q: field.label, a: answer(field, d[field.key]), w: 3, long: field.type === "long" })));
  const sections = [...new Set(fields.map(field => field.section!))];
  const [, que, , visita, ...rest] = sections;
  const entorno = rest.find(name => name.startsWith("08"));
  const middle = rest.filter(name => name !== entorno);

  const blocks: Block[] = [
    { kind: "title", text: LEVANTAMIENTO_TITLES[id], bold: true, size: 26 },
    { kind: "form", rows: [
      [{ q: "Folio de la operación", a: a(d.folio), w: 2 }, { q: "ID del inmueble", a: a(d.idInmueble), w: 2 }, { q: "Tipo", a: KIND[id], w: 2 }],
      [{ q: "Domicilio del inmueble", a: a(d.inmueble), w: 6 }],
      [{ q: "Colonia o zona", a: a(d.colonia), w: 2.5 }, { q: "Municipio y estado", a: a(d.municipioEstado), w: 2.5 }, { q: "C. P.", a: a(d.codigoPostal), w: 1 }],
    ] },
    { kind: "form", label: sectionTitle(que), rows: cells(of(que)) },
    { kind: "form", label: "02 Fotografía principal", rows: [] },
    { kind: "image", label: id === "04A" ? "Vista principal del terreno" : "Fachada o vista principal", image: foto, height: 190 },
    ...(foto ? [{ kind: "caption" as const, text: junta(foto.caption, foto.source, foto.date ? fecha(foto.date) : "") }] : []),
    { kind: "form", label: sectionTitle(visita), rows: cells(of(visita)) },
    ...middle.flatMap<Block>(name => {
      const list = of(name);
      const units = list.find(field => field.type === "levantamientoRows");
      const columns = LEVANTAMIENTO_TABLES.unidades.columns;
      return [
        { kind: "form", label: sectionTitle(name), rows: cells(list) },
        ...(units ? [{ kind: "grid" as const, widths: [1.5, 1.5, 2, 1.2, 1.3], header: columns.map(c => c.label), rows: (filas(d.unidades).length ? filas(d.unidades) : [{}, {}]).map(r => columns.map(c => a(r[c.key]))) }] : []),
      ];
    }),
    { kind: "form", label: entorno ? sectionTitle(entorno).replace("Entorno", "Croquis, entorno") : "08 Croquis, entorno y observaciones", rows: [] },
    ...(croquis ? [{ kind: "image" as const, label: "Croquis o mapa del inmueble", image: croquis, height: 190 }] : []),
    { kind: "form", rows: cells(entorno ? of(entorno) : []) },
    { kind: "note", text: "Inspección visual del asesor, no pericial: no certifica superficies, seguridad ni uso autorizado. Las superficies, medidas y colindancias que no se tomaron en la visita se toman de la escritura y los demás documentos en la revisión jurídica (05)." },
  ];
  return { title: LEVANTAMIENTO_TITLES[id], subject: `Formato ${id} · ${a(d.folio)}`, blocks };
}
