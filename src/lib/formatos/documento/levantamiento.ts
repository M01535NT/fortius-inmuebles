import type { FormatoField } from "../catalog";
import { LEVANTAMIENTO_TABLES, LEVANTAMIENTO_TITLES, levantamientoFields, type LevantamientoId } from "../levantamiento";
import { a, fecha, filas, junta, type Block, type Documento, type DocumentoContexto } from "./modelo";

/*
  04A–04G · Levantamientos, con el diseño de sus plantillas (Metodología/04*.docx):
  identificación, fotografía principal, control de la visita, características en tablas
  (superficies, datos técnicos, componentes y servicios), croquis, respaldo y discrepancias.
  Las secciones salen de los campos del panel, que siguen el orden de cada plantilla.
*/

type Data = Record<string, unknown>;
type Cell = { q: string; a: string; w: number };
const KIND: Record<LevantamientoId, string> = { "04A": "Terreno", "04B": "Casa habitación", "04C": "Departamento", "04D": "Oficina", "04E": "Local comercial", "04F": "Nave o bodega", "04G": "Plaza o conjunto" };
const BASE: Record<string, string> = { D: "D declarado", O: "O observado", M: "M medido", C: "C comprobado", NV: "NV no verificado", NA: "NA no aplica" };
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const sectionTitle = (section: string) => section.replace(" / ", " ");
const choiceLabel = (field: FormatoField, value: unknown) => field.options?.find(o => o.value === value)?.label ?? a(value);
/** Parte una lista de celdas en renglones de dos. */
const pairs = (cells: Cell[]): Cell[][] => cells.reduce<Cell[][]>((rows, cell, i) => (i % 2 ? rows[rows.length - 1].push(cell) : rows.push([cell]), rows), []).map(row => row.length === 1 ? [{ ...row[0], w: 6 }] : row);

/** Bloques de una sección de características: datos técnicos, componentes/servicios y textos. */
function section(name: string, fields: FormatoField[], d: Data): Block[] {
  const keys = new Set(fields.map(field => field.key));
  const used = new Set<string>();
  const blocks: Block[] = [];
  const technical = fields.filter(field => keys.has(`${field.key}Base`) && keys.has(`${field.key}Referencia`));
  if (technical.length) {
    technical.forEach(field => ["", "Base", "Referencia"].forEach(s => used.add(field.key + s)));
    blocks.push({ kind: "grid", widths: [3, 2, 2, 4], header: ["Concepto", "Dato", "Base", "Referencia o evidencia"], rows: technical.map(field => [field.label, a(d[field.key]), BASE[String(d[`${field.key}Base`])] ?? a(d[`${field.key}Base`]), a(d[`${field.key}Referencia`])]) });
  }
  const paired = fields.filter(field => /(Condicion|Situacion)$/.test(field.key));
  if (paired.length) {
    const condition = paired[0].key.endsWith("Condicion");
    paired.forEach(field => { used.add(field.key); used.add(field.key.replace(/(Condicion|Situacion)$/, condition ? "Evidencia" : "Base")); });
    blocks.push({ kind: "grid", widths: [3, 5, 3], header: condition ? ["Componente", "Material o acabado y estado visible", "Base y evidencia"] : ["Servicio", "Características y estado de disponibilidad", "Base y referencia"],
      rows: paired.map(field => { const base = field.key.replace(/(Condicion|Situacion)$/, condition ? "Evidencia" : "Base"); return [field.label.split(":")[0], a(d[field.key]), a(d[base])]; }) });
  }
  const units = fields.find(field => field.key === "unidades");
  if (units) {
    used.add("unidades");
    const columns = LEVANTAMIENTO_TABLES.unidades.columns;
    blocks.push({ kind: "grid", widths: columns.map(() => 1), header: columns.map(c => c.label), rows: (filas(d.unidades).length ? filas(d.unidades) : [{}, {}]).map(r => columns.map(c => a(r[c.key]))) });
  }
  const rest = fields.filter(field => !used.has(field.key));
  if (rest.length) blocks.push({ kind: "form", rows: pairs(rest.map(field => ({ q: field.label, a: field.type === "choice" ? choiceLabel(field, d[field.key]) : f(d[field.key]), w: 3 }))) });
  return [{ kind: "form", label: sectionTitle(name), rows: [] }, ...blocks];
}

