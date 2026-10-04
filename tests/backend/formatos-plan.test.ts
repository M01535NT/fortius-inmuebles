import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";

const plan = {
  folio: "EXP-10", inmueble: "Casa en Tijuana", propietario: "María Ramírez", asesor: "Ana López",
  contactoAsesor: "6640000000", fecha: "2026-10-04", operacion: "venta", modalidadEncargo: "Intermediación no exclusiva",
  valorReferencia07: 2900000, referencia07: "OVC-07-v2", precioSalida: 3000000, moneda: "MXN", baseFiscal: "Precio sin gastos de escrituración",
  autorizacionPrecio: "Correo del 04/10/2026", decisionPrecio: "Revisar en primer corte", justificacionDiferencia: "Ajuste por mejoras documentadas",
  objetivo: "Vender en condiciones viables", estrategia: "Presentar la casa con fotografías y visitas concertadas",
  periodo: "21 días iniciales", fechaRevision: "2026-10-25", condicionesLanzamiento: "Confirmar precio y acceso",
  diferenciador: "Cocina renovada, verificada en visita", objecionRespuesta: "Ruido de calle; mostrar horarios de menor tránsito",
  competencia: "Tres inmuebles comparables en OVC-07-v2", pendientesCampana: "Confirmar superficie registral",
  publicoPrimario: "Familias con presupuesto de 3 millones en Tijuana", publicoSecundario: "Parejas con crédito autorizado",
  mensajePrueba: "Casa con cocina renovada", evidenciaValidacion: "Consultas y visitas registradas",
  atributos: [{ atributo: "Cocina renovada", evidencia: "Fotografías del 03/10/2026", mensaje: "Cocina renovada" }],
  fechaLanzamiento: "2026-10-05", aprobadorContenido: "María Ramírez", preparacion: "Limpieza por propietaria el 04/10/2026",
  hitos: [
    { concepto: "preparacion", entregable: "Información y acceso confirmados", responsable: "Ana", fecha: "2026-10-04" },
    { concepto: "produccion", entregable: "Fotografías aprobadas", responsable: "Ana", fecha: "2026-10-05" },
    { concepto: "lanzamiento", entregable: "Anuncios verificados", responsable: "Ana", fecha: "2026-10-05" },
    { concepto: "cortes", entregable: "Resultados revisados", responsable: "Ana", fecha: "2026-10-25" },
    { concepto: "continuidad", entregable: "Ajustes propuestos", responsable: "Ana", fecha: "2026-10-26" },
  ],
  piezas: [
    { concepto: "fotografias", alcance: "Fachada y habitaciones", responsable: "Ana", fecha: "2026-10-05" },
    { concepto: "ficha", alcance: "Datos comprobados y precio", responsable: "Ana", fecha: "2026-10-05" },
    { concepto: "video", alcance: "No aplica", responsable: "Ana", fecha: "2026-10-05" },
    { concepto: "otras", alcance: "No aplica", responsable: "Ana", fecha: "2026-10-05" },
  ],
  contactoPublico: "6640000000", ubicacionPublicable: "Colonia y municipio", colaboracion: "Referidos con autorización",
  canales: [
    { concepto: "portales", motivo: "Alcance local", piezaPeriodo: "Ficha por 21 días", autorizacion: "Autorizado por correo" },
    { concepto: "mnt", motivo: "Canal propio", piezaPeriodo: "Ficha por 21 días", autorizacion: "Autorizado por correo" },
    { concepto: "referidos", motivo: "Red local", piezaPeriodo: "Envíos durante 21 días", autorizacion: "Autorizado por correo" },
  ],
  corte7: "2026-10-11", corte14: "2026-10-18", corte21: "2026-10-25",
  extras: [], estadoPublicidad: "no_contratada", unidadesFases: "No aplica",
  mediosAtencion: "Teléfono y mensajería", tiempoRespuesta: "Dentro del horario 9 a 18",
  horariosVisita: "Sábados 10 a 13", responsableAcceso: "María Ramírez", formasPago: "Recursos propios y crédito sujeto a aprobación",
  documentosRestringidos: "Escritura sólo tras identificación", custodioDocumentos: "Ana López",
  medioReporte: "Correo", frecuencia09: "Cada 14 días", proximoCorte: "2026-10-11", destinatarioReporte: "María Ramírez",
  criterioRevision: "Contactos, visitas y ofertas sin duplicados",
  decisiones: [
    { concepto: "difusion", alcance: "Precio, canales y materiales autorizados" },
    { concepto: "gastos", alcance: "Sin gastos adicionales ni acceso público" },
    { concepto: "pendientes", alcance: "Confirmar superficie, Ana, 08/10/2026" },
  ],
  estadoAprobacion: "pendiente", siguienteAccion: "Revisar y aprobar piezas", responsableSiguiente: "María Ramírez", fechaSiguiente: "2026-10-05",
};

it("emite el plan narrativo con campaña, cortes, decisiones y autorización pendiente explícita", async () => {
  expect(validateFormato("10", plan)).toEqual([]);
  const pdf = await PDFDocument.load(await createFormatoPdf("10", plan));
  expect(pdf.getTitle()).toBe("Plan de comercialización");
  expect(pdf.getPageCount()).toBeGreaterThan(1);
});

it("bloquea publicidad pagada sin aprobación o importes inconsistentes", () => {
  const paid = { ...plan, estadoPublicidad: "contratada", extras: [{ concepto: "Portal", importe: 3000, pagador: "Propietario", estado: "autorizado", soporte: "Correo del 04/10/2026" }] };
  expect(validateFormato("10", { ...paid, extras: [{ ...paid.extras[0], soporte: "" }] })).toContain("Publicidad pagada y extras");
  expect(validateFormato("10", { ...plan, estadoPublicidad: "no_contratada", extras: paid.extras })).toContain("Publicidad pagada y extras");
});

it("exige respaldo de la aprobación y orden cronológico de los tres cortes", () => {
  expect(validateFormato("10", { ...plan, estadoAprobacion: "registrada" })).toContain("Constancia de aceptación del plan");
  expect(validateFormato("10", { ...plan, corte14: "2026-10-10" })).toContain("Cortes de los días 7, 14 y 21");
});

it("rechaza fechas no verificables en los hitos de campaña", () => {
  expect(validateFormato("10", { ...plan, hitos: [{ ...plan.hitos[0], fecha: "pronto" }, ...plan.hitos.slice(1)] })).toContain("Preparación y calendario");
});
