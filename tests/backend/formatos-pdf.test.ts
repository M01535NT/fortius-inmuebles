import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { lastPageGeometry } from "./fixtures/pdf-geometry";
import { createFormatoPdf, prepareFormatoEmission, receiptParagraphs } from "@/lib/formatos/pdf";
import { CARGOS_NETO } from "@/lib/formatos/neto";
import { validateFormato } from "@/lib/formatos/catalog";

const receipt = {
  numeroRecibo: "F-001", lugarEmision: "Tijuana", fechaPago: "2026-10-04", pagador: "Cliente de prueba",
  importeRecibido: 12000, moneda: "MXN", concepto: "Honorarios de intermediación",
  importeLetra: "doce mil pesos", contratoFecha: "Contrato del 1 de octubre de 2026", folio: "EXP-1",
  inmueble: "Casa de prueba, Tijuana", beneficiario: "Fortius Inmuebles", representacionBeneficiario: "cuenta propia", caracter: "prestador",
  medioPago: "Transferencia", referenciaPago: "SPEI-1", soporteRecepcion: "Comprobante SPEI-1",
  pagoParcialTotal: "total", saldo: 0, monedaSaldo: "MXN", soporteSaldo: "Contrato y pagos previos",
  observaciones: "Sin observaciones", cfdiEstado: "Pendiente", receptor: "Persona receptora",
};

const entrega = {
  folio: "EXP-16", lugar: "Tijuana", fecha: "2026-10-04", horaInicio: "11:00", inmueble: "Casa en Tijuana",
  contratoReferencia: "Compraventa del 1 de octubre de 2026", quienEntrega: "María Ramírez", caracterEntrega: "Propietaria",
  identificacionEntrega: "INE cotejada", quienRecibe: "Luis García", caracterRecibe: "Comprador", identificacionRecibe: "INE cotejada",
  presentes: "María, Luis y Ana", resultadoEntrega: "parcial", recepcionFecha: "2026-10-04", recepcionHora: "11:30",
  areasEntregadas: "Casa principal", areasSinEntregar: "Bodega", ocupantesTerceros: "Ninguno",
  areasRevisadas: "Casa principal", areasNoRevisadas: "Bodega cerrada",
  estadoDiferencias: "registradas", diferencias: [{ area: "Cocina", observacion: "Falta una lámpara" }],
  estadoAccesos: "registrados", accesos: [{ acceso: "Puerta principal", cantidad: "2 llaves, probadas" }],
  estadoDocumentos: "ninguno", estadoServicios: "registrados", servicios: [{ servicio: "Agua, medidor 123", lectura: "50 m³", observacion: "Fotografía anexa" }],
  estadoPendientes: "registrados", pendientes: [{ accion: "Entregar bodega", responsable: "María", fecha: "2026-10-10" }],
  manifestacionEntrega: "Se entregan dos llaves", reservasRecibe: "Pendiente bodega", manifestacionesNoComprobadas: "Ninguna",
  anexos: "Fotografías 1 a 4", horaFinal: "12:00", ausenciasFirma: "No aplica",
};

