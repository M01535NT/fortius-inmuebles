import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "./auth";

/*
  Decisión del titular (13/11/2026): lo público que se quita de un inmueble (fotos, documentos, video)
  deja de estar disponible en su dirección pública al guardar. Antes seguía en internet para quien tuviera
  la dirección; una foto subida por error con datos personales no se retiraba.
  Para que la eliminación sea recuperable, el archivo no se borra: se mueve al almacenamiento privado
  (`retirados/<ruta>`). Si después la misma dirección vuelve a un inmueble (por ejemplo, al copiar una
  versión anterior), al guardar regresa a su lugar público.
  Solo se retira lo que estaba en el inmueble antes de guardar, ya no está, y ningún otro registro
  (otro inmueble, el blog, la configuración, el contenido, un asesor, cualquier otro registro o algo
  en Eliminados) usa. Si algo falla, el guardado sigue hecho; el archivo queda como estaba.
  Ensayo del 13/11/2026 en el Supabase de pruebas: la dirección deja de servir el archivo al momento, pero
  una copia que la caché pública ya tenía puede seguir viéndose hasta una hora (max-age=3600).
*/
const PUBLIC_BUCKET = "fortius-inmuebles-public";
const PRIVATE_BUCKET = "fortius-inmuebles-private";
const RETIRED = "retirados/";
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

/** Lo que está en `from` y no en `to`. */
export function removedPaths(from: unknown, to: unknown): string[] {
  const kept = publicPaths(to);
  return [...publicPaths(from)].filter(path => !kept.has(path));
}

export const retiredPath = (path: string) => `${RETIRED}${path}`;

type Service = Pick<SupabaseClient, "from" | "storage">;
/** Cómo estaba el inmueble antes de guardar (data null si es nuevo). null si no se pudo leer: entonces no se toca nada. */
export type PublicFilesSnapshot = { service: Service; data: unknown } | null;

export async function publicFilesBeforeSave(propertyId: string, service?: Service): Promise<PublicFilesSnapshot> {
  try {
    const client = service ?? createServerClient(undefined, true);
    const { data, error } = await client.from("fortius_inmuebles_records").select("data").eq("collection", "propiedades").eq("id", propertyId).maybeSingle();
    if (error) return null;
    return { service: client, data: data?.data ?? null };
  } catch {
    return null;
  }
}

const failed = (event: string, count: number) => console.error(JSON.stringify({ event, count }));

/** Después de guardar: retira lo que se quitó y nadie más usa, y regresa lo retirado que se volvió a poner. */
export async function syncPublicFiles(before: PublicFilesSnapshot, propertyId: string, after: unknown): Promise<{ retired: number; restored: number }> {
  const result = { retired: 0, restored: 0 };
  if (!before) return result;
  const { service } = before;
  // Lo nuevo puede ser un archivo retirado que vuelve; si no estaba retirado, mover falla y no pasa nada.
  for (const path of removedPaths(after, before.data)) {
    try {
      const { error } = await service.storage.from(PRIVATE_BUCKET).move(retiredPath(path), path, { destinationBucket: PUBLIC_BUCKET });
      if (!error) result.restored += 1;
    } catch { /* no estaba retirado */ }
  }
  const candidates = removedPaths(before.data, after);
  if (!candidates.length) return result;
  try {
    const { data, error } = await service.from("fortius_inmuebles_records").select("collection,id,data");
    if (error || !data) return result;
    // Lo que está en Eliminados vive en el historial; si se restaura, sus fotos deben seguir ahí.
    const trash = await service.from("fortius_inmuebles_record_history").select("snapshot").eq("action", "DELETE").is("restored_at", null);
    if (trash.error || !trash.data) return result;
    const inUse = new Set<string>();
    for (const row of data as { collection: string; id: string; data: unknown }[])
      if (!(row.collection === "propiedades" && row.id === propertyId)) publicPaths(row.data, inUse);
    for (const row of trash.data as { snapshot: unknown }[]) publicPaths(row.snapshot, inUse);
    let errors = 0;
    for (const path of candidates.filter(item => !inUse.has(item))) {
      const { error: moveError } = await service.storage.from(PUBLIC_BUCKET).move(path, retiredPath(path), { destinationBucket: PRIVATE_BUCKET });
      if (moveError) errors += 1; else result.retired += 1;
    }
    if (errors) failed("public_file_retire_failed", errors);
  } catch {
    failed("public_file_retire_failed", candidates.length);
  }
  return result;
}
