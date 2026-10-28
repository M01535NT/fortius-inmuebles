import { LEVANTAMIENTO_TABLES, LEVANTAMIENTO_TIPO, LEVANTAMIENTO_TITLES, PLANTILLAS, type Campo, type Celda, type LevantamientoId } from "../levantamiento";
import { a, fecha, filas, type Block, type Documento, type DocumentoContexto, type FormCell, type Marca } from "./modelo";

/*
  04A–04G · Levantamiento con el acomodo del Word del 04A (titular, 27/10/2026): el título va en
  el membrete y las secciones siguen una tras otra sin dejar hojas a medias; los grupos
  («Características del inmueble», «Ubicación y evidencias») solo cambian de hoja si ya no cabe
  su primera sección. Todo sale de PLANTILLAS: cada celda dice qué campos la llenan («keys»)
  para la captura en vivo; un dato faltante deja su espacio en blanco, como el impreso.
*/

type Data = Record<string, unknown>;
/** Separación entre rótulos de un mismo renglón; los espacios duros no se pierden al cortar líneas. */
const GAP = "     ";
/** El ID de la fotografía sale del archivo elegido, para no capturarlo a mano. */
export const fotoId = (id: unknown) => `FOTO-${typeof id === "string" ? id.replace(/-/g, "").slice(0, 8).toUpperCase() : ""}`;

/** El dato como se imprime: la opción elegida, la fecha en palabras o el texto capturado. */
function valor(campo: Campo, value: unknown): string {
  if (campo.options) {
    const chosen = Array.isArray(value) ? value : [value];
    return campo.options.filter(option => chosen.includes(option.value)).map(option => option.label).join(", ");
  }
  if (campo.type === "date") return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
  return typeof value === "number" ? String(value) : a(value);
}
/** «Rol: Propietario»: el dato después de su rótulo impreso. */
const tras = (label: string, value: string) => `${label}: ${value}`.trimEnd();
const casillas = (campo: Campo, value: unknown): Marca[] => (campo.options ?? []).map(option => ({ text: option.label, check: Array.isArray(value) ? value.includes(option.value) : option.value === value }));

/** Celda del documento: un dato solo; varios en un renglón con su rótulo; o casillas cuando la plantilla las imprime. */
function celda(c: Celda, d: Data): FormCell {
  const keys = c.campos.filter(campo => !campo.sistema).map(campo => campo.key);
  const cell = { q: c.q, w: c.w, ...(keys.length ? { keys } : {}) };
  if (c.marcas) {
    // Una lista de opciones sin rótulo propio empieza renglón (como el motivo de un incidente); lo demás sigue en el renglón.
    const lines: Marca[][] = [];
    for (const campo of c.campos) {
      const parts: Marca[] = campo.options ? [...(campo.corto ? [{ text: `${campo.corto}:` }] : []), ...casillas(campo, d[campo.key])] : [{ text: tras(campo.corto ?? campo.label, valor(campo, d[campo.key])) }];
      if (!lines.length || (campo.options && !campo.corto) || campo.key === "incidenteMotivo") lines.push(parts);
      else lines[lines.length - 1].push(...parts);
    }
    return { ...cell, a: "", marks: lines };
  }
  if (c.campos.length === 1) return { ...cell, a: valor(c.campos[0], d[c.campos[0].key]) };
  return { ...cell, a: c.campos.map(campo => tras(campo.corto ?? campo.label, valor(campo, d[campo.key]))).join(GAP) };
}

export function levantamientoDocumento(id: LevantamientoId, d: Data, contexto: DocumentoContexto = {}): Documento {
  const imagen = (key: string) => typeof d[key] === "string" ? contexto.imagenes?.[d[key] as string] : undefined;
  const banda: Block = { kind: "label", text: `INMUEBLE  ·  ${LEVANTAMIENTO_TIPO[id]}`, size: 8.5 };
  const blocks: Block[] = PLANTILLAS[id].flatMap<Block>(parte => {
    switch (parte.kind) {
      case "form": return [{ kind: "form", ...(parte.label ? { label: parte.label } : {}), rows: parte.rows.map(row => row.map(c => celda(c, d))) }];
      case "foto": return [
        { kind: "form", label: "01 Fotografía principal", rows: [] },
        { kind: "image", label: id === "04A" ? "Vista principal del terreno" : "Fachada o vista principal", image: imagen("fotoPrincipalId"), height: 150, keys: ["fotoPrincipalId"] },
        { kind: "form", rows: [
          [{ q: "ID de fotografía", a: fotoId(d.fotoPrincipalId), w: 2, keys: ["fotoPrincipalId"] },
            celda({ q: "Fecha y hora de toma", w: 2, campos: [{ key: "fotoFecha", label: "Fecha de toma", type: "date", corto: "Fecha" }, { key: "fotoHora", label: "Hora de toma", corto: "Hora" }] }, d),
            celda({ q: "Dirección de la toma", w: 2, campos: [{ key: "fotoDireccion", label: "Dirección de la toma" }] }, d)],
          parte.extra.map(c => celda(c, d)),
        ] },
      ];
      case "tabla": return [
        { kind: "form", label: parte.label, rows: [] },
        { kind: "grid", widths: parte.widths, header: [parte.header, ...parte.columns.map(([, label]) => label)], labels: true, minRow: 26,
          rows: parte.rows.map(([row, label]) => [label, ...parte.columns.map(([suffix]) => a(d[`${row}${suffix}`]))]),
          keys: parte.rows.map(([row]) => [undefined, ...parte.columns.map(([suffix]) => [`${row}${suffix}`])]) },
      ];
      case "unidades": {
        const columns = LEVANTAMIENTO_TABLES.unidades.columns, rows = filas(d.unidades);
        return [
          { kind: "form", label: parte.label, rows: [] },
          { kind: "grid", widths: [1.3, 2.4, 1.2, 1.4, 1.9], header: columns.map(column => column.label), minRow: 20, zona: { keys: ["unidades"], label: "Unidades del conjunto" },
            rows: (rows.length ? rows : [{}, {}, {}]).map(row => columns.map(column => a(row[column.key]))) },
        ];
      }
      case "croquis": return [
        { kind: "form", label: parte.label, rows: [] },
        { kind: "image", label: "Croquis o mapa del inmueble", image: imagen("croquisId"), height: 130, keys: ["croquisId"] },
      ];
      case "nota": return [{ kind: "note", text: parte.text }];
      case "grupo": return [{ kind: "title", text: parte.text, bold: true, size: 22 }, banda];
    }
  });
  return { title: LEVANTAMIENTO_TITLES[id], subject: `Formato ${id} · ${a(d.folio)}`, blocks };
}
