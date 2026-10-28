import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { PDFDocument } from "pdf-lib";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { BLANK, m } from "@/lib/formatos/documento/modelo";
import { planDocumento } from "@/lib/formatos/documento/plan";
import { intermediacionDocumento } from "@/lib/formatos/documento/intermediacion";
import { entrevistaDocumento } from "@/lib/formatos/documento/entrevista";
import { junta } from "@/lib/formatos/documento/modelo";
import { levantamientoDocumento } from "@/lib/formatos/documento/levantamiento";
import { imageInfo } from "@/lib/formatos/documento/imagen";
import { revisionJuridicaDocumento } from "@/lib/formatos/documento/revision-juridica";
import { opinionJuridicaDocumento } from "@/lib/formatos/documento/opinion-juridica";
import { netoDocumento } from "@/lib/formatos/documento/neto";
import { valorDocumento } from "@/lib/formatos/documento/valor";
import { DOCUMENTOS } from "@/lib/formatos/documento";
import { compradorDocumento } from "@/lib/formatos/documento/comprador";
import { promesaDocumento } from "@/lib/formatos/documento/oferta-promesa";
import { PROMESA_ORIGINAL } from "@/lib/formatos/promesa-text";
import { documentoDocx } from "@/lib/formatos/documento/docx";
import { renderDocumentoPdf } from "@/lib/formatos/documento/pdf";
import { INTERMEDIACION_CLAUSES } from "@/lib/formatos/intermediacion-text";

const text = (blocks: ReturnType<typeof planDocumento>["blocks"]) => JSON.stringify(blocks);
const docxAssets = { encabezado: readFileSync("public/brand/membrete-encabezado.png"), pie: readFileSync("public/brand/membrete-pie.png") };
const assets = { ...docxAssets, regular: readFileSync("public/fonts/Archivo-Regular.ttf"), bold: readFileSync("public/fonts/Archivo-SemiBold.ttf") };