describe("emisión de formatos", () => {
  it("rechaza un recibo incompleto antes de crear bytes", async () => {
    await expect(prepareFormatoEmission("18", { ...receipt, medioPago: "" })).rejects.toThrow(/Medio de pago/);
  });

  it("genera PDF paginado, identificado y con huella estable de sus bytes", async () => {
    const emitted = await prepareFormatoEmission("18", receipt);
    const pdf = await PDFDocument.load(emitted.bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    expect(pdf.getTitle()).toMatch(/Recibo de pago de honorarios/);
    expect(pdf.getAuthor()).toBe("Fortius Inmuebles");
    expect(emitted.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(emitted.bytes.slice(0, 5)).toEqual(new Uint8Array([37, 80, 68, 70, 45]));
  });

  it("permite preparar una vista PDF sin archivarla", async () => {
    const bytes = await createFormatoPdf("18", receipt);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });

  it("bloquea formatos cuya correspondencia con el original sigue pendiente", async () => {
    await expect(prepareFormatoEmission("09", {})).rejects.toThrow(/pendiente de cotejo/i);
  });

  it("genera el registro de una visita cancelada sin exigir retroalimentación inexistente", async () => {
    const bytes = await createFormatoPdf("13", {
      folio: "EXP-1", fechaCita: "2026-10-05", horaCita: "10:30", asesor: "Ana",
      inmueble: "Casa en Tijuana", folioInmueble: "INM-1", interesado: "Luis",
      estadoCita: "cancelada", accionAcordada: "Reprogramar", responsableSeguimiento: "Ana",
      fechaSeguimiento: "2026-10-06", pendientesComprobar: "Disponibilidad",
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Visita y retroalimentación");
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("genera un cierre sin pendientes solo con controles respaldados", async () => {
    const bytes = await createFormatoPdf("17", {
      folio: "EXP-1", fechaRegistro: "2026-10-05", inmueble: "Casa Tijuana", resultadoOperacion: "realizada",
      soporteResultado: "Escritura 123, 2026-10-05", estadoExpediente: "cerrado_sin_pendientes",
      tableroEstado: "comprobado", tableroReferencia: "Tablero 03",
      juridicaEstado: "comprobado", juridicaReferencia: "Revisión 05",
      entregaEstado: "comprobado", entregaReferencia: "Acta 16",
      publicacionesEstado: "comprobado", publicacionesReferencia: "Captura web",
      accesosEstado: "no_aplica", accesosReferencia: "No se entregaron llaves",
      accionesPendientes: "ninguno", ubicacionExpediente: "Expedientes/EXP-1",
      custodiaOriginales: "No aplica", responsableRegistro: "Ana",
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Cierre del expediente");
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("genera el perfil del comprador con importes declarados y seguimiento", async () => {
    const bytes = await createFormatoPdf("12", {
      folio: "EXP-2", fechaEntrevista: "2026-10-05", asesor: "Ana", comprador: "Luis",
      telefono: "6640000000", correo: "luis@example.com", medioContacto: "correo", participantesDecision: "Cónyuge",
      tipoInmueble: "casa", usoInmueble: "vivienda", zonas: "Zona Centro", indispensables: "Dos recámaras",
      flexible: "Patio", descarta: "Escaleras", motivoCompra: "habitar", precioDeseado: 3000000,
      precioMaximo: 3200000, moneda: "MXN", gastosIncluidos: "no", reservaGastos: 200000,
      monedaReserva: "MXN", formaPago: "recursos_propios", recursosPropios: 3400000, monedaRecursos: "MXN",
      plazoCompra: "2027-01", fechaFlexible: "si", dependencias: "Ninguna", diasVisita: "Sábados",
      horarioVisita: "10 a 13", siguienteAccion: "Mostrar inmuebles", responsableSeguimiento: "Ana",
      fechaAcordada: "2026-10-08",
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Perfil del comprador");
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("genera resumen, partidas y pagos del presupuesto calculado", async () => {
    const bytes = await createFormatoPdf("19", {
      folio: "EXP-3", inmueble: "Casa Tijuana", fechaCorte: "2026-10-05", responsable: "Ana",
      moneda: "MXN", alcance: "Reparación de cocina", reservaImprevistos: 50,
      partidas: [{ id: "P-1", area: "Cocina", concepto: "Pintura", tipoCosto: "Material", unidad: "pieza", cantidad: 2, precioUnitario: 120.25, estado: "Autorizado", soporte: "Cotización C-1" }],
      pagos: [{ fechaPago: "2026-10-05", partidaId: "P-1", proveedor: "Proveedor A", concepto: "Anticipo", importe: 100, medio: "Transferencia", comprobante: "SPEI-1", estado: "Pagado" }],
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Presupuesto de rehabilitacion");
    expect(pdf.getPageCount()).toBe(3);
  });

  it("genera la estimación del neto con precio, cargos justificados y respaldo fiscal", async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const nextYear = `${Number(today.slice(0, 4)) + 1}-12-31`;
    const bytes = await createFormatoPdf("08", {
      folio: "EXP-8", fechaEmision: today, propietario: "Cliente", inmueble: "Casa Tijuana",
      referencia07: "OVC-07-v1", fecha07: today, estadoOperacion: "En estudio",
      precioSugerido07: 3000000, precioAcordado: 2900000, precioBase: "acordado",
      erogaciones: CARGOS_NETO.map((item) => ({ concepto: item.key, importe: item.key === "comision" ? 90000 : 0, estado: item.key === "comision" ? "Estimado" : "No aplica", justificacion: item.key === "comision" ? "Contrato de intermediación" : "No corresponde al expediente" })),
      precioRespaldoFiscal: 2900000, respaldoFiscalValidoHasta: nextYear, cierrePrevisto: nextYear,
      revisionCargos: "Revisado", responsableEstimacion: "Ana",
    });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Estimación del neto");
    expect(pdf.getPageCount()).toBeGreaterThan(0);
  });

  it("emite el acta de entrega con inventarios, pendientes y firmas", async () => {
    expect(validateFormato("16", entrega)).toEqual([]);
    const bytes = await createFormatoPdf("16", entrega);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toMatch(/Acta de entrega/i);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it("mantiene nombres y representaciones largos dentro de las dos columnas de firma", async () => {
    const bytes = await createFormatoPdf("16", { ...entrega,
      quienEntrega: "Lic. María Guadalupe Hernández Martínez, apoderada de Inmobiliaria del Pacífico",
      quienRecibe: "Lic. José Francisco López Fernández, representante de Desarrollos Inmobiliarios de Baja California",
    });
    const { operators, text } = await lastPageGeometry(bytes);
    const signatureLines = [...operators.matchAll(/45 ([\d.]+) m\s+245 ([\d.]+) l/g)];
    expect(signatureLines.length).toBeGreaterThan(0);
    const signatureOffset = signatureLines.at(-1)!.index!;
    const captions = text.filter(t => t.offset > signatureOffset && t.y > 40);
    expect(captions.length).toBeGreaterThan(0);
    for (const caption of captions) {
      expect(caption.width).toBeLessThanOrEqual(200.01);
      expect(caption.x + caption.width).toBeLessThanOrEqual(550.29);
      expect(caption.y).toBeGreaterThan(45);
    }
  });

  it("impide emitir un acta parcial sin área pendiente o con inventario incompleto", async () => {
    expect(validateFormato("16", { ...entrega, areasSinEntregar: "Ninguna" })).toContain("Áreas sin entregar");
    expect(validateFormato("16", { ...entrega, accesos: [{ acceso: "Puerta" }] })).toContain("Llaves y accesos");
    await expect(prepareFormatoEmission("16", { ...entrega, estadoPendientes: "ninguno" })).rejects.toThrow(/Acciones pendientes/);
  });

  it("rechaza importes negativos y recibos totales con saldo pendiente", async () => {
    await expect(prepareFormatoEmission("18", { ...receipt, importeRecibido: -1 })).rejects.toThrow(/Importe recibido/);
    await expect(prepareFormatoEmission("18", { ...receipt, saldo: 100 })).rejects.toThrow(/Saldo pendiente/);
    await expect(prepareFormatoEmission("18", { ...receipt, pagoParcialTotal: "indefinido" })).rejects.toThrow(/Pago parcial o total/);
  });

  it("conserva las cláusulas del recibo sobre pago, saldo y CFDI", () => {
    const text = receiptParagraphs(receipt).join(" ");
    expect(text).toContain("Este recibo reconoce únicamente el pago señalado");
    expect(text).toContain("no sustituye el CFDI");
    expect(text).toContain("12,000.00");
  });
});
