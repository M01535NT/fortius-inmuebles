import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createFormatoPdf, prepareFormatoEmission, receiptParagraphs } from "@/lib/formatos/pdf";

const receipt = {
  numeroRecibo: "F-001", lugarEmision: "Tijuana", fechaPago: "2026-10-04", pagador: "Cliente de prueba",
  importeRecibido: 12000, moneda: "MXN", concepto: "Honorarios de intermediación",
  importeLetra: "doce mil pesos", contratoFecha: "Contrato del 1 de octubre de 2026", folio: "EXP-1",
  inmueble: "Casa de prueba, Tijuana", beneficiario: "Fortius Inmuebles", representacionBeneficiario: "cuenta propia", caracter: "prestador",
  medioPago: "Transferencia", referenciaPago: "SPEI-1", soporteRecepcion: "Comprobante SPEI-1",
  pagoParcialTotal: "total", saldo: 0, monedaSaldo: "MXN", soporteSaldo: "Contrato y pagos previos",
  observaciones: "Sin observaciones", cfdiEstado: "Pendiente", receptor: "Persona receptora",
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
    await expect(prepareFormatoEmission("07", {})).rejects.toThrow(/pendiente de cotejo/i);
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
