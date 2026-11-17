/**
 * Lo que intercambian el panel y el servidor sobre los apartados a fondo (etapa 5 de PLAN.md):
 * Documentos, Situación, Opinión jurídica, Honorarios, Interesados, apartados propios con vista y la liga del cliente.
 * Tablas: docs/operacion/modelo-de-datos-panel.md, secciones 4.5 a 4.9.
 */
import type { Quien } from "./asuntos-contrato";

export const MONEDAS = ["MXN", "USD"] as const;
export type Moneda = (typeof MONEDAS)[number];

// ── Documentos ───────────────────────────────────────────────────────────────────────────────────────
export const ESTADOS_DOCUMENTO = ["falta", "recibido", "no_aplica"] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];
export const PASOS_DOCUMENTO = ["borrador", "revisado", "firmado"] as const;
export type PasoDocumento = (typeof PASOS_DOCUMENTO)[number];

export type ArchivoDelDocumento = { id: string; nombre: string; mime: string; por_cliente: boolean; created_at: string };

export type DocumentoDelAsunto = {
  id: string; nombre: string; grupo: string | null; estado: EstadoDocumento;
  entrega_papel: string | null; entrega_persona_id: string | null; inmueble_id: string | null;
  vence_el: string | null; avisar_dias: number | null; paso: PasoDocumento | null; origen: string;
  es_contrato: boolean; es_recibo: boolean; nota: string; version: number;
  /** Si se hizo aquí (un formato por preguntas o una cuenta de Herramientas): se vuelve a abrir desde su renglón. */
  trabajo_id: string | null;
  archivos: ArchivoDelDocumento[];
};

/** Hacia dónde va lo que se sube: un renglón, «Subir varios» (cada archivo a su renglón) o un documento con papel propio. */
export const DESTINOS = ["documento", "varios", "contrato", "opinion", "presupuesto", "fila", "firmado"] as const;
export type Destino = (typeof DESTINOS)[number];
export type ResultadoSubida = { nombre: string; documento: string; nuevo: boolean };

// ── Situación ────────────────────────────────────────────────────────────────────────────────────────
export type PuntoSituacion = {
  id: string; clase: "hecho" | "por_averiguar"; clave: string | null; valor: string | string[] | null; texto: string;
  tarea_id: string | null; resuelto_el: string | null; version: number;
};

// ── Opinión jurídica ─────────────────────────────────────────────────────────────────────────────────
export const RESULTADOS_OPINION = ["factible", "factible_con_observaciones", "no_factible"] as const;
export type ResultadoOpinion = (typeof RESULTADOS_OPINION)[number];
export const NOMBRE_RESULTADO: Record<ResultadoOpinion, string> = {
  factible: "Factible", factible_con_observaciones: "Factible con observaciones", no_factible: "No factible",
};
export type PuntoOpinion = { id: string; texto: string; quien: Quien; tarea_id: string | null; version: number };
export type Opinion = {
  id: string; resultado: ResultadoOpinion | null; analisis: string; emitida_el: string | null; documento_id: string | null; version: number;
  puntos: PuntoOpinion[];
};

// ── Honorarios ───────────────────────────────────────────────────────────────────────────────────────
export const ESTADOS_PRESUPUESTO = ["borrador", "enviado", "aceptado", "rechazado"] as const;
export type EstadoPresupuesto = (typeof ESTADOS_PRESUPUESTO)[number];
export const NOMBRE_PRESUPUESTO: Record<EstadoPresupuesto, string> = { borrador: "Sin enviar", enviado: "Enviado", aceptado: "Aceptado", rechazado: "Rechazado" };

export type Concepto = {
  id: string; clase: "honorario" | "tercero"; concepto: string; monto: number | null; moneda: Moneda; porcentaje: number | null;
  base_inmueble_id: string | null; inmueble_id: string | null; tercero: string | null; version: number;
};
export type Presupuesto = {
  id: string; numero: number; estado: EstadoPresupuesto; enviado_el: string | null; vigente_hasta: string | null;
  paga_persona_id: string | null; documento_id: string | null; version: number; conceptos: Concepto[];
};

export const FORMAS_PAGO = ["transferencia", "efectivo", "cheque", "tarjeta", "otro"] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];
export const NOMBRE_FORMA: Record<FormaPago, string> = { transferencia: "Transferencia", efectivo: "Efectivo", cheque: "Cheque", tarjeta: "Tarjeta", otro: "Otra forma" };

export type Cobro = {
  id: string; concepto_id: string | null; paga_persona_id: string | null; inmueble_id: string | null; monto: number; moneda: Moneda;
  forma: FormaPago; fecha: string; recibo_documento_id: string | null; nota: string; version: number;
};

// ── Interesados ──────────────────────────────────────────────────────────────────────────────────────
export const ESTADOS_INTERESADO = ["nuevo", "en_contacto", "visito", "oferto", "descartado"] as const;
export type EstadoInteresado = (typeof ESTADOS_INTERESADO)[number];
export const NOMBRE_INTERESADO: Record<EstadoInteresado, string> = {
  nuevo: "Nuevo", en_contacto: "En contacto", visito: "Visitó", oferto: "Ofertó", descartado: "Descartado",
};
export const RESPUESTAS_OFERTA = ["por_responder", "aceptada", "rechazada", "contraoferta"] as const;
export type RespuestaOferta = (typeof RESPUESTAS_OFERTA)[number];
export const NOMBRE_RESPUESTA: Record<RespuestaOferta, string> = {
  por_responder: "Sin respuesta", aceptada: "Aceptada", rechazada: "Rechazada", contraoferta: "Contraoferta",
};
export type Oferta = {
  id: string; inmueble_id: string | null; monto: number; moneda: Moneda; fecha: string; respuesta: RespuestaOferta;
  contraoferta_monto: number | null; version: number;
};
export type Interesado = {
  id: string; persona_id: string; nombre: string; telefono: string | null; estado: EstadoInteresado; nota: string; version: number;
  inmuebles: string[]; ofertas: Oferta[];
};

// ── Apartados propios ────────────────────────────────────────────────────────────────────────────────
export const TIPOS_COLUMNA = ["texto", "numero", "dinero", "fecha", "si_no"] as const;
export type TipoColumna = (typeof TIPOS_COLUMNA)[number];
export type Columna = { clave: string; nombre: string; tipo: TipoColumna };
export type ValorCelda = string | number | boolean | null;

/** La primera columna es la del renglón en la vista de lista: así cambiar de vista no pierde nada. */
export const COLUMNAS_INICIALES: Record<"lista" | "tabla" | "galeria" | "texto", Columna[]> = {
  lista: [{ clave: "texto", nombre: "Renglón", tipo: "texto" }],
  texto: [{ clave: "texto", nombre: "Renglón", tipo: "texto" }],
  tabla: [{ clave: "texto", nombre: "Concepto", tipo: "texto" }, { clave: "monto", nombre: "Monto", tipo: "dinero" }, { clave: "fecha", nombre: "Fecha", tipo: "fecha" }],
  galeria: [{ clave: "texto", nombre: "Nombre", tipo: "texto" }, { clave: "precio", nombre: "Precio", tipo: "dinero" }, { clave: "superficie", nombre: "Superficie (m²)", tipo: "numero" }],
};

// ── Liga del cliente ─────────────────────────────────────────────────────────────────────────────────
export type LigaCliente = { id: string; expira_el: string; revocada: boolean; subidos: number; created_at: string; version: number };
export const DIAS_LIGA = 14;
