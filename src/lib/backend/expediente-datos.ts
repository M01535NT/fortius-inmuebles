import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { datosGuardados, llenarDesdeDatos, type DatosGuardados } from "@/lib/formatos/datos-expediente";
import { ApiError, databaseError } from "./http";

/*
  Datos del expediente en el servidor: se leen con la RLS del expediente y se guardan con versión
  (un cambio de otra persona da 409). Al confirmar, llenan las celdas vacías de los borradores del
  expediente, cada uno con su propia versión; si un borrador cambió en ese momento, se deja como
  está y se llenará al abrirlo o al volver a confirmar.
*/

export const escrituraDatos = z.object({ version: z.number().int().positive().nullable(), datos: datosGuardados }).strict();

export async function leerDatos(client: SupabaseClient, expedienteId: string): Promise<{ datos: DatosGuardados; version: number | null }> {
  const result = await client.from("fortius_inmuebles_expediente_datos").select("datos,version").eq("expediente_id", expedienteId).maybeSingle();
  if (result.error) databaseError(result.error);
  if (!result.data) return { datos: {}, version: null };
  const parsed = datosGuardados.safeParse(result.data.datos);
  return { datos: parsed.success ? parsed.data : {}, version: result.data.version as number };
}

export async function guardarDatos(privileged: SupabaseClient, userId: string, expedienteId: string, input: unknown) {
  const { version, datos } = escrituraDatos.parse(input);
  const row = { datos, updated_by: userId, updated_at: new Date().toISOString() };
  const saved = version === null
    ? await privileged.from("fortius_inmuebles_expediente_datos").insert({ expediente_id: expedienteId, ...row, version: 1 }).select("datos,version").maybeSingle()
    : await privileged.from("fortius_inmuebles_expediente_datos").update({ ...row, version: version + 1 }).eq("expediente_id", expedienteId).eq("version", version).select("datos,version").maybeSingle();
  if (saved.error) {
    if (saved.error.code === "23505") throw new ApiError(409, "Otra persona guardó los datos; recarga antes de continuar");
    databaseError(saved.error);
  }
  if (!saved.data) throw new ApiError(409, "Otra persona guardó los datos; recarga antes de continuar");
  return { datos: datosGuardados.parse(saved.data.datos), version: saved.data.version as number };
}

/** Llena las celdas vacías de los borradores del expediente con lo confirmado. Devuelve cuántos cambió. */
export async function aplicarDatos(client: SupabaseClient, expedienteId: string, datos: DatosGuardados): Promise<number> {
  const drafts = await client.from("fortius_inmuebles_formato_drafts").select("id,formato_id,data,version").eq("expediente_id", expedienteId);
  if (drafts.error) databaseError(drafts.error);
  let actualizados = 0;
  for (const draft of drafts.data ?? []) {
    const data = (draft.data ?? {}) as Record<string, unknown>;
    const { patch } = llenarDesdeDatos(draft.formato_id as string, data, datos);
    if (!Object.keys(patch).length) continue;
    const saved = await client.from("fortius_inmuebles_formato_drafts").update({ data: { ...data, ...patch }, version: (draft.version as number) + 1 }).eq("id", draft.id).eq("version", draft.version).select("id").maybeSingle();
    if (saved.error) databaseError(saved.error);
    if (saved.data) actualizados++;
  }
  return actualizados;
}
