import type { DocumentoDelInmueble, FilaInmueble, Inmueble, Medio } from "@/lib/backend/inmuebles-contrato";
import { FalloPanel } from "@/lib/panel/asuntos/api";

export * from "@/lib/backend/inmuebles-contrato";

async function pedir<T>(ruta: string, metodo = "GET", cuerpo?: unknown): Promise<T> {
  let r: Response;
  try {
    const esForm = cuerpo instanceof FormData;
    r = await fetch(ruta, {
      method: metodo, credentials: "same-origin", cache: "no-store",
      headers: cuerpo === undefined || esForm ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : esForm ? cuerpo : JSON.stringify(cuerpo),
    });
  } catch {
    throw new FalloPanel(0, "Sin conexión. Vuelve a intentarlo cuando regrese.");
  }
  const datos = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new FalloPanel(r.status, datos.error ?? "No se pudo terminar. Vuelve a intentarlo.");
  return datos as T;
}

const base = "/api/admin/inmuebles";

export type CambioInmueble = Partial<Pick<Inmueble,
  "nombre" | "tipo" | "operacion" | "estado" | "precio" | "moneda" | "ficha" | "colonia" | "ciudad" | "referencias" | "direccion_exacta"
  | "mostrar_direccion" | "mapa" | "descripcion" | "publicado" | "portada_id" | "conjunto_id" | "unidades_total" | "compartido" | "inmobiliaria">> & { motivo_precio?: string };

export const leerInmuebles = () => pedir<{ inmuebles: FilaInmueble[] }>(base).then((r) => r.inmuebles);
export const leerInmueble = (id: string) => pedir<{ inmueble: Inmueble }>(`${base}/${id}`).then((r) => r.inmueble);
export const nuevoInmueble = (cuerpo: { nombre: string; tipo?: string; operacion?: string; asunto_id?: string; propietario?: string }) =>
  pedir<{ inmueble: { id: string; folio: string; asunto_id: string } }>(base, "POST", cuerpo).then((r) => r.inmueble);
export const guardarInmueble = (id: string, version: number, cambio: CambioInmueble) =>
  pedir<{ inmueble: Inmueble }>(`${base}/${id}`, "PATCH", { version, ...cambio }).then((r) => r.inmueble);
export const eliminarInmueble = (id: string, version: number) => pedir<object>(`${base}/${id}`, "DELETE", { version });
export const copiarInmueble = (id: string, asunto_id: string, nombre?: string) =>
  pedir<{ inmueble: { id: string; folio: string } }>(`${base}/${id}/copiar`, "POST", { asunto_id, nombre }).then((r) => r.inmueble);
export const publicarVarios = (ids: string[], publicar: boolean) =>
  pedir<{ cambiados: number }>(`${base}/lote`, "POST", { ids, publicar }).then((r) => r.cambiados);
export function subirMedio(id: string, tipo: Medio["tipo"], archivo: File) {
  const f = new FormData();
  f.set("tipo", tipo);
  f.set("archivo", archivo);
  return pedir<{ medio: Medio }>(`${base}/${id}/medios`, "POST", f).then((r) => r.medio);
}
export const ponerEnlace = (id: string, tipo: "video" | "recorrido_360", url: string) =>
  pedir<{ medio: Medio }>(`${base}/${id}/medios`, "POST", { tipo, url }).then((r) => r.medio);
export const cambiarMedio = (id: string, cambio: { id: string; orden?: number; alt?: string | null; retirar?: true }) =>
  pedir<object>(`${base}/${id}/medios`, "PATCH", cambio);
export function agregarDocumento(id: string, nombre: string, archivo?: File) {
  if (!archivo) return pedir<{ documento: DocumentoDelInmueble }>(`${base}/${id}/documentos`, "POST", { nombre }).then((r) => r.documento);
  const f = new FormData();
  f.set("nombre", nombre);
  f.set("archivo", archivo);
  return pedir<{ documento: DocumentoDelInmueble }>(`${base}/${id}/documentos`, "POST", f).then((r) => r.documento);
}