export function levantamientoDocumento(id: LevantamientoId, d: Data, contexto: DocumentoContexto = {}): Documento {
  const fields = levantamientoFields(id);
  const byKey = new Map(fields.map(field => [field.key, field]));
  const foto = typeof d.fotoPrincipalId === "string" ? contexto.imagenes?.[d.fotoPrincipalId] : undefined;
  const croquis = typeof d.croquisId === "string" ? contexto.imagenes?.[d.croquisId] : undefined;
  const label = (key: string) => byKey.get(key)?.label ?? key;
  const tech = (key: string) => junta(d[key], BASE[String(d[`${key}Base`])], d[`${key}Referencia`]);
  // Datos bajo la fotografía principal: los descriptores técnicos del tipo, o uso, forma y acceso en terreno.
  const photoSection = fields.filter(field => field.section === "01 / Fotografía principal" && !["fotoPrincipalId", "fechaFoto", "horaFoto", "direccionFoto"].includes(field.key) && !/(Base|Referencia)$/.test(field.key));
  const descriptors = photoSection.map(field => ({ q: field.label, a: byKey.has(`${field.key}Base`) ? tech(field.key) : a(d[field.key]), w: 2 }));
  const inner = fields.filter(field => {
    const n = Number(field.section?.slice(0, 2));
    return n >= 4 && !["croquisId", "coordenadas", "fuenteCroquis", "accesoEntorno", "respaldosEstado", "respaldos", "discrepanciasEstado", "discrepancias", "areasNoAccesibles", "indiciosEspecialista", "incidentes", "elaboro", "reviso", "siguienteAccion", "siguienteFecha"].includes(field.key);
  });
  const sections = [...new Set(inner.map(field => field.section!))];
  const surfaces = fields.filter(field => field.key.endsWith("Declarada")).map(field => field.key.replace(/Declarada$/, ""));
  const croquisSection = sectionTitle(byKey.get("croquisId")?.section ?? "07 / Croquis de ubicación y acceso");
  const respaldoSection = sectionTitle(byKey.get("respaldosEstado")?.section ?? "08 / Respaldo");
  const discrepSection = sectionTitle(byKey.get("discrepanciasEstado")?.section ?? "09 / Discrepancias y pendientes");
  const inmueble: Block = { kind: "form", label: `INMUEBLE  ·  ${KIND[id]}`, rows: [] };

  const blocks: Block[] = [
    { kind: "title", text: LEVANTAMIENTO_TITLES[id], bold: true, size: 26 },
    { kind: "form", rows: [
      [{ q: "ID inmueble", a: a(d.idInmueble), w: 2 }, { q: "ID operación", a: a(d.folio), w: 2 }, { q: "Unidad o conjunto", a: a(d.unidad), w: 2 }],
      [{ q: "Domicilio observado o referencia física", a: a(d.inmueble), w: 6 }],
      [{ q: "Colonia o zona", a: a(d.colonia), w: 2.5 }, { q: "Municipio y estado", a: a(d.municipioEstado), w: 2.5 }, { q: "C. P.", a: a(d.codigoPostal), w: 1 }],
    ] },
    { kind: "form", label: "01 Fotografía principal", rows: [] },
    { kind: "image", label: id === "04A" ? "Vista principal del terreno" : "Fachada o vista principal", image: foto, height: 190 },
    { kind: "form", rows: [
      [{ q: "ID de fotografía", a: junta(foto?.caption, typeof d.fotoPrincipalId === "string" ? `FOTO-${d.fotoPrincipalId.slice(0, 8)}` : ""), w: 2 }, { q: "Fecha y hora de toma", a: junta(f(d.fechaFoto), d.horaFoto), w: 2 }, { q: "Dirección de la toma", a: a(d.direccionFoto), w: 2 }],
      ...descriptors.reduce<Cell[][]>((rows, cell, i) => (i % 3 ? rows[rows.length - 1].push(cell) : rows.push([cell]), rows), []),
    ] },
    { kind: "form", label: "02 Control de la visita", rows: [
      [{ q: "Fecha de visita", a: f(d.fechaVisita), w: 2 }, { q: "Hora inicio y término", a: d.horaInicio || d.horaTermino ? `${a(d.horaInicio)} a ${a(d.horaTermino)}` : "", w: 2 }, { q: "Asesor responsable", a: a(d.asesor), w: 2 }],
      [{ q: "Finalidad del levantamiento", a: a(d.finalidad), w: 3 }, { q: "Ocupación y alcance", a: a(d.ocupacion), w: 3 }],
      [{ q: "Acceso autorizado y acompañante por rol", a: a(d.accesoAutorizado), w: 3 }, { q: "Permiso para foto y medición", a: junta(d.permisoFoto ? `Foto: ${choiceLabel(byKey.get("permisoFoto")!, d.permisoFoto)}` : "", d.permisoMedicion ? `Medición: ${choiceLabel(byKey.get("permisoMedicion")!, d.permisoMedicion)}` : "", d.referenciaPermiso), w: 3 }],
    ] },
    { kind: "note", text: "En campos técnicos anote base y referencia: D declarado · O observado · M medido orientativamente · C comprobado con evidencia · NV no verificado · NA no aplica. Lo desconocido no equivale a cero." },
    { kind: "note", text: "Inspección visual no pericial. No certifica superficies, seguridad ni uso autorizado. Ante riesgo suspenda el recorrido, registre lo ocurrido y derive a revisión competente." },

    { kind: "pagebreak" },
    { kind: "title", text: "Características del inmueble", bold: true, size: 26 },
    inmueble,
    { kind: "form", label: "03 Superficies y fuentes", rows: [] },
    { kind: "grid", widths: [3, 1.6, 1.6, 1.8, 3.4], header: ["Concepto en m²", "Declarada", "Documental", "Medida orientativa", "Fuente o método"], rows: surfaces.map(key => [label(`${key}Declarada`).split(":")[0], a(d[`${key}Declarada`]), a(d[`${key}Documental`]), a(d[`${key}Medida`]), a(d[`${key}Fuente`])]) },
    { kind: "note", text: "Identifique documento, fecha y página; para M, instrumento, método y responsable. No sume áreas de distinta naturaleza. Si no se midió, anote NV." },
    ...sections.flatMap(name => section(name, inner.filter(field => field.section === name), d)),

    { kind: "pagebreak" },
    { kind: "title", text: "Ubicación y evidencias", bold: true, size: 26 },
    inmueble,
    { kind: "form", label: croquisSection, rows: [] },
    { kind: "image", label: "Croquis o mapa del inmueble", image: croquis, height: 190 },
    { kind: "form", rows: [
      [{ q: "Coordenadas y punto de referencia", a: a(d.coordenadas), w: 3 }, { q: "Fuente del croquis y fecha", a: junta(croquis?.source, d.fuenteCroquis), w: 3 }],
      [{ q: "Acceso, vialidad y entorno inmediato", a: a(d.accesoEntorno), w: 6 }],
    ] },
    { kind: "form", label: respaldoSection.replace(/Respaldo$/, "Documentos y fotografías de respaldo"), rows: [] },
    { kind: "grid", widths: [2, 5, 3], header: ["ID fuente o foto", "Documento o zona y descripción", "Fecha y ubicación del archivo"],
      rows: d.respaldosEstado === "sin_respaldo" ? [["—", "Sin respaldo disponible", "—"]] : (filas(d.respaldos).length ? filas(d.respaldos) : [{}, {}]).map(r => [a(r.id), a(r.descripcion), junta(f(r.fecha), r.archivo)]) },
    { kind: "form", label: discrepSection, rows: [] },
    { kind: "grid", widths: [2.5, 4.5, 3], header: ["Dato o zona", "Declarado frente a observado o documento", "Acción y responsable"],
      rows: d.discrepanciasEstado === "ninguna" ? [["—", "Ninguna detectada dentro del alcance", "—"]] : (filas(d.discrepancias).length ? filas(d.discrepancias) : [{}, {}]).map(r => [a(r.zona), a(r.contraste), junta(r.accion, r.responsable)]) },
    { kind: "form", rows: [
      [{ q: "Áreas no accesibles e indicios que requieren especialista", a: junta(d.areasNoAccesibles, d.indiciosEspecialista), w: 6 }],
      [{ q: "Incidente, suspensión o cambio de alcance", a: a(d.incidentes), w: 6 }],
      [{ q: "Elaboró y revisó la captura", a: junta(d.elaboro ? `Elaboró: ${a(d.elaboro)}` : "", d.reviso ? `Revisó: ${a(d.reviso)}` : ""), w: 3 }, { q: "Siguiente acción y fecha", a: junta(d.siguienteAccion, f(d.siguienteFecha)), w: 3 }],
    ] },
  ];
  return { title: LEVANTAMIENTO_TITLES[id], subject: `Formato ${id} · ${a(d.folio)}`, blocks };
}
