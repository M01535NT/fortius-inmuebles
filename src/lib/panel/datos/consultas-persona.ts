import type { Cliente } from "@/lib/backend/contracts";
import type { Lead } from "@/lib/domain/records";
import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import { claveTelefono } from "@/lib/panel/datos/personas-acciones";

/**
 * La consulta frente a Personas (PN-05). Funciones puras para buscar a quien pueda ser la misma persona
 * y saber si conviene avisar antes de crear otra ficha. Avisan; nunca frenan.
 */

export type Coincidencia = { persona: Cliente; por: "telefono" | "correo" | "nombre" };
export const MOTIVO_COINCIDENCIA: Record<Coincidencia["por"], string> = {
  telefono: "Mismo teléfono",
  correo: "Mismo correo",
  nombre: "Nombre parecido",
};

/** Sin acentos, minúsculas y un solo espacio: «José  PÉREZ» y «jose perez» comparan igual. */
export const normalizar = (t: string | undefined) =>
  (t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const palabras = (t: string | undefined) => normalizar(t).split(" ").filter((p) => p.length >= 2);

/** Todas las palabras de `buscadas` aparecen al inicio de alguna palabra del nombre. */
function nombreCoincide(nombre: string | undefined, buscadas: string[]): boolean {
  if (!buscadas.length) return false;
  const delNombre = palabras(nombre);
  return buscadas.every((b) => delNombre.some((p) => p.startsWith(b)));
}

/**
 * Personas que pueden ser quien escribió: primero por teléfono, luego por correo y al final por nombre
 * (para el nombre se piden al menos dos palabras, con una sola salen demasiadas). Como máximo `limite`.
 */
export function coincidenciasDeConsulta(l: Pick<Lead, "nombre" | "telefono" | "email">, personas: readonly Cliente[], limite = 5): Coincidencia[] {
  const tel = claveTelefono(l.telefono);
  const correo = normalizar(l.email);
  const nombre = palabras(l.nombre);
  const vistos = new Set<string>();
  const salida: Coincidencia[] = [];
  const agregar = (por: Coincidencia["por"], cumple: (p: Cliente) => boolean) => {
    for (const p of personas) {
      if (salida.length >= limite) return;
      if (vistos.has(p.id) || !cumple(p)) continue;
      vistos.add(p.id);
      salida.push({ persona: p, por });
    }
  };
  if (tel.length === 10) agregar("telefono", (p) => claveTelefono(p.telefono) === tel);
  if (correo) agregar("correo", (p) => normalizar(p.email) === correo);
  if (nombre.length >= 2) agregar("nombre", (p) => nombreCoincide(p.nombre, nombre));
  return salida;
}

/**
 * Buscar a mano en Personas por teléfono, correo o nombre (desde 3 caracteres). Los dígitos buscan
 * dentro del teléfono; lo demás, en el correo o al inicio de las palabras del nombre.
 */
export function buscarPersonas(texto: string, personas: readonly Cliente[], limite = 6): Cliente[] {
  const t = normalizar(texto);
  if (t.length < 3) return [];
  const digitos = t.replace(/\D/g, "");
  const soloNumero = /^[\d\s()+-]+$/.test(t);
  const buscadas = palabras(t);
  const salida: Cliente[] = [];
  for (const p of personas) {
    if (salida.length >= limite) break;
    const porTelefono = soloNumero && digitos.length >= 3 && (p.telefono ?? "").replace(/\D/g, "").includes(digitos);
    const porCorreo = !soloNumero && t.includes("@") ? normalizar(p.email).includes(t) : !soloNumero && normalizar(p.email).startsWith(t);
    const porNombre = !soloNumero && nombreCoincide(p.nombre, buscadas);
    if (porTelefono || porCorreo || porNombre) salida.push(p);
  }
  return salida;
}

/** Tipo de asunto que conviene según lo que pidió en la consulta; se puede cambiar antes de abrirlo. */
export function operacionDeConsulta(l: Pick<Lead, "perfil">): "venta" | "renta" | "inversion" | "otra" {
  const o = l.perfil?.operacion;
  if (o === "comprar" || o === "vender") return "venta";
  if (o === "rentar" || o === "arrendar") return "renta";
  if (o === "invertir") return "inversion";
  return "otra";
}

/** Hay alguien con su mismo teléfono o correo: conviene avisar antes de crear otra ficha (no frena). */
export const hayDuplicadoFuerte = (c: readonly Coincidencia[]) => c.some((x) => x.por !== "nombre");

/**
 * Deshacer «Abrir asunto»: lo manda a eliminados (recuperable; el folio no se reutiliza). Usa la versión que devolvió la base.
 */
export async function quitarAsunto(id: string, version: number): Promise<void> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/expedientes/${encodeURIComponent(id)}`, {
      method: "DELETE", credentials: "same-origin", cache: "no-store",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ version }),
    });
  } catch {
    throw new ErrorDeLectura("Sin conexión: no se deshizo. Vuelve a intentarlo.", 0);
  }
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string };
    throw new ErrorDeLectura(respuesta.status === 409 ? "El asunto ya cambió; quítalo desde Asuntos." : cuerpo.error || "No se deshizo. Vuelve a intentarlo.", respuesta.status);
  }
}

/**
 * «Unir con su ficha»: liga la consulta a una persona que ya está en Personas, sin crear otra.
 * Necesita la ruta `POST /api/admin/leads/[id]/unir` y su función de la base (migración pendiente del visto bueno
 * del titular; ver PLAN, PN-05). Mientras no exista, el servidor contesta 404 o 405 y se devuelve `pendiente`
 * para que la pantalla lo diga con calma, sin error. Usa la versión que se leyó (409 si cambió).
 */
export type ResultadoUnir = { estado: "unida"; clienteId: string } | { estado: "pendiente" };

export async function unirConsulta(id: string, clienteId: string, version: number): Promise<ResultadoUnir> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`/api/admin/leads/${encodeURIComponent(id)}/unir`, {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ clienteId, version }),
    });
  } catch {
    throw new ErrorDeLectura("Sin conexión: no se unió. Vuelve a intentarlo.", 0);
  }
  if (respuesta.status === 404 || respuesta.status === 405 || respuesta.status === 501) return { estado: "pendiente" };
  const cuerpo = (await respuesta.json().catch(() => ({}))) as { id?: string; cliente?: { id?: string }; error?: string };
  if (!respuesta.ok) {
    const texto = respuesta.status === 409 ? "La consulta cambió mientras la veías; se muestra lo último. Vuelve a intentarlo."
      : respuesta.status === 401 || respuesta.status === 403 ? "Tu sesión terminó o no tienes permiso para esto."
      : cuerpo.error || "No se unió. Vuelve a intentarlo.";
    throw new ErrorDeLectura(texto, respuesta.status);
  }
  return { estado: "unida", clienteId: cuerpo.cliente?.id ?? cuerpo.id ?? clienteId };
}

/** Texto para cuando el servidor todavía no sabe unir. No es un error: falta un paso que aprueba el titular. */
export const UNIR_PENDIENTE = "Unir con una ficha que ya existe todavía no está activo. Mientras, abre su ficha y anota ahí esta consulta para no duplicarla.";
