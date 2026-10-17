import { a, fecha, type Block, type Documento } from "./modelo";

/*
  06 · Opinión jurídica del inmueble, con el diseño de su plantilla
  (Metodología/06.Opinion_juridica_del_inmueble.docx): título, banda de destinatario,
  secciones numeradas en prosa y firma del abogado. El contenido lo redacta el profesional
  en el panel; aquí sólo se acomoda en la sección que corresponde.
*/

type Data = Record<string, unknown>;
/** Un párrafo con sangría por cada párrafo capturado; si falta, la línea para completarlo. */
const prosa = (value: unknown, strong = false): Block[] => {
  const parts = a(value).split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean);
  return (parts.length ? parts : ["____________________"]).map(text => ({ kind: "p", text, indent: true, strong }));
};

export function opinionJuridicaDocumento(d: Data): Documento {
  const corte = d.fechaEmision ? fecha(d.fechaEmision) : "____________________";
  const blocks: Block[] = [
    { kind: "title", text: "Opinión jurídica del inmueble", bold: true },
    { kind: "caption", text: "Factibilidad para comercialización y cierre notarial" },
    { kind: "fields", dark: true, widths: [2200, 8024], rows: [["Destinatario", a(d.destinatario) || "____________________"], ["Inmueble", a(d.inmueble) || "____________________"], ["Operación y etapa", a(d.operacion) || "____________________"], ["Fecha de corte", corte]] },
    { kind: "numbered", num: "01", text: "Conclusión" },
    ...prosa(d.conclusion, true),
    ...prosa(d.sustento),
    { kind: "numbered", num: "02", text: "Objeto y alcance del análisis" },
    ...prosa(d.objeto),
    ...prosa(d.alcance),
    { kind: "p", indent: true, text: "Los puntos que requieran certificación registral, intervención notarial, cálculo fiscal o revisión física se identifican como pendientes cuando afecten la conclusión." },
    { kind: "numbered", num: "03", text: "Antecedentes documentales relevantes" },
    ...prosa(d.antecedentes),
    { kind: "numbered", num: "04", text: "Análisis jurídico" },
    { kind: "h2", text: "Titularidad y facultades para disponer" },
    ...prosa(d.titularidad),
    { kind: "h2", text: "Situación registral e identidad del inmueble" },
    ...prosa(d.registro),
    { kind: "h2", text: "Impedimentos y condiciones de la operación" },
    ...prosa(d.impedimentos),
    { kind: "numbered", num: "05", text: "Recomendaciones y condiciones" },
    ...prosa(d.recomendaciones),
    ...prosa(d.responsables),
    { kind: "numbered", num: "06", text: "Documentos revisados" },
    ...prosa(d.documentos),
    { kind: "numbered", num: "07", text: "Vigencia y límites de la opinión" },
    { kind: "p", indent: true, text: `Esta opinión tiene fecha de corte ${corte}. Las condiciones pendientes continúan hasta que su cumplimiento quede acreditado.` },
    ...prosa(d.actualizacion),
    ...prosa(d.limites),
    { kind: "signatures", parties: [{ role: "Abogado responsable", name: [a(d.abogado) || "____________________", d.cedula ? `Cédula profesional ${a(d.cedula)}` : ""].filter(Boolean).join("\n") }] },
  ];
  return { title: "Opinión jurídica del inmueble", subject: `Formato 06 · ${a(d.folio)}`, estilo: "opinion", blocks };
}
