import type { FormatoField } from "./catalog";

/*
  02 · Entrevista inicial (decisión del titular, 17/10/2026): solo sirve para conocer al
  propietario o a su apoderado —quién es, cómo contactarlo, por qué vende y cuánto espera—
  y lo mínimo del inmueble para armar su checklist de documentos. La escritura, el registro,
  la adquisición y lo fiscal se toman después de sus documentos, en la revisión jurídica (05).
  Las claves se conservan para que los borradores anteriores, el llenado desde el primer
  contacto y el checklist sigan funcionando.
*/

/** Se conservan por compatibilidad con borradores anteriores; la entrevista sencilla ya no las pide. */
export const ENTREVISTA_TABLES = {
  documentosPrometidos: { columns: [{ key: "documento", label: "Documento" }, { key: "responsable", label: "Responsable de entregarlo" }, { key: "fecha", label: "Fecha acordada" }] },
  contradicciones: { columns: [{ key: "dato", label: "Dato o pregunta" }, { key: "declarado", label: "Lo declarado" }, { key: "mostrado", label: "Soporte mostrado o ninguno" }, { key: "pendiente", label: "Qué falta aclarar" }] },
} as const;
export type EntrevistaTable = keyof typeof ENTREVISTA_TABLES;
export type EntrevistaRow = Record<string, string | undefined>;
const options = (values: readonly [string, string][]) => values.map(([value, label]) => ({ value, label }));
const base = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const select = (section: string, key: string, label: string, values: readonly { value: string; label: string }[], required = true): FormatoField => ({ section, key, label, type: "choice", options: values, required });

const DATOS = "Datos de la entrevista", QUIEN = "01 / Quién es", INMUEBLE = "02 / El inmueble", VENTA = "03 / Por qué vende y cuánto espera", SIGUE = "04 / Siguiente paso";

export const entrevistaFields: FormatoField[] = [
  base(DATOS, "folio", "Folio de la operación"),
  base(DATOS, "fechaEntrevista", "Fecha de entrevista", "date"),
  base(DATOS, "horaEntrevista", "Hora de entrevista", "time", false),
  base(DATOS, "asesor", "Asesor que entrevista"),
  base(DATOS, "operacion", "Operación", "text", false),
  base(DATOS, "origenContacto", "¿Cómo llegó con nosotros?", "text", false),
  select(DATOS, "avisoPrivacidad", "¿Se le entregó el aviso de privacidad?", options([["si", "Sí"], ["pendiente", "Pendiente"]])),

  base(QUIEN, "entrevistado", "Nombre de quien responde"),
  select(QUIEN, "relacion", "Relación con el inmueble", options([["propietario", "Propietario"], ["copropietario", "Copropietario"], ["representante", "Apoderado o representante"], ["heredero", "Heredero"], ["otro", "Otra"]])),
  base(QUIEN, "propietario", "Nombre del propietario, si es otra persona", "text", false),
  select(QUIEN, "tipoPropietario", "El propietario es", options([["fisica", "Una persona"], ["moral", "Una empresa"]])),
  base(QUIEN, "fechaNacimiento", "Fecha de nacimiento", "date", false),
  base(QUIEN, "telefono", "Teléfono"),
  base(QUIEN, "correo", "Correo electrónico", "text", false),
  select(QUIEN, "estadoCivilActual", "Estado civil", options([["soltero", "Soltero"], ["casado", "Casado"], ["divorciado", "Divorciado"], ["viudo", "Viudo"], ["otro", "Otro"]])),
  base(QUIEN, "medioContacto", "¿Cómo prefiere que le contactemos?", "text", false),
  base(QUIEN, "horarioContacto", "¿A qué hora?", "text", false),

  select(INMUEBLE, "tipoInmueble", "Tipo de inmueble", options([["casa", "Casa"], ["departamento", "Departamento"], ["terreno", "Terreno"], ["local", "Local"], ["plaza", "Plaza o conjunto"], ["nave", "Nave o bodega"], ["otro", "Otro"]])),
  base(INMUEBLE, "inmueble", "Domicilio del inmueble"),
  select(INMUEBLE, "ocupacion", "¿Quién vive o lo ocupa hoy?", options([["propietario", "El propietario"], ["familia", "Su familia"], ["inquilino", "Un inquilino"], ["desocupado", "Está desocupado"], ["otro", "Otra persona"]])),
  select(INMUEBLE, "gravamen", "¿Tiene hipoteca o crédito?", options([["no", "No"], ["banco", "Banco"], ["infonavit", "Infonavit"], ["fovissste", "Fovissste"], ["otro", "Otro"], ["no_sabe", "No sabe"]])),

  base(VENTA, "motivoVenta", "¿Por qué vende?", "long"),
  base(VENTA, "fechaDeseada", "¿Para cuándo quiere vender?", "date", false),
  base(VENTA, "precioDeseado", "¿Cuánto quiere por el inmueble?", "money"),
  base(VENTA, "monedaPrecio", "Moneda"),
  base(VENTA, "fuentePrecio", "¿Cómo llegó a ese precio?", "text", false),
  base(VENTA, "expectativas", "¿Qué espera de nosotros? ¿Qué le preocupa?", "long", false),

  select(SIGUE, "siguientePaso", "Siguiente paso", options([["visita", "Visita al inmueble"], ["documentos", "Entregarle el checklist de documentos"], ["evaluacion", "Evaluar la operación"], ["pausa", "Pausar"], ["referir", "Referir"]])),
  base(SIGUE, "fechaSeguimiento", "Fecha de seguimiento", "date"),
  base(SIGUE, "motivoSiguiente", "Notas del asesor", "long", false),
];

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
/** El nombre del propietario solo se pide cuando responde otra persona. */
export function mostrarCampoEntrevista(key: string, data: Record<string, unknown>): boolean {
  if (key === "propietario") return hasText(data.relacion) && data.relacion !== "propietario";
  return true;
}
export function validarEntrevista(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (typeof data.precioDeseado === "number" && data.precioDeseado <= 0) errors.push("¿Cuánto quiere por el inmueble?");
  return errors;
}
