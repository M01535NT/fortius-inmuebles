import { describe, expect, it } from "vitest";
import { FORMATOS, formatoById, validateFormato } from "@/lib/formatos/catalog";

describe("catálogo de formatos exclusivos", () => {
  it("incluye cada original una sola vez y conserva los siete levantamientos", () => {
    expect(FORMATOS).toHaveLength(25);
    expect(new Set(FORMATOS.map((formato) => formato.id)).size).toBe(25);
    expect(FORMATOS.filter((formato) => /^04[A-G]$/.test(formato.id))).toHaveLength(7);
    expect(FORMATOS.filter((formato) => formato.source.endsWith(".xlsx"))).toHaveLength(4);
  });

  it("bloquea la emisión cuando faltan campos obligatorios", () => {
    expect(validateFormato("18", {})).toContain("Número de recibo");
    expect(validateFormato("18", { numeroRecibo: "R-1" })).toContain("Importe recibido");
  });

  it("mantiene valoración y neto como documentos distintos", () => {
    expect(formatoById("07").title).toMatch(/valor comercial/i);
    expect(formatoById("08").title).toMatch(/neto/i);
    expect(formatoById("08").fields.some((field) => field.key === "precioSugerido07")).toBe(true);
  });

  it("solo marca listo para emitir un formato cotejado con su original", () => {
    expect(FORMATOS.filter((formato) => formato.readyForEmission).map((formato) => formato.id)).toEqual(["01", "02", "06", "08", "10", "11", "12", "13", "14", "16", "17", "18", "19"]);
  });

  it("valida presupuesto, forma de pago y evidencia del crédito del comprador", () => {
    const base = { folio: "EXP-2", fechaEntrevista: "2026-10-05", asesor: "Ana", comprador: "Luis", telefono: "6640000000", correo: "luis@example.com", medioContacto: "correo", participantesDecision: "Cónyuge", tipoInmueble: "casa", usoInmueble: "vivienda", zonas: "Zona Centro", indispensables: "Dos recámaras", flexible: "Patio", descarta: "Escaleras", motivoCompra: "habitar", precioDeseado: 3000000, precioMaximo: 3200000, moneda: "MXN", gastosIncluidos: "no", reservaGastos: 200000, monedaReserva: "MXN", formaPago: "recursos_propios", recursosPropios: 3400000, monedaRecursos: "MXN", plazoCompra: "2027-01", fechaFlexible: "si", dependencias: "Ninguna", diasVisita: "Sábados", horarioVisita: "10 a 13", siguienteAccion: "Mostrar inmuebles", responsableSeguimiento: "Ana", fechaAcordada: "2026-10-08" };
    expect(validateFormato("12", base)).toEqual([]);
    expect(validateFormato("12", { ...base, precioDeseado: 3300000 })).toContain("Precio que le gustaría pagar");
    expect(validateFormato("12", { ...base, formaPago: "credito", etapaCredito: "autorizado_con_soporte" })).toContain("Soporte de crédito revisado");
  });

  it("no cierra un expediente con controles pendientes como si no tuviera pendientes", () => {
    const base = { folio: "EXP-1", fechaRegistro: "2026-10-05", inmueble: "Casa Tijuana", resultadoOperacion: "realizada", soporteResultado: "Escritura 123, 2026-10-05", estadoExpediente: "cerrado_sin_pendientes", accionesPendientes: "ninguno", ubicacionExpediente: "Expedientes/EXP-1", custodiaOriginales: "No aplica", responsableRegistro: "Ana",
      tableroEstado: "comprobado", tableroReferencia: "Tablero 03", juridicaEstado: "comprobado", juridicaReferencia: "Revisión 05", entregaEstado: "comprobado", entregaReferencia: "Acta 16", publicacionesEstado: "comprobado", publicacionesReferencia: "Captura web", accesosEstado: "no_aplica", accesosReferencia: "No se entregaron llaves" };
    expect(validateFormato("17", base)).toEqual([]);
    expect(validateFormato("17", { ...base, entregaEstado: "pendiente" })).toContain("Estado del expediente");
    expect(validateFormato("17", { ...base, estadoExpediente: "terminado_con_seguimiento", accionesPendientes: "Solicitar acta" })).toContain("Responsable de los pendientes");
  });

  it("exige la retroalimentación solo cuando se realizó la visita", () => {
    const base = { folio: "EXP-1", fechaCita: "2026-10-05", horaCita: "10:30", asesor: "Ana", inmueble: "Casa en Tijuana", folioInmueble: "INM-1", interesado: "Luis", estadoCita: "cancelada", accionAcordada: "Reprogramar", responsableSeguimiento: "Ana", fechaSeguimiento: "2026-10-06", pendientesComprobar: "Disponibilidad" };
    expect(validateFormato("13", base)).toEqual([]);
    expect(validateFormato("13", { ...base, estadoCita: "realizada" })).toContain("¿Qué le gustó del inmueble?");
    expect(validateFormato("13", { ...base, estadoCita: "invalido" })).toContain("Estado de la cita");
  });
});
