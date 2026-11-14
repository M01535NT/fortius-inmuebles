import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError } from "./http";

/*
  C-20: número del recibo 18 = folio del expediente + consecutivo («FOL-R03»). Antes se contaban los
  recibos y se sumaba uno: dos recibos creados a la vez salían con el mismo número. Ahora el
  consecutivo sale del mayor ya usado y, después de crear el recibo, se comprueba que nadie más lo
  tenga; si se repite, se queda con él el recibo más antiguo y el nuevo toma el siguiente libre.
  El recibo recién creado todavía no se ha emitido, así que renumerarlo no cambia nada entregado.
*/
type Draft = { id: string; data: Record<string, unknown> | null; version: number; created_at: string };
const COLUMNAS = "id,expediente_id,formato_id,data,version,created_at,updated_at";

const numero = (draft: Pick<Draft, "data">) => typeof draft.data?.numeroRecibo === "string" ? draft.data.numeroRecibo : "";
const consecutivo = (folio: string, valor: string) => {
  const match = valor.startsWith(`${folio}-R`) ? /^(\d+)$/.exec(valor.slice(folio.length + 2)) : null;
  return match ? Number(match[1]) : 0;
};
export const formatoRecibo = (folio: string, n: number) => `${folio}-R${String(n).padStart(2, "0")}`;

/** El siguiente número libre: uno más que el mayor usado (y nunca menos que los números distintos más uno). */
export function siguienteRecibo(folio: string, usados: readonly string[]) {
  return formatoRecibo(folio, Math.max(new Set(usados).size, ...usados.map(valor => consecutivo(folio, valor))) + 1);
}

async function recibos(client: SupabaseClient, expedienteId: string) {
  const result = await client.from("fortius_inmuebles_formato_drafts").select("id,data,version,created_at").eq("expediente_id", expedienteId).eq("formato_id", "18");
  if (result.error) databaseError(result.error);
  return (result.data ?? []) as Draft[];
}

export async function numeroReciboNuevo(client: SupabaseClient, expedienteId: string, folio: string) {
  return siguienteRecibo(folio, (await recibos(client, expedienteId)).map(numero).filter(Boolean));
}

const antes = (a: Draft, b: Draft) => a.created_at < b.created_at || a.created_at === b.created_at && a.id < b.id;

/** Tras crear el recibo: si otro más antiguo ya tiene su número, lo renumera al siguiente libre. */
export async function asegurarReciboUnico<T extends Draft>(client: SupabaseClient, expedienteId: string, folio: string, creado: T): Promise<T> {
  let actual = creado;
  for (let intento = 0; intento < 5; intento += 1) {
    const todos = await recibos(client, expedienteId);
    const propio = numero(actual);
    if (!todos.some(otro => otro.id !== actual.id && numero(otro) === propio && antes(otro, actual))) return actual;
    const data = { ...(actual.data ?? {}), numeroRecibo: siguienteRecibo(folio, todos.map(numero).filter(Boolean)) };
    const result = await client.from("fortius_inmuebles_formato_drafts").update({ data, version: actual.version + 1 }).eq("id", actual.id).eq("version", actual.version).select(COLUMNAS).maybeSingle();
    if (result.error) databaseError(result.error);
    // Alguien ya lo editó: se deja como está; su número lo resuelve quien lo editó.
    if (!result.data) return actual;
    actual = result.data as T;
  }
  return actual;
}
