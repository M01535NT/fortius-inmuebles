/**
 * Lectura de las colecciones que el servidor ya expone (`/api/admin/collections/<nombre>`), sin pasar por el panel viejo.
 * Es API compartida, no legado. El servidor decide qué ve cada quien según su rol (RLS); aquí solo se lee.
 * Las escrituras llegan con el modelo base (PN-02) y cada pantalla (PN-03 en adelante).
 */

export class ErrorDeLectura extends Error {
  constructor(message: string, public estado: number) { super(message); }
}

export type Registro<T> = { id: string; data: T; version: number };
export type NombreColeccion = "clientes" | "propiedades" | "leads" | "eventos" | "asesores" | "tareas" | "tramites" | "archivos" | "posts" | "contenido";

export async function leerColeccion<T>(nombre: NombreColeccion, senal?: AbortSignal): Promise<T[]> {
  return (await leerRegistros<T>(nombre, senal)).map((r) => r.data);
}

/**
 * Guarda un registro con control de versión: `version` es la que se leyó (null para uno nuevo).
 * Si alguien guardó antes, el servidor responde 409 y aquí se avisa en palabras del asesor.
 */
export async function guardarRegistro<T>(nombre: NombreColeccion, id: string, data: T, version: number | null): Promise<Registro<T> & { avisos?: string[] }> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/collections/${nombre}/${encodeURIComponent(id)}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data, version }),
    });
  } catch {
    throw new ErrorDeLectura("Sin conexión: no se guardó. Vuelve a intentarlo.", 0);
  }
  // Al publicar un inmueble, el servidor devuelve lo que falta como avisos (DEC-61: ya no frena).
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { record?: Registro<T>; avisos?: string[]; error?: string };
  if (!respuesta.ok || !cuerpo.record) {
    const texto = respuesta.status === 409 ? "Alguien más cambió esto mientras lo tenías abierto. Ya se muestra lo último; vuelve a intentarlo."
      : respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes permiso para esto."
      : cuerpo.error || "No se guardó. Vuelve a intentarlo.";
    throw new ErrorDeLectura(texto, respuesta.status);
  }
  return Array.isArray(cuerpo.avisos) && cuerpo.avisos.length ? { ...cuerpo.record, avisos: cuerpo.avisos } : cuerpo.record;
}

/** Ficha de asesor de quien está en sesión (null para dirección sin ficha). */
export async function leerMiAsesor(senal?: AbortSignal): Promise<string | null> {
  try {
    const r = await fetch("/api/admin/mi-asesor", { credentials: "same-origin", cache: "no-store", signal: senal });
    if (!r.ok) return null;
    return ((await r.json()) as { asesorId?: string | null }).asesorId ?? null;
  } catch {
    return null;
  }
}

export async function leerRegistros<T>(nombre: NombreColeccion, senal?: AbortSignal): Promise<Registro<T>[]> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/collections/${nombre}`, { credentials: "same-origin", cache: "no-store", signal: senal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión: no se pudo cargar. Vuelve a intentarlo.", 0);
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { records?: Registro<T>[]; error?: string };
  if (!respuesta.ok) {
    throw new ErrorDeLectura(
      respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes acceso a esto." : "No se pudo cargar la lista. Vuelve a intentarlo.",
      respuesta.status,
    );
  }
  return cuerpo.records ?? [];
}

/** Fechas de los contratos de intermediación (09 y 21) para los avisos de Hoy. Solo fechas, nunca el documento. */
export async function leerVencimientos<T>(senal?: AbortSignal): Promise<T[]> {
  let respuesta: Response;
  try {
    respuesta = await fetch("/api/admin/vencimientos", { credentials: "same-origin", cache: "no-store", signal: senal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión: no se pudo cargar. Vuelve a intentarlo.", 0);
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { contratos?: T[] };
  if (!respuesta.ok) throw new ErrorDeLectura("No se pudieron cargar los vencimientos.", respuesta.status);
  return cuerpo.contratos ?? [];
}

/** Lo que el servidor exige antes de publicar un inmueble (la captación vinculada y sus revisiones, COR-16). */
export async function leerRequisitosPublicacion(slug: string, senal?: AbortSignal): Promise<{ permitida: boolean; faltantes: string[] }> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/propiedades/${encodeURIComponent(slug)}/publicacion`, { credentials: "same-origin", cache: "no-store", signal: senal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión: no se pudo revisar si se puede publicar.", 0);
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { permitida?: boolean; faltantes?: string[] };
  if (!respuesta.ok) throw new ErrorDeLectura("No se pudo revisar si se puede publicar.", respuesta.status);
  return { permitida: cuerpo.permitida === true, faltantes: cuerpo.faltantes ?? [] };
}

