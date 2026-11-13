import { INTERMEDIACION_TABLES } from "@/lib/formatos/intermediacion";

/** Contrato 09 sintético y completo, para emitir su PDF en pruebas. No son personas ni inmuebles reales. */
const cliente = (n: number) => Object.fromEntries(INTERMEDIACION_TABLES.clientesContrato.columns.map(({ key }) => [key, key === "correo" ? `cliente${n}@example.test` : key === "rfc" ? `XAXX01010${n}000` : `Dato sintético ${n}`]));

export const intermediacionCompleta: Record<string, unknown> = {
  folio: "EXP-MUESTRA-09",
  clientesContrato: [cliente(1), cliente(2)],
  prestador: "Prestador de ejemplo", rfcPrestador: "XAXX010101000", comparecePrestador: "propia",
  domicilioPrestador: "Domicilio sintético 123, Tijuana, B.C.", correoPrestador: "prestador@example.test", telefonoPrestador: "6640000000",
  firmantePrestador: "Prestador de ejemplo", calidadFirmaPrestador: "Por propio derecho",
  licenciaEstado: "vigente", licenciaNumero: "LIC-EJEMPLO", licenciaVigencia: "2027-12-31", licenciaSoporte: "Constancia sintética",
  modeloEstatalEstado: "no_aplica", modeloEstatalReferencia: "Fundamento sintético de prueba",
  inmueble: "Calle Ejemplo 123, Fraccionamiento Sintético, C.P. 22000, Tijuana, B.C.", idInmueble: "INM-MUESTRA", tipoInmueble: "Casa", destino: "Habitacional",
  titulo: "Escritura sintética 1234", folioReal: "FR-0000", claveCatastral: "CC-0000", derecho: "Pleno dominio, dato sintético", superficie: "160 m² de terreno según escritura sintética",
  accesorios: "Ninguno", gravamenes: "Ninguno declarado", ocupacion: "Desocupado", restricciones: "Ninguna", condicionesEncargo: "Dato sintético de prueba",
  modalidad: "exclusiva", inicio: "2026-11-15", fin: "2027-05-14",
  precioAutorizado: 3500000, ivaVenta: 0, ivaVentaFuente: "Casa habitación, dato sintético",
  comisionPorcentaje: 5, ivaComisionTasa: 16, ivaComisionFuente: "Dato sintético de prueba",
  penaMaxima: 50000, presupuestoPena: "PRES-MUESTRA", fechaPresupuestoPena: "2026-11-10",
  proteccionDias: 90, excepcionesEstado: "ninguna", excepcionesProspectos: [], anexosEstado: "ninguno", anexosContrato: [],
  medioAvisoPrivacidad: "Entregado en papel", fechaAvisoPrivacidad: "2026-11-10", referenciaAvisoPrivacidad: "Aviso 01, versión de muestra",
  lugar: "Tijuana", fecha: "2026-11-15",
};