describe("documentos con el diseño de la plantilla", () => {
  it("el 10 usa el texto de la plantilla y deja la línea donde falta un dato", () => {
    const empty = planDocumento({});
    expect(empty.blocks[0]).toEqual({ kind: "title", text: "Plan de comercialización" });
    expect(empty.blocks[1]).toEqual({ kind: "p", text: `Proponemos ${BLANK} para alcanzar ${BLANK}. Este plan explica qué comunicaremos, cómo atenderemos a los interesados y qué revisaremos durante el lanzamiento. Encargo: ${BLANK}.` });
    expect(empty.blocks.filter(b => b.kind === "h1").map(b => "text" in b && b.text)).toEqual(["01 La estrategia para su inmueble", "02 Del anuncio a la oferta", "03 Preparación de la campaña", "04 Los primeros 21 días", "05 Seguimiento y decisiones"]);
    const filled = planDocumento({ estrategia: "Presentar la casa con fotografías", objetivo: "Vender en seis meses", propietario: "María Ramírez", folio: "EXP-10", fecha: "2026-10-04" });
    expect(text(filled.blocks)).toContain("Proponemos presentar la casa con fotografías para alcanzar vender en seis meses.");
    expect(text(filled.blocks)).toContain("\"label\":\"Propietario\",\"value\":\"María Ramírez\"");
    expect(text(filled.blocks)).toContain("4 de octubre de 2026");
  });
  it("los datos a mitad de frase empiezan en minúscula, salvo siglas", () => {
    expect([m("Cocina renovada"), m("OVC-07"), m("IVA incluido"), m("")]).toEqual(["cocina renovada", "OVC-07", "IVA incluido", BLANK]);
  });
  it("el 09 conserva sus cláusulas, llena el aviso y escribe la pena con letra, en estilo contrato", () => {
    const doc = intermediacionDocumento({ penaMaxima: 60000, medioAvisoPrivacidad: "correo electrónico", fechaAvisoPrivacidad: "2026-10-16", modalidad: "exclusiva", inicio: "2026-10-20", fin: "2027-01-17" });
    expect(doc.estilo).toBe("contrato");
    const clauses = doc.blocks.filter(b => b.kind === "clause" || b.kind === "p" && !b.text.startsWith("CONTRATO") && !b.text.startsWith("El CLIENTE comprende") && !b.text.startsWith("Leído"));
    expect(clauses).toHaveLength(INTERMEDIACION_CLAUSES.length);
    expect(doc.blocks.find(b => b.kind === "clause" && b.lead.startsWith("PRIMERA."))).toMatchObject({ lead: "PRIMERA. Encargo y límites." });
    expect(text(doc.blocks)).toContain("puesto a disposición del CLIENTE en correo electrónico, 16 de octubre de 2026");
    expect(text(doc.blocks)).toContain("sesenta mil pesos");
    expect(text(doc.blocks)).toContain("Plazo: 90 días naturales");
  });
  it("el 02 es la entrevista sencilla y muestra lo capturado, sin inventar respuestas", () => {
    const empty = entrevistaDocumento({});
    expect(empty.blocks.filter(b => b.kind === "form" && b.label).map(b => b.kind === "form" && b.label)).toEqual(["01 / Quién es", "02 / El inmueble", "03 / Por qué vende y cuánto espera", "04 / Siguiente paso · llena el asesor"]);
    expect(empty.blocks.flatMap(b => b.kind === "form" ? b.rows.flat().map(c => c.a) : []).every(answer => answer === "")).toBe(true);
    const filled = entrevistaDocumento({ entrevistado: "Laura Méndez", relacion: "propietario", estadoCivilActual: "casado", gravamen: "infonavit", fechaNacimiento: "1980-03-15", precioDeseado: 4600000, monedaPrecio: "MXN" });
    const cells = filled.blocks.flatMap(b => b.kind === "form" ? b.rows.flat() : []);
    const marcadas = (q: string) => cells.find(c => c.q === q)?.marks?.flat().filter(m => m.check).map(m => m.text);
    expect(marcadas("Estado civil")).toEqual(["Casado"]);
    expect(cells.find(c => c.q.startsWith("¿Quién es el propietario?"))?.a).toBe("Laura Méndez");
    expect(cells.find(c => c.q === "Fecha de nacimiento")?.a).toBe("15 de marzo de 1980");
    expect(marcadas("¿Tiene hipoteca o crédito?")).toEqual(["Infonavit"]);
    expect(empty.blocks.some(b => b.kind === "title")).toBe(false);
    expect(cells.find(c => c.q === "¿Cuánto quiere por el inmueble?")?.a).toBe("$4,600,000.00 MXN");
    expect(JSON.stringify(filled.blocks)).not.toMatch(/CURP|RFC|régimen|escritura inscrita|exención/i);
    expect(junta("Sí", "", "Sí", "correo")).toBe("Sí · correo");
  });
  it("los levantamientos siguen su Word con el acomodo del 04A: sin título repetido, base y referencia, respaldos ni discrepancias", () => {
    const casa = levantamientoDocumento("04B", { folio: "EXP-000021", idInmueble: "FORTIUS-000004", usoSuelo: "habitacional", tipoVivienda: "Casa sola", niveles: 2, finalidad: "venta", ocupacion: "ocupado", alcance: "completa", accesoAutorizado: "pendiente", acompananteRol: "Propietario", superficieTerreno: 160, murosEstado: "Block", plantaBaja: "Sala", espaciosServicio: ["sala", "patio"], horaInicio: "10:00", horaTermino: "11:30", fotoPrincipalId: "51000000-0000-4000-8000-000000000021" });
    const labels = casa.blocks.filter(b => b.kind === "form" && b.label).map(b => b.kind === "form" && b.label);
    expect(labels).toEqual(["01 Fotografía principal", "02 Control de la visita", "03 Superficies, si las tienes a la mano", "04 Distribución y características", "05 Componentes y condición visible", "06 Servicios e instalaciones", "07 Croquis de ubicación y acceso", "08 Pendientes y siguiente acción"]);
    // El título del formato va en el membrete; en la hoja solo los títulos de grupo, como en el 04A.
    expect(casa.blocks.filter(b => b.kind === "title").map(b => b.kind === "title" && b.text)).toEqual(["Características del inmueble", "Ubicación y evidencias"]);
    expect(casa.blocks.some(b => b.kind === "pagebreak")).toBe(false);
    const cells = casa.blocks.flatMap(b => b.kind === "form" ? b.rows.flat() : []);
    // Los ID los pone el sistema: no son pulsables.
    expect(cells.find(c => c.q === "ID operación")).toMatchObject({ a: "EXP-000021" });
    expect(cells.find(c => c.q === "ID operación")?.keys).toBeUndefined();
    expect(cells.find(c => c.q === "ID inmueble")?.keys).toBeUndefined();
    expect(cells.find(c => c.q === "ID de fotografía")?.a).toBe("FOTO-51000000");
    expect(cells.find(c => c.q === "Uso de suelo")?.a).toBe("Habitacional");
    expect(cells.find(c => c.q === "Terreno en m²")?.a).toBe("160");
    expect(cells.find(c => c.q === "Hora inicio y término")?.a).toMatch(/^Inicio: 10:00  {3} Término: 11:30$/);
    const distribucion = cells.find(c => c.q === "Distribución por planta y espacios de servicio");
    expect(distribucion?.marks?.map(line => line.map(m => `${m.check === undefined ? "" : m.check ? "x" : "-"}${m.text}`))).toEqual([
      ["Planta baja: Sala", "Alta:", "Otros niveles:"],
      ["xSala", "-Comedor", "-Lavado", "-Bodega", "xPatio", "-Jardín", "-Terraza"],
    ]);
    expect(cells.find(c => c.q === "Finalidad del levantamiento")?.marks?.flat().map(m => `${m.check ? "x" : "-"}${m.text}`)).toEqual(["xVenta", "-Renta", "-Valoración", "-Administración", "-Actualización"]);
    expect(cells.find(c => c.q === "Acceso autorizado y acompañante por rol")?.marks?.[0].map(m => m.text)).toEqual(["Sí", "No", "Pendiente", "Rol: Propietario"]);
    const grids = casa.blocks.filter(b => b.kind === "grid");
    expect(grids.map(g => g.kind === "grid" && g.header)).toEqual([["Componente", "Material o acabado y estado visible"], ["Servicio", "Características y estado de disponibilidad"]]);
    expect(grids[0].kind === "grid" && grids[0].rows[0]).toEqual(["Muros y estructura aparente", "Block"]);
    expect(grids[0].kind === "grid" && grids[0].keys?.[0]).toEqual([undefined, ["murosEstado"]]);
    expect(casa.blocks.filter(b => b.kind === "image").map(b => b.kind === "image" && b.keys)).toEqual([["fotoPrincipalId"], ["croquisId"]]);
    expect(JSON.stringify(casa.blocks)).not.toMatch(/Declarada|Documental|Base y|base y referencia|respaldo|Discrepancia|NV no verificado/);
    // La nave conserva su grupo de instalaciones industriales; la plaza, su tabla de unidades.
    expect(levantamientoDocumento("04F", {}).blocks.filter(b => b.kind === "title").map(b => b.kind === "title" && b.text)).toEqual(["Características del inmueble", "Instalaciones industriales", "Ubicación y evidencias"]);
    const plaza = levantamientoDocumento("04G", { tipoConjunto: "oficinas", unidades: [{ id: "P-3", tipo: "Oficina", area: "80", ocupacion: "Ocupada", acceso: "Común" }] });
    const unidades = plaza.blocks.find(b => b.kind === "grid" && b.zona?.keys.includes("unidades"));
    expect(unidades?.kind === "grid" ? unidades.rows : []).toEqual([["P-3", "Oficina", "80", "Ocupada", "Común"]]);
    expect(plaza.blocks.flatMap(b => b.kind === "form" ? b.rows.flat() : []).find(c => c.q === "Tipo y uso del conjunto")?.a).toMatch(/^Tipo: Edificio de oficinas/);
  });
  it("el 05 conserva sus 12 secciones y las 22 filas del control documental; el 06 acomoda la prosa en sus secciones", () => {
    const revision = revisionJuridicaDocumento({ documentos: [{ concepto: "D01", aplica: "si", estado: "recibido", referencia: "Escritura 4521" }] });
    const labels = revision.blocks.filter(b => b.kind === "form" && b.label && /^\d\d /.test(b.label)).map(b => b.kind === "form" && b.label?.slice(0, 2));
    expect(labels).toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
    const control = revision.blocks.find(b => b.kind === "grid" && b.header[0] === "Documento");
    expect(control?.kind === "grid" && control.rows).toHaveLength(22);
    expect(control?.kind === "grid" && control.rows[0]).toEqual(["D01 · Escritura o título", "Sí", "Recibido", "Escritura 4521", ""]);
    const opinion = opinionJuridicaDocumento({ conclusion: "Factible con condiciones.\n\nActualizar el certificado.", abogado: "Lic. Ana Torres", cedula: "1234567" });
    expect(opinion.estilo).toBe("opinion");
    expect(opinion.blocks.filter(b => b.kind === "numbered").map(b => b.kind === "numbered" && b.num)).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
    expect(opinion.blocks.filter(b => b.kind === "p" && b.strong).map(b => b.kind === "p" && b.text)).toEqual(["Factible con condiciones.", "Actualizar el certificado."]);
    expect(opinion.blocks.at(-1)).toMatchObject({ kind: "signatures", parties: [{ role: "Abogado responsable", name: "Lic. Ana Torres\nCédula profesional 1234567" }] });
  });
  it("el 08 sigue las barras de su hoja y no inventa el neto si la estimación está incompleta", () => {
    const incompleto = netoDocumento({ folio: "EXP-1", precioSugerido07: 4500000 });
    const bars = incompleto.blocks.filter(b => b.kind === "bar").map(b => b.kind === "bar" && b.text);
    expect(bars).toEqual(["08  /  Venta  /  Importes en MXN", "01  /  Precio y diferencia", "02  /  Erogaciones a cargo del propietario", "03  /  Lo que se estima recibirá el propietario", "Neto estimado"]);
    expect(incompleto.blocks.find(b => b.kind === "bar" && b.text === "Neto estimado")).toMatchObject({ right: "" });
    const tabla = incompleto.blocks.find(b => b.kind === "table");
    expect(tabla?.kind === "table" && tabla.rows).toHaveLength(11);
  });
  it("el 07 imprime sus diez secciones, como la plantilla, aunque falten datos", () => {
    const doc = valorDocumento({ folio: "QA-07", pesoMercado: 100, pesoIngresos: 0, pesoFisico: 0, baseMercado: "Construcción" });
    const secciones = doc.blocks.filter(b => b.kind === "bar" && b.big && /^\d+\./.test(b.text)).map(b => b.kind === "bar" && b.text.split(".")[0]);
    expect(secciones).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(valorDocumento({}).blocks.length).toBe(doc.blocks.length);
    expect(doc.blocks.find(b => b.kind === "bar" && b.text === "Valor comercial concluido")).toMatchObject({ right: "Pendiente" });
  });
  it("todos los formatos con plantilla se arman sin datos y en Word", async () => {
    expect(Object.keys(DOCUMENTOS).sort()).toEqual(["01", "02", "04A", "04B", "04C", "04D", "04E", "04F", "04G", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
    for (const [id, build] of Object.entries(DOCUMENTOS)) {
      const doc = build!({});
      expect(doc.blocks.length, id).toBeGreaterThan(3);
      expect((await Packer.toBuffer(documentoDocx(doc, docxAssets))).subarray(0, 2).toString(), id).toBe("PK");
    }
  });
  it("el 12 marca la opción capturada y la promesa conserva sus 26 cláusulas aun incompleta", () => {
    const perfil = compradorDocumento({ tipoInmueble: "casa" });
    expect(perfil.blocks.find(b => b.kind === "checks" && b.q === "¿Qué tipo de inmueble busca?")).toMatchObject({ selected: "casa" });
    const promesa = promesaDocumento({});
    expect(promesa.blocks.filter(b => b.kind === "h3")).toHaveLength(PROMESA_ORIGINAL.filter(p => /^\d{2}\s/.test(p)).length);
    expect(JSON.stringify(promesa.blocks)).not.toMatch(/\[[A-ZÁÉÍÓÚÑ]/);
  });
  it("lee tipo y tamaño de las imágenes PNG y JPEG", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 3, 0xe8, 0, 0, 1, 0xf4, 8]);
    expect(imageInfo(png)).toEqual({ tipo: "png", width: 1000, height: 500 });
    expect(imageInfo(Uint8Array.from([1, 2, 3]))).toBeNull();
  });
  it("el PDF del 10 sale en tamaño carta con su título; el del 09 sigue bloqueado", async () => {
    const plan = await PDFDocument.load(await renderDocumentoPdf(planDocumento({}), assets));
    expect(plan.getTitle()).toBe("Plan de comercialización");
    expect(plan.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    await expect(createFormatoPdf("09", {})).rejects.toThrow("Formato pendiente de cotejo con el original");
  });
  it("el Word se genera para el 09 y el 10", async () => {
    for (const doc of [planDocumento({}), intermediacionDocumento({})]) {
      const buffer = await Packer.toBuffer(documentoDocx(doc, docxAssets));
      expect(buffer.subarray(0, 2).toString()).toBe("PK");
    }
  });
});
