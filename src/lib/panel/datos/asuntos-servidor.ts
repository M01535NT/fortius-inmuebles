import { anotarEnAsunto, pedir } from "@/lib/panel/datos/colecciones";
import type { Expediente } from "@/lib/panel/datos/asuntos";

/**
 * Lo del asunto que llega con PN-02 (título libre, tipo, personas con papel) y archivar.
 * Todo funciona antes y después de aplicar las migraciones de PN-02: si la base todavía no tiene la columna
 * o la tabla, el servidor responde `disponible: false` y la pantalla usa su respaldo, sin error.
 */

export * from "@/lib/panel/datos/asuntos-tipos";
import type { Papel, TipoAsunto } from "@/lib/panel/datos/asuntos-tipos";

export type ExtrasAsuntos = {
  disponible: boolean;
  extras: Record<string, { titulo: string | null; tipo_asunto: string | null }>;
  titulosNota: Record<string, string>;
  /** Asuntos cuyo `estado_asunto` no coincide con su etapa y flujo (por ejemplo, los de antes de aplicar PN-02). */
  desfasados: string[];
};

/** Título y tipo de cada asunto, para sumarlos a los expedientes. Si falla, la lista sigue con lo que tiene (null). */
export async function leerExtrasAsuntos(senal?: AbortSignal): Promise<ExtrasAsuntos | null> {
  try {
    const r = await fetch("/api/admin/expedientes/asuntos", { credentials: "same-origin", cache: "no-store", signal: senal });
    if (!r.ok) return null;
    const c = (await r.json()) as Partial<ExtrasAsuntos>;
    return { disponible: c.disponible === true, extras: c.extras ?? {}, titulosNota: c.titulosNota ?? {}, desfasados: c.desfasados ?? [] };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    return null;
  }
}

/** Suma el título y el tipo al expediente. Sin columna, toma la nota «Título: …» (respaldo de antes de PN-02). */
export function conExtras(e: Expediente, x: ExtrasAsuntos | null): Expediente {
  if (!x) return e;
  const propio = x.extras[e.id];
  return {
    ...e,
    titulo: e.titulo?.trim() || propio?.titulo?.trim() || x.titulosNota[e.id] || null,
    tipo_asunto: e.tipo_asunto ?? (propio?.tipo_asunto as TipoAsunto | null | undefined) ?? null,
  };
}

/**
 * Cambia el título o el tipo. Si la base no tiene las columnas: el título queda como nota «Título: …» (se lee de ahí)
 * y el tipo no se puede guardar todavía (`guardado: false`).
 */
export async function guardarAsunto(e: Pick<Expediente, "id" | "version">, cambio: { titulo?: string; tipo?: TipoAsunto }): Promise<{ guardado: boolean; expediente: Expediente | null; respaldo: boolean }> {
  // El servidor responde `disponible: false` si la base no conoce las columnas; entonces se usa el respaldo.
  const r = await cuerpoDe<{ disponible?: boolean; expediente?: Expediente | null }>(`/api/admin/expedientes/${encodeURIComponent(e.id)}/asunto`, "PATCH", { version: e.version, ...cambio }, true);
  if (r?.disponible && r.expediente) return { guardado: true, expediente: r.expediente, respaldo: false };
  if (cambio.titulo !== undefined) {
    await anotarEnAsunto(e.id, `Título: ${cambio.titulo.trim().slice(0, 160)}`);
    return { guardado: true, expediente: null, respaldo: true };
  }
  return { guardado: false, expediente: null, respaldo: false };
}

