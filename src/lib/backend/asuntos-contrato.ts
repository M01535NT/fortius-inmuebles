/**
 * Lo que intercambian el panel y el servidor sobre los asuntos (SPEC.md, sección 5).
 * Tablas: docs/operacion/modelo-de-datos-panel.md, secciones 4.2, 4.3, 4.8 y 4.10.
 */
import type {
  Cobro, Columna, DocumentoDelAsunto, Interesado, LigaCliente, Opinion, Presupuesto, PuntoSituacion, ValorCelda,
} from "./apartados-contrato";


export const EN_QUE_VA = ["estudio", "propuesta", "en_marcha", "por_cobrar", "cerrado"] as const;
export type EnQueVa = (typeof EN_QUE_VA)[number];

export const ENCARGOS = ["revisar", "comercializar", "tramitar", "asesorar"] as const;
export type Encargo = (typeof ENCARGOS)[number];

/** Apartados con nombre fijo. «propio» es el que crea el asesor con su nombre y su vista. */
export const CLAVES_APARTADO = ["personas", "inmueble", "interesados", "situacion", "documentos", "opinion", "honorarios", "plan", "historial"] as const;
export type ClaveApartado = (typeof CLAVES_APARTADO)[number];
/** Siempre están y no se quitan. */
export const APARTADOS_DE_SIEMPRE: readonly ClaveApartado[] = ["personas", "plan", "historial"];

export const VISTAS = ["lista", "tabla", "galeria", "texto"] as const;
export type Vista = (typeof VISTAS)[number];

export const PAPELES = [
  "contacto", "propietario", "titular", "heredero", "copropietario", "comprador", "vendedor",
  "inquilino", "inversionista", "contraparte", "apoderado", "abogado", "notaria", "banco",
] as const;
export type Papel = (typeof PAPELES)[number];

export const CLASES_PERSONA = ["persona", "empresa", "institucion"] as const;
export type ClasePersona = (typeof CLASES_PERSONA)[number];

export const QUIEN = ["fortius", "cliente", "abogado", "notaria", "otro"] as const;
export type Quien = (typeof QUIEN)[number];

/** Cada cuánto se repite una tarea: al dejarla hecha nace la siguiente. */
export const CADA_TAREA = ["semana", "quincena", "mes", "bimestre", "trimestre", "año"] as const;
export type CadaTarea = (typeof CADA_TAREA)[number];
export const NOMBRE_CADA: Record<CadaTarea, string> = {
  semana: "Cada semana", quincena: "Cada 15 días", mes: "Cada mes", bimestre: "Cada dos meses", trimestre: "Cada tres meses", año: "Cada año",
};
export const ESTADOS_TAREA = ["pendiente", "hecha", "no_aplica", "no_se_puede"] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];

export type Siguiente = { tarea_id: string; titulo: string; quien: Quien; fecha: string | null; hora: string | null; version: number };

export type FilaAsunto = {
  id: string; folio: string; nombre: string; encargos: Encargo[]; en_que_va: EnQueVa;
  en_espera: boolean; espera_hasta: string | null; resultado: "se_logro" | "no_se_dio" | null;
  responsable_id: string; es_ejemplo: boolean; version: number; updated_at: string;
  siguiente: Siguiente | null;
  /** Nombres de las personas del asunto y lo demás que sirve para buscar. */
  busqueda: string;
};

export type Apartado = {
  id: string; clave: ClaveApartado | "propio"; visible: boolean; orden: number;
  nombre: string | null; vista: Vista | null; texto: string; columnas: Columna[]; version: number;
};

/** Un renglón de un apartado propio. `texto` es la primera columna (la de la vista de lista). */
export type FilaPropia = {
  id: string; apartado_id: string; texto: string; datos: Record<string, ValorCelda>; hecho: boolean; foto_url: string | null;
  orden: number; version: number;
};

export type PersonaDelAsunto = {
  /** El renglón del papel (una persona puede tener dos papeles en el mismo asunto). */
  id: string; persona_id: string; papel: Papel; principal: boolean; nota: string; version: number;
  nombre: string; clase: ClasePersona; fallecida: boolean; telefono: string | null; correo: string | null; no_contactar: boolean;
};

export type Etapa = { id: string; nombre: string; orden: number; version: number };

export const CLASES_TAREA = ["tarea", "llamada", "visita", "firma", "cita", "seguimiento", "cobro"] as const;
export type ClaseTarea = (typeof CLASES_TAREA)[number];

export type Tarea = {
  id: string; titulo: string; clase: ClaseTarea; quien: Quien; fecha: string | null; hora: string | null; estado: EstadoTarea; motivo: string | null;
  etapa_id: string | null; responsable_id: string; volver_a_preguntar: string | null; recordada_el: string | null; pospuesta: number;
  interesado_id: string | null; inmueble_id: string | null; documento_id: string | null; origen: string; orden: number; version: number;
  /** La tarea que tiene que terminar antes (solo avisa; nunca frena). */
  espera_a: string | null;
  /** La persona del asunto de la que trata («Llamar a Laura»). */
  persona_id: string | null;
  /** Cada cuánto se repite; `que: "informe"` la maneja el informe para el cliente. */
  repetir: { cada?: string; que?: string; de?: string; dia?: number } | null;
};

/** Lo básico del inmueble para el asunto; la ficha completa llega en la etapa 4. */
export type InmuebleDelAsunto = {
  id: string; folio: string; nombre: string; tipo: string | null; operacion: "venta" | "renta" | null; colonia: string | null;
  precio: number | null; moneda: "MXN" | "USD"; estado: string; publicado: boolean; slug: string | null;
};

export type Asunto = FilaAsunto & {
  espera_motivo: string | null; motivo_cierre: string | null; cerrado_el: string | null;
  capto_id: string | null; vendio_id: string | null; viene_de: string | null; situacion: string; created_at: string;
  apartados: Apartado[]; filas: FilaPropia[]; personas: PersonaDelAsunto[]; etapas: Etapa[]; tareas: Tarea[];
  inmuebles: InmuebleDelAsunto[]; documentos: DocumentoDelAsunto[];
  /** Lo que se sabe del caso y lo que falta averiguar (si no hay hechos anotados, se leen los de la consulta). */
  situacion_puntos: PuntoSituacion[];
  opinion: Opinion | null;
  /** El más reciente primero. */
  presupuestos: Presupuesto[];
  cobros: Cobro[];
  interesados: Interesado[];
  ligas: LigaCliente[];
  /** Los datos de siempre que se anotaron en la consulta de la que nació (qué quiere, de quién es…), si la hubo. */
  datos_consulta: Record<string, unknown> | null;
};

export type EntradaHistorial = {
  id: number; entidad: string; entidad_id: string; clase: "cambio" | "nota" | "decision" | "comentario" | "aviso" | "sistema";
  resumen: string;
  detalle: {
    campos?: string[]; valores?: Record<string, { antes: unknown; ahora: unknown }>;
    /** En una nota: el apartado donde se escribió y lo que menciona (ids de personas y de apartados). */
    ligas?: { desde?: string | null; personas?: string[]; apartados?: string[] };
  } | null;
  actor_id: string | null; actor_tipo: "usuario" | "sistema" | "publico"; created_at: string;
};

export type Miembro = { id: string; nombre: string; director: boolean };

/** Respuesta de «agregar persona» cuando el teléfono o el correo ya existen: la pantalla ofrece usar la misma ficha. */
export type PersonaDuplicada = { id: string; nombre: string };