/** Expedientes que la sesión puede ver (la base decide por RLS). Son los asuntos hasta que lleguen las columnas de PN-02. */
export async function leerExpedientes<T>(senal?: AbortSignal): Promise<T[]> {
  let respuesta: Response;
  try {
    respuesta = await fetch("/api/admin/expedientes", { credentials: "same-origin", cache: "no-store", signal: senal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión: no se pudo cargar. Vuelve a intentarlo.", 0);
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { expedientes?: T[] };
  if (!respuesta.ok) throw new ErrorDeLectura(respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes acceso a esto." : "No se pudieron cargar los asuntos. Vuelve a intentarlo.", respuesta.status);
  return cuerpo.expedientes ?? [];
}

/** Abre un asunto con la ruta que ya existe (`POST /api/admin/expedientes`). Hasta PN-02 la persona es obligatoria. */
export async function crearExpediente<T>(d: { clienteId: string; asesorId: string; operacion: string; propiedadSlug?: string }): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch("/api/admin/expedientes", {
      method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
      body: JSON.stringify({ clienteId: d.clienteId, asesorId: d.asesorId, operacion: d.operacion, ...(d.propiedadSlug ? { propiedadSlug: d.propiedadSlug } : {}) }),
    });
  } catch {
    throw new ErrorDeLectura("Sin conexión: no se guardó. Vuelve a intentarlo.", 0);
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { expediente?: T; error?: string };
  if (!respuesta.ok || !cuerpo.expediente) {
    throw new ErrorDeLectura(respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes permiso para esto." : cuerpo.error || "No se guardó. Vuelve a intentarlo.", respuesta.status);
  }
  return cuerpo.expediente;
}

export async function pedir<T>(url: string, init: RequestInit, clave: string): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { credentials: "same-origin", cache: "no-store", ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ErrorDeLectura("Sin conexión. Vuelve a intentarlo.", 0);
  }
  const cuerpo = (await respuesta.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!respuesta.ok || !(clave in cuerpo)) {
    throw new ErrorDeLectura(respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes permiso para esto." : (typeof cuerpo.error === "string" && cuerpo.error) || "No se pudo completar. Vuelve a intentarlo.", respuesta.status);
  }
  return cuerpo[clave] as T;
}

/** Cambia estado o documentos del asunto con la ruta de operación que ya existe; un 409 trae el freno del servidor. */
export function guardarOperacion<T>(id: string, cambio: unknown): Promise<T> {
  return pedir<T>(`/api/admin/expedientes/${encodeURIComponent(id)}/operacion`, { method: "PUT", body: JSON.stringify(cambio) }, "expediente");
}
export function leerActividad<T>(id: string, senal?: AbortSignal): Promise<T[]> {
  return pedir<T[]>(`/api/admin/expedientes/${encodeURIComponent(id)}/actividad`, { method: "GET", signal: senal }, "actividad");
}
export function anotarEnAsunto<T>(id: string, descripcion: string): Promise<T> {
  return pedir<T>(`/api/admin/expedientes/${encodeURIComponent(id)}/actividad`, { method: "POST", body: JSON.stringify({ descripcion }) }, "actividad");
}

/** Quita un registro (queda en el historial y se puede recuperar). Pide la versión que se leyó; 409 si cambió. */
export async function borrarRegistro(nombre: NombreColeccion, id: string, version: number | null): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/collections/${nombre}/${encodeURIComponent(id)}`, {
      method: "DELETE", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ version }),
    });
  } catch {
    throw new ErrorDeLectura("Sin conexión: no se quitó. Vuelve a intentarlo.", 0);
  }
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
    throw new ErrorDeLectura(respuesta.status === 409 ? "Alguien más cambió esto mientras lo tenías abierto. Ya se muestra lo último; vuelve a intentarlo."
      : respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes permiso para esto." : cuerpo.error || "No se quitó. Vuelve a intentarlo.", respuesta.status);
  }
}

/**
 * Convierte la consulta en persona con la conversión verificada de la base (`POST /api/admin/leads/{id}/convertir`):
 * crea la ficha en Personas y deja el vínculo inmutable. Si ya se había convertido, devuelve la misma persona.
 */
export async function convertirConsulta(id: string, version: number): Promise<{ clienteId: string }> {
  const r = await pedir<{ id: string }>(`/api/admin/leads/${encodeURIComponent(id)}/convertir`, { method: "POST", body: JSON.stringify({ version }) }, "cliente");
  return { clienteId: r.id };
}

/** El director pasa un asunto a otro asesor (M-04): la base mueve con él el inmueble, la persona y las tareas abiertas, y anota el motivo. */
export function reasignarAsunto(id: string, asesorId: string, motivo: string): Promise<string[]> {
  return pedir<string[]>(`/api/admin/expedientes/${encodeURIComponent(id)}/reasignar`, { method: "POST", body: JSON.stringify({ asesorId, motivo }) }, "movidas");
}
