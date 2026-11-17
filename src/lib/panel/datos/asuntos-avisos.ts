import { pedir } from "@/lib/panel/datos/colecciones";
import type { Actividad, AvisoAsunto } from "@/lib/panel/datos/asuntos";

/**
 * Avisos del asunto que calcula el servidor con sus documentos (DEC-61: lo que antes frenaba ahora avisa):
 * arranque del propietario (checklist, 02 y 04) y los legales de la promesa 15 y del aviso de privacidad 01.
 * «Seguir así» deja una nota en el historial del asunto y el aviso ya no se muestra.
 */

type AvisoServidor = { clave: AvisoAsunto["clave"]; texto: string; legal?: boolean; documento?: { formato: string; id?: string } };

export async function leerAvisosDelServidor(expedienteId: string, senal?: AbortSignal): Promise<AvisoAsunto[]> {
  const lista = await pedir<AvisoServidor[]>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/avisos`, { method: "GET", signal: senal }, "avisos");
  return lista.map((a) => ({
    clave: a.clave, texto: a.texto, legal: a.legal === true, documento: a.documento,
    accion: a.documento ? (a.documento.id ? "Abrir documento" : "Crear documento") : a.clave === "checklist" ? "Ver documentos" : null,
  }));
}

/** Prefijo fijo de la nota que deja «Seguir así»; con él se sabe qué avisos ya se aceptaron. */
export const PREFIJO_SEGUIR = "Seguir así: ";
export const notaSeguirAsi = (a: Pick<AvisoAsunto, "texto">) => `${PREFIJO_SEGUIR}${a.texto}.`;

/** Textos de los avisos que alguien ya dejó «así» en este asunto. */
export function avisosAceptados(actividad: readonly Pick<Actividad, "descripcion">[]): Set<string> {
  return new Set(actividad.filter((x) => x.descripcion.startsWith(PREFIJO_SEGUIR)).map((x) => x.descripcion.slice(PREFIJO_SEGUIR.length).replace(/\.$/, "")));
}

/** Une los avisos de la pantalla con los del servidor, sin repetir clave, y quita los aceptados. Los legales van primero. */
export function unirAvisos(locales: readonly AvisoAsunto[], servidor: readonly AvisoAsunto[], aceptados: ReadonlySet<string>): AvisoAsunto[] {
  const vistos = new Set<string>();
  return [...locales, ...servidor]
    .filter((a) => { if (vistos.has(a.clave) || aceptados.has(a.texto)) return false; vistos.add(a.clave); return true; })
    .sort((a, b) => Number(b.legal === true) - Number(a.legal === true));
}
