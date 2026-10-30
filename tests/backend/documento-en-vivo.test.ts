import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { crearMaquetador, renderDocumentoPdf, type Maqueta } from "@/lib/formatos/documento/pdf";
import { levantamientoDocumento } from "@/lib/formatos/documento/levantamiento";
import { LEVANTAMIENTO_TITLES, levantamientoFields, type LevantamientoId } from "@/lib/formatos/levantamiento";
import { letterheadBounds } from "@/lib/letterhead";
import { loadLetterhead } from "@/lib/letterhead-server";

/*
  Captura sobre el documento (EXT-12): la pantalla dibuja los mismos trazos que el PDF, cada
  espacio por llenar es una zona pulsable y, con el acomodo del 04A, ninguna hoja queda a medias.
*/
const IDS = Object.keys(LEVANTAMIENTO_TITLES) as LevantamientoId[];
async function assets() {
  const [regular, bold] = await Promise.all([readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf"))]);
  return { regular, bold, ...await loadLetterhead() };
}
/** Un dato de ejemplo en cada campo, para medir el documento lleno. */
function lleno(id: LevantamientoId): Record<string, unknown> {
  return Object.fromEntries(levantamientoFields(id).filter(field => field.type !== "levantamientoRows").map(field => [field.key,
    field.type === "number" ? 3 : field.type === "choice" ? field.options![0].value : field.type === "multi" ? field.options!.slice(0, 2).map(option => option.value) : field.type === "date" ? "2026-10-27" : field.type === "time" ? "10:00" : `Ejemplo ${field.key}`]));
}
/** Parte usada del área de texto de cada hoja: del margen superior al trazo más bajo, sin el membrete. */
function uso(maqueta: Maqueta): number[] {
  const { top, bottom } = letterheadBounds(), arriba = maqueta.height - top;
  return maqueta.pages.map(trazos => {
    const ys = trazos.flatMap(t => t.kind === "text" || t.kind === "rect" || t.kind === "image" ? [t.y] : []).filter(y => y >= bottom && y <= arriba);
    return ys.length ? (arriba - Math.min(...ys)) / (arriba - bottom) : 0;
  });
}

describe("captura sobre el documento", () => {
  it("en cada levantamiento todo campo tiene su zona, la vista tiene las hojas del PDF y ninguna hoja queda a medias", async () => {
    const files = await assets(), maquetar = await crearMaquetador(files);
    for (const id of IDS) for (const data of [{ folio: "EXP-000021" }, lleno(id)]) {
      const doc = levantamientoDocumento(id, data);
      const maqueta = await maquetar(doc);
      const pdf = await PDFDocument.load(await renderDocumentoPdf(doc, files));
      expect(maqueta.pages.length, id).toBe(pdf.getPageCount());
      // El folio y el ID del inmueble los pone el sistema.
      const covered = new Set(maqueta.zonas.flatMap(zona => zona.keys));
      expect(levantamientoFields(id).map(field => field.key).filter(key => key !== "folio" && key !== "idInmueble" && !covered.has(key)), id).toEqual([]);
      for (const zona of maqueta.zonas) {
        expect(zona.x).toBeGreaterThanOrEqual(0);
        expect(zona.x + zona.w).toBeLessThanOrEqual(maqueta.width + 0.01);
        expect(zona.y).toBeGreaterThan(0);
        expect(zona.y + zona.h).toBeLessThan(maqueta.height);
      }
      // Estilo 04A: salvo la última, cada hoja se usa al menos en un 70 %.
      for (const [page, used] of uso(maqueta).slice(0, -1).entries()) expect(used, `${id}, hoja ${page + 1}`).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("lo capturado aparece en la hoja con el membrete y las casillas dibujadas; el título no se repite", async () => {
    const maqueta = await (await crearMaquetador(await assets()))(levantamientoDocumento("04B", { folio: "EXP-000021", tipoVivienda: "Casa sola en privada", finalidad: "renta", espaciosServicio: ["sala", "patio"] }));
    const textos = maqueta.pages.flatMap(page => page.flatMap(t => t.kind === "text" ? [t.text] : []));
    expect(textos).toContain("Casa sola en privada");
    expect(textos.filter(text => text === "Levantamiento de casa habitación")).toHaveLength(maqueta.pages.length);
    expect(maqueta.pages[0].flatMap(t => t.kind === "image" ? [t.href] : [])).toEqual(["/brand/membrete-encabezado.png", "/brand/membrete-pie.png"]);
    // Las opciones marcadas llevan la X de su casilla y su texto en negritas, una o varias.
    const negritas = maqueta.pages.flatMap(page => page.flatMap(t => t.kind === "text" && t.bold ? [t.text] : []));
    expect(negritas).toEqual(expect.arrayContaining(["Renta", "Sala", "Patio"]));
    expect(negritas).not.toContain("Comedor");
    for (const t of maqueta.pages.flat()) if (t.kind === "text" && t.text.trim()) expect(t.w).toBeGreaterThan(0);
  });

  it("en la entrevista 02 todo campo que se pide tiene su zona y la vista tiene las hojas del PDF", async () => {
    const { entrevistaDocumento } = await import("@/lib/formatos/documento/entrevista");
    const { entrevistaFields, mostrarCampoEntrevista } = await import("@/lib/formatos/entrevista");
    const files = await assets(), maquetar = await crearMaquetador(files);
    const ejemplo = (key: string, type: string, options?: readonly { value: string }[]) => type === "choice" ? options![options!.length - 1].value : type === "money" ? 4600000 : type === "date" ? "2026-10-28" : type === "time" ? "10:00" : `Ejemplo ${key}`;
    for (const data of [{ folio: "EXP-000021" }, Object.fromEntries(entrevistaFields.map(field => [field.key, ejemplo(field.key, field.type, field.options)]))]) {
      const doc = entrevistaDocumento(data), maqueta = await maquetar(doc);
      expect(maqueta.pages.length).toBe((await PDFDocument.load(await renderDocumentoPdf(doc, files))).getPageCount());
      const covered = new Set(maqueta.zonas.flatMap(zona => zona.keys));
      expect(entrevistaFields.filter(field => field.key !== "folio" && mostrarCampoEntrevista(field.key, data) && !covered.has(field.key)).map(field => field.key)).toEqual([]);
      // Quien no es el propietario anota su nombre en la misma celda.
      expect(maqueta.zonas.some(zona => zona.keys.includes("propietario"))).toBe(true);
    }
  });

  it("en el aviso 01 todo campo que se pide tiene su zona, también los del representante, y la vista tiene las hojas del PDF", async () => {
    const { avisoDocumento } = await import("@/lib/formatos/documento/aviso");
    const { formatoById } = await import("@/lib/formatos/catalog");
    const { mostrarCampoAviso } = await import("@/lib/formatos/aviso");
    const files = await assets(), maquetar = await crearMaquetador(files);
    const fields = formatoById("01").fields;
    // Con representante, publicidad, transferencias y firma externa se piden todos los campos.
    const si = Object.fromEntries(fields.filter(field => field.type === "choice").map(field => [field.key, field.options!.some(o => o.value === "si") ? "si" : field.options![1].value]));
    const data = { ...Object.fromEntries(fields.map(field => [field.key, field.type === "date" ? "2026-10-28" : `Ejemplo ${field.key}`])), ...si, tipoTitular: "representante", representante: "Ana López", correoPrivacidad: "privacidad@example.com" };
    for (const values of [{ folio: "EXP-000021" }, data]) {
      const doc = avisoDocumento(values), maqueta = await maquetar(doc);
      expect(maqueta.pages.length).toBe((await PDFDocument.load(await renderDocumentoPdf(doc, files))).getPageCount());
      const covered = new Set(maqueta.zonas.flatMap(zona => zona.keys));
      expect(fields.filter(field => field.key !== "folio" && mostrarCampoAviso(field.key, values) && !covered.has(field.key)).map(field => field.key)).toEqual([]);
    }
  });

  it("en los formatos 05 a 10 todo campo tiene su zona y la vista tiene las hojas del PDF", async () => {
    const { DOCUMENTOS } = await import("@/lib/formatos/documento");
    const { mostrarCampoValor } = await import("@/lib/formatos/valor-fields");
    const { mostrarCampoIntermediacion } = await import("@/lib/formatos/intermediacion");
    const { mostrarCampoPlan } = await import("@/lib/formatos/plan");
    const { formatoById } = await import("@/lib/formatos/catalog");
    const files = await assets(), maquetar = await crearMaquetador(files);
    for (const id of ["05", "06", "07", "08", "09", "10"]) {
      const build = DOCUMENTOS[id], fields = formatoById(id).fields;
      expect(build, id).toBeDefined();
      if (!build) continue;
      const lleno = Object.fromEntries(fields.filter(field => field.type !== "juridicaRows").map(field => [field.key, field.type === "choice" ? field.options![0].value : field.type === "date" ? "2026-10-28" : `Ejemplo ${field.key}`]));
      for (const data of [{ folio: "EXP-000021" }, lleno]) {
        const doc = build(data, {}), maqueta = await maquetar(doc);
        expect(maqueta.pages.length, id).toBe((await PDFDocument.load(await renderDocumentoPdf(doc, files))).getPageCount());
        const covered = new Set(maqueta.zonas.flatMap(zona => zona.keys));
        expect(fields.filter(field => field.key !== "folio" && mostrarCampoValor(field.key, data) && mostrarCampoIntermediacion(field.key, data) && mostrarCampoPlan(field.key, data) && !covered.has(field.key)).map(field => field.key), id).toEqual([]);
      }
    }
  });

  it("en los formatos 11 a 19 todo campo tiene su zona y la vista tiene las hojas del PDF", async () => {
    const { DOCUMENTOS } = await import("@/lib/formatos/documento");
    const { formatoById } = await import("@/lib/formatos/catalog");
    const { mostrarCampoPromesa } = await import("@/lib/formatos/promesa");
    const files = await assets(), maquetar = await crearMaquetador(files);
    // Con cada sección condicional activada (respuesta registrada con contraoferta, pagos, publicidad contratada…).
    const activar: Record<string, Record<string, unknown>> = {
      "11": { publicidadEstado: "contratada", registroVisitas: "comprobado", contactosEstado: "comprobado", visitasEstado: "comprobado", ofertasEstado: "comprobado", estadoRespuestaPropietario: "recibida", entregaInformeEstado: "entregado" },
      "14": { estadoRespuesta: "registrada", decisionPropietario: "contraoferta", confirmacionVigencia: "Confirmada por escrito" },
    };
    for (const id of ["11", "12", "13", "14", "15", "16", "17", "18", "19"]) {
      const build = DOCUMENTOS[id], fields = formatoById(id).fields;
      expect(build, id).toBeDefined();
      if (!build) continue;
      const lleno = { ...Object.fromEntries(fields.filter(field => !/Rows$|^partidas$|^pagos$|^netoCargos$/.test(field.type)).map(field => [field.key, field.type === "choice" ? field.options![0].value : field.type === "date" ? "2026-10-28" : field.type === "time" ? "10:00" : field.type === "money" || field.type === "number" ? 1000 : `Ejemplo ${field.key}`])), ...activar[id] };
      const doc = build(lleno, {}), maqueta = await maquetar(doc);
      expect(maqueta.pages.length, id).toBe((await PDFDocument.load(await renderDocumentoPdf(doc, files))).getPageCount());
      const covered = new Set(maqueta.zonas.flatMap(zona => zona.keys));
      // El folio y el número de recibo los asigna el sistema.
      expect(fields.filter(field => !["folio", "numeroRecibo"].includes(field.key) && (id !== "15" || mostrarCampoPromesa(field.key, lleno)) && !covered.has(field.key)).map(field => field.key), id).toEqual([]);
    }
  });

  it("una tabla de filas variables es pulsable completa", async () => {
    const maqueta = await (await crearMaquetador(await assets()))(levantamientoDocumento("04G", { folio: "EXP-000021", unidades: [{ id: "L-1", tipo: "Local", area: "45", ocupacion: "Ocupado", acceso: "Medidor propio" }] }));
    expect(maqueta.zonas.filter(zona => zona.keys.includes("unidades"))).toHaveLength(1);
    expect(maqueta.pages.flat().some(t => t.kind === "text" && t.text === "Medidor propio")).toBe(true);
  });
});

describe("documento incompleto", () => {
  it("la vista y el PDF llevan la misma leyenda al pie de cada hoja; la promesa y el aviso no se emiten incompletos", async () => {
    const { avisoIncompleto } = await import("@/lib/formatos/catalog");
    const { createFormatoPdf } = await import("@/lib/formatos/pdf");
    expect(avisoIncompleto([])).toBeUndefined();
    expect(avisoIncompleto(["Uso de suelo"])).toBe("Documento incompleto: falta 1 dato");
    const maqueta = await (await crearMaquetador(await assets()))({ ...levantamientoDocumento("04B", { folio: "EXP-000021" }), aviso: avisoIncompleto(["a", "b"]) });
    for (const page of maqueta.pages) expect(page.some(t => t.kind === "text" && t.text === "Documento incompleto: faltan 2 datos")).toBe(true);
    // Sin fotografía elegida, el levantamiento incompleto sale con su recuadro vacío.
    const pdf = await PDFDocument.load(await createFormatoPdf("04B", { folio: "EXP-000021" }, [], { incompleto: true }));
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    await expect(createFormatoPdf("04B", { folio: "EXP-000021" })).rejects.toThrow(/Faltan datos/);
    await expect(createFormatoPdf("15", { folio: "EXP-000021" }, [], { incompleto: true })).rejects.toThrow(/Faltan datos/);
  });
});
