import { entrevistaFields } from "../entrevista";
import { a, dinero, fecha, junta, type Block, type Documento, type FormCell, type Marca } from "./modelo";

/*
  02 · Entrevista inicial, versión sencilla (decisión del titular, 17/10/2026): quién es el
  propietario o su apoderado, cómo contactarlo, lo mínimo del inmueble, por qué vende y cuánto
  espera. Lo legal y lo fiscal se revisan con sus documentos (05).
  Captura sobre el documento (EXT-12, 28/10/2026): el título va en el membrete, como el 04A;
  cada celda dice qué campos la llenan («keys») y las listas cortas se imprimen como casillas.
  Si no hay respuesta, queda el espacio para escribirla a mano.
*/

type Data = Record<string, unknown>;
const opciones = (key: string) => entrevistaFields.find(f => f.key === key)?.options ?? [];
const label = (key: string, value: unknown) => opciones(key).find(o => o.value === value)?.label ?? a(value);
const c = (q: string, answer: string, w: number, keys: string[]): FormCell => ({ q, a: answer, w, keys });
/** Casillas con las opciones del campo; la elegida lleva su X. */
const marcas = (q: string, key: string, d: Data, w: number): FormCell => ({ q, a: "", w, keys: [key], marks: [opciones(key).map((o): Marca => ({ text: o.label, check: o.value === d[key] }))] });
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const money = (value: unknown, currency: unknown) => typeof value === "number" ? dinero(value, currency) : "";

export function entrevistaDocumento(d: Data): Documento {
  const owner = d.relacion && d.relacion !== "propietario" ? a(d.propietario) : a(d.entrevistado);
  const blocks: Block[] = [
    { kind: "form", rows: [
      [c("Fecha y hora", junta(f(d.fechaEntrevista), d.horaEntrevista), 3, ["fechaEntrevista", "horaEntrevista"]), c("Asesor que entrevista", a(d.asesor), 3, ["asesor"])],
      // El folio lo asigna el sistema al crear la operación.
      [{ q: "Folio", a: a(d.folio), w: 1.6 }, c("Operación", a(d.operacion), 1.6, ["operacion"]), c("¿Cómo llegó con nosotros?", a(d.origenContacto), 2.8, ["origenContacto"])],
      [marcas("¿Se le entregó el aviso de privacidad?", "avisoPrivacidad", d, 6)],
    ] },
    { kind: "form", label: "01 / Quién es", rows: [
      [c("¿Quién responde la entrevista? Nombre completo", a(d.entrevistado), 3, ["entrevistado"]), c("¿Qué relación tiene con el inmueble?", label("relacion", d.relacion), 3, ["relacion"])],
      // Si responde otra persona, aquí se anota el propietario; la relación decide si se pide.
      [c("¿Quién es el propietario? Nombre o razón social", owner, 3.6, ["relacion", "propietario"]), marcas("El propietario es", "tipoPropietario", d, 2.4)],
      [c("Fecha de nacimiento", f(d.fechaNacimiento), 2, ["fechaNacimiento"]), c("Teléfono", a(d.telefono), 2, ["telefono"]), c("Correo electrónico", a(d.correo), 2, ["correo"])],
      [marcas("Estado civil", "estadoCivilActual", d, 6)],
      [c("¿Cómo y a qué hora prefiere que le contactemos?", junta(d.medioContacto, d.horarioContacto), 6, ["medioContacto", "horarioContacto"])],
    ] },
    { kind: "form", label: "02 / El inmueble", rows: [
      [c("¿Qué tipo de inmueble quiere vender?", label("tipoInmueble", d.tipoInmueble), 2, ["tipoInmueble"]), c("¿Dónde se encuentra?", a(d.inmueble), 4, ["inmueble"])],
      [c("¿Quién vive o lo ocupa hoy?", label("ocupacion", d.ocupacion), 6, ["ocupacion"])],
      [marcas("¿Tiene hipoteca o crédito?", "gravamen", d, 6)],
    ] },
    { kind: "form", label: "03 / Por qué vende y cuánto espera", rows: [
      [c("¿Por qué quiere vender?", a(d.motivoVenta), 6, ["motivoVenta"])],
      [c("¿Para cuándo quiere vender?", f(d.fechaDeseada), 2, ["fechaDeseada"]), c("¿Cuánto quiere por el inmueble?", money(d.precioDeseado, d.monedaPrecio), 2, ["precioDeseado", "monedaPrecio"]), c("¿Cómo llegó a ese precio?", a(d.fuentePrecio), 2, ["fuentePrecio"])],
      [c("¿Qué espera de nosotros? ¿Qué le preocupa?", a(d.expectativas), 6, ["expectativas"])],
    ] },
    { kind: "form", label: "04 / Siguiente paso · llena el asesor", rows: [
      [c("Siguiente paso acordado", label("siguientePaso", d.siguientePaso), 3, ["siguientePaso"]), c("Fecha de seguimiento", f(d.fechaSeguimiento), 3, ["fechaSeguimiento"])],
      [c("Notas del asesor", a(d.motivoSiguiente), 6, ["motivoSiguiente"])],
    ] },
    { kind: "note", text: "La entrevista sirve para conocer al propietario. Los datos de la escritura, el registro, la adquisición y lo fiscal se toman de sus documentos en la revisión jurídica. La entrevista no autoriza publicación ni recepción de dinero, ni fija precio, comisión o exclusiva." },
  ];
  return { title: "Entrevista inicial", subject: `Formato 02 · ${a(d.folio)}`, blocks };
}
