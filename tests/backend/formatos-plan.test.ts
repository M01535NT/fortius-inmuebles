import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { calcularPrecioTecnico, CANALES, DECISIONES, MATERIALES } from "@/lib/formatos/plan";
import { planDocumento } from "@/lib/formatos/documento/plan";
import { financialPdfPages } from "../helpers/financial-pdf";

/* 10 · Plan de comercialización con la plantilla del 26/10/2026 (aprobada el 29/10/2026). */
const plan = {
  folio: "EXP-10", inmueble: "Ejemplo · Casa en Tijuana", propietario: "Ejemplo · Propietaria", folioReal: "Ejemplo 123", contrato09: "EXP-10 · 4 de octubre de 2026",
  asesor: "Asesor de ejemplo", fecha: "2026-10-04", operacion: "Venta",
  tipoInmueble: "casa", claveCatastral: "AB-123", terreno: 160, construccion: 200, anioConstruccion: "2015", recamaras: 3, banos: 2, mediosBanos: 1, estacionamientos: 2,
  situacionLegal: "escriturado", gravamen: "no", regimen: "condominio", cuotaMantenimiento: 1200, servicios: ["Escuelas", "Zona con vigilancia"],
  comparables: [
    { direccion: "Ejemplo 1", terreno: 150, construccion: 180, recamaras: 3, banos: 2, precio: 3600000, fuente: "Portal, 01/10/2026" },
    { direccion: "Ejemplo 2", terreno: 170, construccion: 220, recamaras: 3, banos: 2, precio: 4400000, fuente: "Cierre, 15/09/2026" },
  ],
  ajustes: ["Remodelación"], valorReferencia07: 4000000, precioRecomendado: 4050000, precioSalida: 4100000, margen: "3 %, por comparables de cierre",
  perfil1Quien: "Familia joven", perfil1Motivo: ["Primera vivienda"], perfil2Motivo: ["Inversión"],
  mediosConsulta: "WhatsApp y teléfono", plazoRespuesta: "Mismo día", horariosVisita: "Sábados 10 a 13",
  preparacion: ["Verificar focos y luminarias"],
  materiales: MATERIALES.map(([key]) => ({ concepto: key, incluye: key === "fotografias" ? "Incluye" : "No aplica" })),
  canales: CANALES.map(([key]) => ({ concepto: key, autorizado: key === "letrero" ? "No" : "Sí" })),
  extras: [], fechaInicio: "2026-10-05", responsableCampana: "Asesor de ejemplo", corte7: "2026-10-11", corte14: "2026-10-18", corte21: "2026-10-25",
  medioReporte: "Correo", frecuenciaReporte: "Cada 15 días", proximoReporte: "2026-10-20", responsableReporte: "Asesor de ejemplo",
  decisiones: DECISIONES.map(([key]) => ({ concepto: key, alcance: "Aprobado por correo" })),
  aceptadoPor: "Ejemplo · Propietaria", fechaAceptacion: "2026-10-04", medioAceptacion: "Correo", siguienteAccion: "Sesión de fotografías", responsableSiguiente: "Asesor de ejemplo", fechaSiguiente: "2026-10-05",
};

it("emite el plan con la plantilla nueva: secciones, casillas marcadas y el precio técnico calculado", async () => {
  expect(validateFormato("10", plan)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("10", plan));
  expect(pdf.getTitle()).toBe("Plan de comercialización");
  const text = financialPdfPages(pdf).join(" ").replace(/\s+/g, " ");
  for (const section of ["1 El inmueble", "2 Precio de salida", "3 A quién se dirigirá la comercialización", "4 Del anuncio a la oferta", "5 Preparación y materiales", "6 Dónde se publicará", "7 Calendario y revisiones", "8 Seguimiento y responsabilidades", "9 Decisiones para iniciar y aprobación"]) expect(text).toContain(section);
  // (3,600,000 / 180 + 4,400,000 / 220) / 2 = 20,000 $/m²; por 200 m² construidos = 4,000,000.
  expect(calcularPrecioTecnico(plan)).toEqual({ promedio: 20000, tecnico: 4000000, usados: 2 });
  expect(text).toContain("$20,000.00");
  expect(text).toContain("$4,000,000.00");
});

it("las casillas marcan solo lo elegido y el tipo de inmueble usa la lista única de siete", () => {
  const cells = planDocumento(plan).blocks.flatMap(block => block.kind === "form" ? block.rows.flat() : []);
  const marcadas = (q: string) => cells.find(cell => cell.q === q)?.marks?.flat().filter(mark => mark.check).map(mark => mark.text);
  expect(marcadas("Tipo de inmueble")).toEqual(["Casa"]);
  expect(cells.find(cell => cell.q === "Tipo de inmueble")?.marks?.flat().length).toBe(7);
  expect(marcadas("Operación")).toEqual(["Venta"]);
  expect(marcadas("Servicios y entorno cercano")).toEqual(["Escuelas", "Zona con vigilancia"]);
  expect(marcadas("Gravámenes o hipotecas")).toEqual(["No"]);
  expect(marcadas("Motivo de compra · perfil principal")).toEqual(["Primera vivienda"]);
  // Sin datos no se marca nada ni se inventa un precio.
  const empty = planDocumento({}).blocks.flatMap(block => block.kind === "form" ? block.rows.flat() : []);
  expect(empty.flatMap(cell => cell.marks?.flat() ?? []).some(mark => mark.check)).toBe(false);
  expect(calcularPrecioTecnico({})).toEqual({ promedio: null, tecnico: null, usados: 0 });
});

it("rechaza cortes fuera de orden, importes negativos y opciones que no son de la plantilla", () => {
  expect(validateFormato("10", { ...plan, corte14: "2026-10-10" })).toContain("Cortes de los días 7, 14 y 21");
  expect(validateFormato("10", { ...plan, corte7: "2026-10-01" })).toContain("Cortes de los días 7, 14 y 21");
  expect(validateFormato("10", { ...plan, comparables: [{ direccion: "X", precio: -1 }] })).toContain("Inmuebles comparables");
  expect(validateFormato("10", { ...plan, canales: [{ concepto: "portales", autorizado: "Quizá" }] })).toContain("Dónde se publicará");
  expect(validateFormato("10", { ...plan, materiales: [{ concepto: "otra cosa" }] })).toContain("Materiales de difusión");
  expect(validateFormato("10", { ...plan, servicios: ["Playa"] })).toContain("Servicios y entorno cercano");
  expect(validateFormato("10", { ...plan, precioSalida: 0 })).toContain("Precio de salida autorizado por el propietario");
  // El monto del gravamen solo se pide si lo hay.
  expect(validateFormato("10", { ...plan, gravamen: "si", montoGravamen: "mucho" })).toContain("Monto del gravamen");
  expect(validateFormato("10", { ...plan, gravamen: "no", montoGravamen: "mucho" })).not.toContain("Monto del gravamen");
});
