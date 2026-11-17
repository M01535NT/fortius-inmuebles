import type { Lead } from "@/lib/domain/records";

/**
 * Respuesta lista según la consulta (PN-05, boceto de Consultas). Funciones puras: arman el texto que el asesor
 * envía él mismo por WhatsApp o correo. El panel no manda nada solo.
 * - El texto cambia con lo que la persona busca (comprar, rentar, vender, poner en renta, invertir),
 *   con el inmueble que le interesa y con el momento (primera respuesta, visita, pedir datos, no contestó).
 * - Una consulta anotada a mano (ya se habló con ella) no lleva «gracias por escribir».
 */

export type Plantilla = "primera" | "visita" | "datos" | "sin_respuesta";

export const NOMBRE_PLANTILLA: Record<Plantilla, string> = {
  primera: "Primera respuesta",
  visita: "Ofrecer visita",
  datos: "Preguntar qué busca",
  sin_respuesta: "No contestó",
};

export type DatosRespuesta = {
  nombre: string;
  inmueble?: string;
  operacion?: NonNullable<Lead["perfil"]>["operacion"];
  /** Quien firma: el asesor que la atiende. Sin nombre, firma Fortius Inmuebles. */
  firmante?: string;
  aMano: boolean;
  pestana: "por_atender" | "seguimiento" | "cerradas";
};

/** Qué textos tienen sentido para esta consulta, en el orden del desplegable. */
export function plantillasDe(d: Pick<DatosRespuesta, "inmueble" | "aMano">): Plantilla[] {
  const lista: Plantilla[] = [];
  if (!d.aMano) lista.push("primera");
  if (d.inmueble) lista.push("visita");
  lista.push("datos", "sin_respuesta");
  return lista;
}

/** El texto con que arranca: por atender, la primera respuesta; después, la visita si hay inmueble o preguntar lo que busca. */
export function plantillaInicial(d: Pick<DatosRespuesta, "inmueble" | "aMano" | "pestana">): Plantilla {
  if (d.pestana === "por_atender" && !d.aMano) return "primera";
  return d.inmueble ? "visita" : "datos";
}

const primerNombre = (nombre: string) => {
  const n = nombre.trim();
  return !n || n === "Sin nombre" ? "" : ` ${n.split(/\s+/)[0]}`;
};

/** Lo que conviene preguntar según lo que busca, para preparar la llamada. */
function pregunta(operacion: DatosRespuesta["operacion"], inmueble?: string): string {
  switch (operacion) {
    case "comprar":
      return inmueble
        ? "¿Lo pagarías con crédito (bancario, Infonavit o Fovissste) o de contado?"
        : "¿Qué zona te interesa, cuántas recámaras necesitas y lo pagarías con crédito o de contado?";
    case "rentar":
      return "¿Para cuándo necesitas mudarte y cuánto tienes pensado pagar de renta al mes?";
    case "vender":
      return "¿Dónde está tu inmueble y cuándo te queda bien que lo veamos?";
    case "arrendar":
      return "¿Dónde está tu inmueble y desde cuándo estaría disponible para rentarse?";
    case "invertir":
      return "¿Qué tipo de inversión buscas (para rentar o para revender) y con qué presupuesto?";
    default:
      return inmueble ? "¿Te gustaría verlo en persona?" : "¿Qué estás buscando: zona, tipo de inmueble y presupuesto?";
  }
}

/** Arma el texto listo para enviar. */
export function armarRespuesta(plantilla: Plantilla, d: DatosRespuesta): string {
  const hola = `Hola${primerNombre(d.nombre)}`;
  const soy = d.firmante?.trim() ? `soy ${d.firmante.trim().split(/\s+/)[0]}, de Fortius Inmuebles` : "te escribo de Fortius Inmuebles";
  const sobre = d.inmueble ? ` por ${d.inmueble}` : "";
  switch (plantilla) {
    case "primera":
      return `${hola}, ${soy}. Gracias por escribirnos${sobre}. ${pregunta(d.operacion, d.inmueble)} ¿A qué hora te puedo llamar?`;
    case "visita":
      return `${hola}, ${soy}. ¿Te gustaría ver ${d.inmueble ?? "el inmueble"} en persona? Dime qué día y hora te quedan bien y te confirmo la visita.`;
    case "datos":
      return `${hola}, ${soy}. ${pregunta(d.operacion, d.inmueble)} Con eso te preparo opciones.`;
    case "sin_respuesta":
      return `${hola}, ${soy}. Te busqué${sobre ? ` para platicar${sobre}` : ""} y no logré comunicarme. ¿A qué hora te puedo llamar?`;
  }
}

/** Para correo: la misma respuesta con despedida y firma. */
export function conFirmaDeCorreo(texto: string, firmante?: string): string {
  const firma = firmante?.trim() ? `${firmante.trim()}\nFortius Inmuebles` : "Fortius Inmuebles";
  return `${texto.trim()}\n\nSaludos,\n${firma}`;
}

/** Asunto del correo: el inmueble si lo hay. */
export const asuntoDeCorreo = (inmueble?: string) => (inmueble ? `Fortius Inmuebles · ${inmueble}` : "Fortius Inmuebles");
