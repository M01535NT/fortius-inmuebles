import { ErrorDeLectura, pedir } from "@/lib/panel/datos/colecciones";

/**
 * Historial del inmueble (panel nuevo): lo que el sistema anota solo al publicar («Publicar así» con los avisos que se
 * aceptaron), quitar del sitio, cambiar el precio o la dirección exacta. Vive en el historial de PN-02 del servidor
 * (`/api/admin/propiedades/<slug>/historial`); mientras esa tabla no exista la ruta responde 503 y la pestaña lo dice.
 */
export type AccionHistorial = "publicar" | "publicar_asi" | "quitar_sitio" | "precio" | "direccion_exacta";
export type EntradaHistorial = { id: number; accion: AccionHistorial | string; resumen: string; detalle: { antes?: number | string; despues?: number | string; avisos?: string[] } | null; actorId: string | null; creadoEl: string };
export type AnotarHistorial = { accion: AccionHistorial; resumen: string; detalle?: { antes?: number | string; despues?: number | string; avisos?: string[] } };

const ruta = (slug: string) => `/api/admin/propiedades/${encodeURIComponent(slug)}/historial`;

/** `pendiente`: el servidor todavía no tiene el historial (503); la pestaña dice que llega después. */
export async function leerHistorialInmueble(slug: string, senal?: AbortSignal): Promise<{ entradas: EntradaHistorial[]; pendiente: boolean }> {
  try {
    return { entradas: await pedir<EntradaHistorial[]>(ruta(slug), { method: "GET", signal: senal }, "historial"), pendiente: false };
  } catch (e) {
    if (e instanceof ErrorDeLectura && e.estado === 503) return { entradas: [], pendiente: true };
    throw e;
  }
}

/** Anota sin frenar nada: si el historial aún no existe o falla, lo guardado se queda guardado y devuelve false. */
export async function anotarHistorialInmueble(slug: string, d: AnotarHistorial): Promise<boolean> {
  try {
    await pedir(ruta(slug), { method: "POST", body: JSON.stringify({ ...d, resumen: d.resumen.slice(0, 500), detalle: d.detalle ? { ...d.detalle, avisos: d.detalle.avisos?.slice(0, 20).map((a) => a.slice(0, 200)) } : undefined }) }, "entrada");
    return true;
  } catch {
    return false;
  }
}

/** Ícono del sistema para cada anotación (de los 28 de `iconos-datos`). */
const ICONO: Record<string, "compartir" | "alerta" | "precio" | "ubicacion"> = {
  publicar: "compartir", publicar_asi: "alerta", quitar_sitio: "compartir", precio: "precio", direccion_exacta: "ubicacion",
};
export const iconoEntrada = (accion: string) => ICONO[accion] ?? "compartir";

/** «16 nov 2026, 10:42» en hora local. */
export function cuandoEntrada(iso: string): string {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return "";
  return `${f.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}, ${f.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}`;
}
