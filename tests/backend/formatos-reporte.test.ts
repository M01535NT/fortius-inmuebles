import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";

const reporte = {
  folio: "EXP-11", numeroReporte: "R-01", inmueble: "Casa en Tijuana", propietario: "María Ramírez",
  periodoInicio: "2026-10-05", periodoFin: "2026-10-11", asesor: "Ana López", contactoAsesor: "6640000000",
  fechaEmision: "2026-10-12", estadoReporte: "Corte 1", precioVigente: 3000000, moneda: "MXN",
  baseFiscal: "Precio sin gastos de escrituración", fechaPrecio: "2026-10-04", soportePrecio: "Correo de autorización",
  primeraPublicacion: "2026-10-05", diasActivos: 7, pausasPeriodo: "Ninguna", operacionEstado: "Venta en promoción",
  versionPlan: "Plan 10 v1", reportePrevio: "No hay", resumen: "Se publicó y hubo dos consultas",
  cambios: "No hubo cambios de precio ni estado", contactosEstado: "comprobado", contactos: 2,
  visitasEstado: "comprobado", visitas: 0, ofertasEstado: "comprobado", ofertas: 0,
  comparacion: "Primer periodo, sin comparación previa", canales: [
    { canal: "Sitio MNT", accion: "Ficha publicada el 05/10", resultado: "Dos consultas, registro 03" },
  ], comentarios: "Preguntaron por estacionamiento dos veces", interpretacion: "Interés inicial, muestra pequeña",
  respuestaPropuesta: "Aclarar el estacionamiento en la ficha",
  registroVisitas: "comprobado", agendadas: 0, realizadas: 0, canceladas: 0, reprogramadas: 0, pendientes: 0,
  ofertasActualizadas: "Ninguna", oportunidades: [],
  publicidadEstado: "no_contratada", publicidad: [], saldoInicial: 0, fondosRecibidos: 0,
  fondosAplicados: 0, fondosDevueltos: 0, pagosDirectos: 0, soporteSaldo: "No aplica",
  acciones: [{ accion: "Actualizar ficha", responsable: "Ana", fecha: "2026-10-13", dependencia: "Aprobación del propietario" }],
  decisionSolicitada: "Aprobar texto de estacionamiento", motivoDecision: "Consulta repetida",
  alcanceDecision: "Sólo aclaración de ficha", fechaLimiteDecision: "2026-10-14",
  estadoRespuestaPropietario: "pendiente", proximoReporte: "2026-10-19", medioProximoReporte: "Correo",
  elaborador: "Ana López", revisor: "Moisés Núñez", soportes: "Tablero 03 y captura de ficha",
  entregaInformeEstado: "pendiente",
};

it("emite el reporte con cero comprobado y publicidad no contratada", async () => {
  expect(validateFormato("11", reporte)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("11", reporte));
  expect(pdf.getTitle()).toBe("Reporte de comercialización");
  expect(pdf.getPageCount()).toBeGreaterThan(1);
});

it("distingue datos pendientes de cero y exige cifras solo cuando están comprobadas", () => {
  expect(validateFormato("11", { ...reporte, contactosEstado: "comprobado", contactos: undefined })).toContain("Contactos nuevos");
  expect(validateFormato("11", { ...reporte, contactosEstado: "pendiente", contactos: undefined })).toEqual([]);
});

it("calcula saldo de fondos sin restar otra vez pagos directos al portal", async () => {
  const { calcularPublicidadReporte } = await import("@/lib/formatos/reporte");
  const paid = { ...reporte, publicidadEstado: "contratada", monedaPublicidad: "MXN", publicidad: [{ portal: "Portal A, 7 días", autorizado: 1000, ejercido: 400, soporte: "Factura A" }], saldoInicial: 1000, fondosRecibidos: 500, fondosAplicados: 400, fondosDevueltos: 100, pagosDirectos: 250, soporteSaldo: "Estado de cuenta" };
  expect(validateFormato("11", paid)).toEqual([]);
  expect(calcularPublicidadReporte(paid)).toEqual({ autorizado: 1000, ejercido: 400, saldoFondos: 1000, pagosDirectos: 250 });
});

it("rechaza más citas realizadas que agendadas y fondos con publicidad no contratada", () => {
  expect(validateFormato("11", { ...reporte, agendadas: 1, realizadas: 2 })).toContain("Visitas realizadas de las citas");
  expect(validateFormato("11", { ...reporte, fondosRecibidos: 100 })).toContain("Publicidad pagada");
});
