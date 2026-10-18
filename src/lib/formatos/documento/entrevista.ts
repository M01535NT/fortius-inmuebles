import { entrevistaFields } from "../entrevista";
import { a, dinero, fecha, junta, type Block, type Documento } from "./modelo";

/*
  02 · Entrevista inicial, versión sencilla (decisión del titular, 17/10/2026): quién es el
  propietario o su apoderado, cómo contactarlo, lo mínimo del inmueble, por qué vende y cuánto
  espera. Cada celda muestra lo que se capturó en el panel; si no hay respuesta, queda el
  espacio para escribirla a mano. Lo legal y lo fiscal se revisan con sus documentos (05).
*/

type Data = Record<string, unknown>;
type Cell = { q: string; a: string; w: number };
const label = (key: string, value: unknown) => entrevistaFields.find(f => f.key === key)?.options?.find(o => o.value === value)?.label ?? a(value);
const c = (q: string, answer: string, w: number): Cell => ({ q, a: answer, w });
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const money = (value: unknown, currency: unknown) => typeof value === "number" ? dinero(value, currency) : "";

export function entrevistaDocumento(d: Data): Documento {
  const aviso = d.avisoPrivacidad === "si" ? "Sí" : d.avisoPrivacidad === "pendiente" ? "Pendiente" : "";
  const owner = d.relacion && d.relacion !== "propietario" ? a(d.propietario) : a(d.entrevistado);
  const blocks: Block[] = [
    { kind: "title", text: "Entrevista inicial", bold: true },
    { kind: "form", rows: [
      [c("Fecha y hora", junta(f(d.fechaEntrevista), d.horaEntrevista), 3), c("Asesor que entrevista", a(d.asesor), 3)],
      [c("Folio", a(d.folio), 1.6), c("Operación", a(d.operacion), 1.6), c("¿Cómo llegó con nosotros?", a(d.origenContacto), 2.8)],
      [c("¿Se le entregó el aviso de privacidad?", aviso, 6)],
    ] },
    { kind: "form", label: "01 / Quién es", rows: [
      [c("¿Quién responde la entrevista? Nombre completo", a(d.entrevistado), 3), c("¿Qué relación tiene con el inmueble?", label("relacion", d.relacion), 3)],
      [c("¿Quién es el propietario? Nombre o razón social", owner, 4.4), c("El propietario es", label("tipoPropietario", d.tipoPropietario), 1.6)],
      [c("Fecha de nacimiento", f(d.fechaNacimiento), 2), c("Teléfono", a(d.telefono), 2), c("Correo electrónico", a(d.correo), 2)],
      [c("Estado civil", label("estadoCivilActual", d.estadoCivilActual), 2), c("¿Cómo y a qué hora prefiere que le contactemos?", junta(d.medioContacto, d.horarioContacto), 4)],
    ] },
    { kind: "form", label: "02 / El inmueble", rows: [
      [c("¿Qué tipo de inmueble quiere vender?", label("tipoInmueble", d.tipoInmueble), 2), c("¿Dónde se encuentra?", a(d.inmueble), 4)],
      [c("¿Quién vive o lo ocupa hoy?", label("ocupacion", d.ocupacion), 3), c("¿Tiene hipoteca o crédito?", label("gravamen", d.gravamen), 3)],
    ] },
    { kind: "form", label: "03 / Por qué vende y cuánto espera", rows: [
      [c("¿Por qué quiere vender?", a(d.motivoVenta), 6)],
      [c("¿Para cuándo quiere vender?", f(d.fechaDeseada), 2), c("¿Cuánto quiere por el inmueble?", money(d.precioDeseado, d.monedaPrecio), 2), c("¿Cómo llegó a ese precio?", a(d.fuentePrecio), 2)],
      [c("¿Qué espera de nosotros? ¿Qué le preocupa?", a(d.expectativas), 6)],
    ] },
    { kind: "form", label: "04 / Siguiente paso · llena el asesor", rows: [
      [c("Siguiente paso acordado", label("siguientePaso", d.siguientePaso), 3), c("Fecha de seguimiento", f(d.fechaSeguimiento), 3)],
      [c("Notas del asesor", a(d.motivoSiguiente), 6)],
    ] },
    { kind: "note", text: "La entrevista sirve para conocer al propietario. Los datos de la escritura, el registro, la adquisición y lo fiscal se toman de sus documentos en la revisión jurídica. La entrevista no autoriza publicación ni recepción de dinero, ni fija precio, comisión o exclusiva." },
  ];
  return { title: "Entrevista inicial", subject: `Formato 02 · ${a(d.folio)}`, blocks };
}
