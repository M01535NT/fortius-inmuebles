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
  Solo se retira lo que estaba en el inmueble antes de guardar, ya no está, y nada más en la base usa:
  otro inmueble o sus versiones, el blog, fichas de Herramientas, cartera, formatos, expedientes o algo
  en Eliminados (función fortius_inmuebles_public_files_in_use). Si algo falla, el guardado sigue hecho; el archivo queda como estaba.
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

/** Cómo puede aparecer la ruta dentro de un texto guardado: tal cual o codificada como en una dirección. */
export function needles(path: string): string[] {
  const prefix = `${PUBLIC_BUCKET}/`;
  return [...new Set([path, encodeURI(path), path.split("/").map(encodeURIComponent).join("/")].map(item => prefix + item))];
}

type Service = Pick<SupabaseClient, "from" | "storage" | "rpc">;
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
    // La base revisa todas sus tablas (fichas de Herramientas, cartera, formatos, historial…) de una vez:
    // leer tabla por tabla desde aquí se corta en 1000 filas (C-59) y olvida tablas (C-60).
    const byNeedle = new Map(candidates.flatMap(path => needles(path).map(needle => [needle, path] as const)));
    const { data, error } = await service.rpc("fortius_inmuebles_public_files_in_use", { p_needles: [...byNeedle.keys()], p_property_id: propertyId });
    if (error || !Array.isArray(data)) return result;
    const inUse = new Set((data as string[]).map(needle => byNeedle.get(needle)));
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
