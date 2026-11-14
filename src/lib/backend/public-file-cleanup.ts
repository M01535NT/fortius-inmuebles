import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "./auth";

/*
  Decisión del titular (13/11/2026): lo público que se quita de un inmueble (fotos, documentos, video)
  se borra del almacenamiento público al guardar. Antes seguía en internet para quien tuviera la
  dirección; una foto subida por error con datos personales no se retiraba.
  Solo se borra lo que estaba en el inmueble antes de guardar, ya no está, y ningún otro registro
  (otro inmueble, el blog, la configuración, el contenido, un asesor, cualquier otro registro o algo en Eliminados) usa. Las versiones anteriores
  del historial que lo mostraban quedan sin esa imagen: para recuperarla hay que volver a subirla.
  Si el borrado falla, el guardado sigue hecho; solo queda el archivo como antes.
*/
const BUCKET = "fortius-inmuebles-public";
const PUBLIC_URL = /\/storage\/v1\/(?:object|render\/image)\/public\/fortius-inmuebles-public\/([^?#]+)/;

/** Rutas dentro del almacenamiento público a las que apunta cualquier texto del registro. */
export function publicPaths(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    const match = PUBLIC_URL.exec(value);
    if (match) {
      try { found.add(decodeURIComponent(match[1])); } catch { /* una dirección mal formada no es un archivo nuestro */ }
    }
  } else if (Array.isArray(value)) value.forEach(item => publicPaths(item, found));
  else if (value && typeof value === "object") Object.values(value).forEach(item => publicPaths(item, found));
  return found;
}

/** Lo que estaba antes y ya no está. */
export function removedPaths(before: unknown, after: unknown): string[] {
  const kept = publicPaths(after);
  return [...publicPaths(before)].filter(path => !kept.has(path));
}

type Service = Pick<SupabaseClient, "from" | "storage">;
export type PublicFilesSnapshot = { service: Service; data: unknown } | null;

/** Lo que el inmueble tenía antes de guardar. Si no se puede leer, no se borrará nada. */
export async function publicFilesBeforeSave(propertyId: string, service?: Service): Promise<PublicFilesSnapshot> {
  try {
    const client = service ?? createServerClient(undefined, true);
    const { data, error } = await client.from("fortius_inmuebles_records").select("data").eq("collection", "propiedades").eq("id", propertyId).maybeSingle();
    if (error || !data || !publicPaths(data.data).size) return null;
    return { service: client, data: data.data };
  } catch {
    return null;
  }
}

export async function removeOrphanedPublicFiles(before: PublicFilesSnapshot, propertyId: string, after: unknown): Promise<number> {
  if (!before) return 0;
  const { service } = before;
  const candidates = removedPaths(before.data, after);
  if (!candidates.length) return 0;
  try {
    const { data, error } = await service.from("fortius_inmuebles_records").select("collection,id,data");
    if (error || !data) return 0;
    // Lo que está en Eliminados vive en el historial; si se restaura, sus fotos deben seguir ahí.
    const trash = await service.from("fortius_inmuebles_record_history").select("snapshot").eq("action", "DELETE").is("restored_at", null);
    if (trash.error || !trash.data) return 0;
    const inUse = new Set<string>();
    for (const row of data as { collection: string; id: string; data: unknown }[])
      if (!(row.collection === "propiedades" && row.id === propertyId)) publicPaths(row.data, inUse);
    for (const row of trash.data as { snapshot: unknown }[]) publicPaths(row.snapshot, inUse);
    const orphaned = candidates.filter(path => !inUse.has(path));
    if (!orphaned.length) return 0;
    const removed = await service.storage.from(BUCKET).remove(orphaned);
    if (removed.error) {
      console.error(JSON.stringify({ event: "public_file_cleanup_failed", count: orphaned.length }));
      return 0;
    }
    return orphaned.length;
  } catch {
    console.error(JSON.stringify({ event: "public_file_cleanup_failed", count: candidates.length }));
    return 0;
  }
}