/** Pide y devuelve el cuerpo; con `sinRuta`, un 404 o 405 (ruta que aún no existe) se toma como «no disponible» (null). */
async function cuerpoDe<T>(url: string, method: string, body: unknown, sinRuta = false): Promise<T | null> {
  let r: Response;
  try {
    r = await fetch(url, { method, credentials: "same-origin", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("Sin conexión: no se guardó. Vuelve a intentarlo.");
  }
  if (sinRuta && (r.status === 404 || r.status === 405)) return null;
  const c = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "Tu sesión terminó o no tienes permiso para esto." : c.error || "No se guardó. Vuelve a intentarlo.");
  return c;
}

export type PersonaDelAsunto = { persona_id: string; papel: Papel; principal: boolean };

/** Personas con papel. `disponible: false` mientras la tabla no exista: se muestra solo a la persona principal. */
export async function leerPersonasDelAsunto(id: string, senal?: AbortSignal): Promise<{ disponible: boolean; personas: PersonaDelAsunto[] }> {
  const r = await fetch(`/api/admin/expedientes/${encodeURIComponent(id)}/personas`, { credentials: "same-origin", cache: "no-store", signal: senal });
  if (r.status === 404) return { disponible: false, personas: [] };
  const cuerpo = (await r.json().catch(() => ({}))) as { disponible?: boolean; personas?: PersonaDelAsunto[]; error?: string };
  if (!r.ok) throw new Error(cuerpo.error || "No se pudieron leer las personas del asunto.");
  return { disponible: cuerpo.disponible === true, personas: cuerpo.personas ?? [] };
}
export async function sumarPersona(id: string, personaId: string, papel: Papel): Promise<boolean> {
  const r = await cuerpoDe<{ disponible?: boolean }>(`/api/admin/expedientes/${encodeURIComponent(id)}/personas`, "POST", { personaId, papel }, true);
  return r?.disponible === true;
}
export async function quitarPersona(id: string, personaId: string, papel: Papel): Promise<void> {
  await cuerpoDe(`/api/admin/expedientes/${encodeURIComponent(id)}/personas`, "DELETE", { personaId, papel });
}

/**
 * Estado del asunto en sus columnas de PN-02 (`estado_asunto`: activo, en_espera o cerrado; `resultado`: se_logro o no_se_dio).
 * El estado se sigue guardando primero en la etapa y el flujo, como hoy (eso es lo que lee la pantalla); después el servidor
 * lo copia a las columnas leyendo la fila. Sin las columnas responde `disponible: false` y no pasa nada. Al aplicar PN-02,
 * la lista manda copiar los asuntos desfasados, así que ninguno se queda con el «activo» que pone la migración por defecto.
 */
export async function sincronizarEstados(ids: readonly string[]): Promise<boolean> {
  if (!ids.length) return false;
  const r = await cuerpoDe<{ disponible?: boolean }>("/api/admin/expedientes/asuntos", "POST", { ids: ids.slice(0, 500) }, true);
  return r?.disponible === true;
}

export type InmuebleDelAsunto = { inmueble_id: string; relacion: string; created_at: string };

/** Otros inmuebles ligados (PN-02). `disponible: false` mientras la tabla no exista: se ve solo el inmueble principal. */
export async function leerInmueblesDelAsunto(id: string, senal?: AbortSignal): Promise<{ disponible: boolean; inmuebles: InmuebleDelAsunto[] }> {
  const r = await fetch(`/api/admin/expedientes/${encodeURIComponent(id)}/inmuebles`, { credentials: "same-origin", cache: "no-store", signal: senal });
  if (r.status === 404) return { disponible: false, inmuebles: [] };
  const cuerpo = (await r.json().catch(() => ({}))) as { disponible?: boolean; inmuebles?: InmuebleDelAsunto[]; error?: string };
  if (!r.ok) throw new Error(cuerpo.error || "No se pudieron leer los inmuebles del asunto.");
  return { disponible: cuerpo.disponible === true, inmuebles: cuerpo.inmuebles ?? [] };
}
export async function ligarInmueble(id: string, slug: string): Promise<boolean> {
  const r = await cuerpoDe<{ disponible?: boolean }>(`/api/admin/expedientes/${encodeURIComponent(id)}/inmuebles`, "POST", { inmuebleId: slug }, true);
  return r?.disponible === true;
}
export async function desligarInmueble(id: string, slug: string): Promise<void> {
  await cuerpoDe(`/api/admin/expedientes/${encodeURIComponent(id)}/inmuebles`, "DELETE", { inmuebleId: slug });
}

/**
 * Archivar: la eliminación recuperable que ya existe (`deleted_at`, migración 20261005052643): el asunto sale de la lista,
 * conserva folio, documentos e historial, y se recupera con Deshacer o desde la papelera de expedientes.
 */
export function archivarAsunto(e: Pick<Expediente, "id" | "version">): Promise<Expediente> {
  return pedir<Expediente>(`/api/admin/expedientes/${encodeURIComponent(e.id)}`, { method: "DELETE", body: JSON.stringify({ version: e.version }) }, "expediente");
}
export function recuperarAsunto(e: Pick<Expediente, "id" | "version">): Promise<Expediente> {
  return pedir<Expediente>(`/api/admin/expedientes/${encodeURIComponent(e.id)}`, { method: "PATCH", body: JSON.stringify({ version: e.version }) }, "expediente");
}
