import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { ApiError, databaseError } from "@/lib/backend/http";
import { INBOX_READ_LIMIT, markRead } from "@/lib/admin/inbox";

/*
  Preferencias por usuario en el servidor (UX-02, UX-05): siguen a la persona en cualquier equipo.
  Cada quien solo lee y escribe su fila (RLS en fortius_inmuebles_user_preferences). Hoy guardan lo
  leído de «Para ti»; UX-02 agrega densidad, letra, tema, columnas, vistas, fijados y recientes.
*/
export const PREFERENCES_TABLE = "fortius_inmuebles_user_preferences";
const key = z.string().min(1).max(200);
const stamp = z.iso.datetime({ offset: true });
export const preferencesSchema = z.object({
  bandeja: z.object({ leidos: z.record(key, stamp).refine(value => Object.keys(value).length <= INBOX_READ_LIMIT, "Demasiados avisos leídos").default({}) }).strict().optional(),
}).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export type StoredPreferences = { data: Preferences; version: number };

export const readInput = z.object({ claves: z.array(key).min(1).max(100) }).strict();

export async function loadPreferences(client: SupabaseClient, userId: string): Promise<StoredPreferences> {
  const { data, error } = await client.from(PREFERENCES_TABLE).select("data,version").eq("user_id", userId).maybeSingle();
  if (error) databaseError(error);
  if (!data) return { data: {}, version: 0 };
  // Lo guardado que ya no cumple el esquema no tumba el panel: se trata como vacío.
  const parsed = preferencesSchema.safeParse(data.data);
  return { data: parsed.success ? parsed.data : {}, version: Number(data.version) || 0 };
}

/** Escribe sobre la versión leída; si otra pestaña escribió antes, devuelve null para reintentar. */
async function writePreferences(client: SupabaseClient, userId: string, data: Preferences, version: number) {
  const next = { data, version: version + 1, updated_at: new Date().toISOString() };
  const query = version === 0
    ? client.from(PREFERENCES_TABLE).insert({ user_id: userId, ...next }).select("version").maybeSingle()
    : client.from(PREFERENCES_TABLE).update(next).eq("user_id", userId).eq("version", version).select("version").maybeSingle();
  const { data: row, error } = await query;
  if (error?.code === "23505") return null;
  if (error) databaseError(error);
  return row ? { data, version: Number(row.version) } : null;
}

/** Marca avisos de «Para ti» como leídos. Se mezcla en el servidor: dos pestañas no se pisan. */
export async function markInboxRead(client: SupabaseClient, userId: string, keys: readonly string[], now = new Date()): Promise<StoredPreferences> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await loadPreferences(client, userId);
    const leidos = markRead(current.data.bandeja?.leidos ?? {}, keys, now.toISOString());
    const saved = await writePreferences(client, userId, { ...current.data, bandeja: { leidos } }, current.version);
    if (saved) return saved;
  }
  throw new ApiError(409, "Tus preferencias cambiaron en otra ventana; vuelve a intentarlo");
}
