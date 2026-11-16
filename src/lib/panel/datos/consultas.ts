import { LEAD_CANAL_LABELS, leadCanal, type Lead } from "@/lib/domain/records";
import { normalizar } from "@/lib/panel/buscar";
import { aTexto, diaLargo } from "@/lib/panel/calendario";

/**
 * Consultas (PN-05, primer corte de solo lectura). Reglas de DECISIONES.md «Consultas»:
 * tres pestañas; en Por atender la que más espera va primero; pasada una hora, ámbar; pasadas dos, rojo.
 */

export type Pestana = "por_atender" | "seguimiento" | "cerradas";
export type Urgencia = "normal" | "aviso" | "error";

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

export function pestanaDe(l: Pick<Lead, "estado">): Pestana {
  if (l.estado === "nuevo") return "por_atender";
  if (l.estado === "cerrado" || l.estado === "descartado") return "cerradas";
  return "seguimiento";
}

/** Desde cuándo espera: si regresó estando descartada, cuenta desde que volvió. */
export const esperaDesde = (l: Pick<Lead, "creadoEl" | "reabiertoEl">) => l.reabiertoEl ?? l.creadoEl;

export function urgencia(msEsperando: number): Urgencia {
  if (msEsperando >= 2 * HORA) return "error";
  if (msEsperando >= HORA) return "aviso";
  return "normal";
}

export function tiempo(ms: number): string {
  if (ms < MINUTO) return "menos de un minuto";
  if (ms < HORA) { const m = Math.floor(ms / MINUTO); return `${m} ${m === 1 ? "minuto" : "minutos"}`; }
  if (ms < DIA) { const h = Math.floor(ms / HORA); return `${h} ${h === 1 ? "hora" : "horas"}`; }
  const d = Math.floor(ms / DIA);
  return `${d} ${d === 1 ? "día" : "días"}`;
}

export type FilaConsulta = {
  id: string; nombre: string; pestana: Pestana; canal: string; inmueble?: string; mensaje?: string;
  telefono: string; email?: string; esperaMs: number; urgencia: Urgencia; detalle: string; ligadaAPersona: boolean;
  /** Fecha acordada para volver a contactar (AAAA-MM-DD), si la hay. Ordena «En seguimiento» (AUD-03, C2). */
  proximo?: string;
};

export function filaConsulta(l: Lead, ahora: number, tituloInmueble: (slug: string) => string | undefined): FilaConsulta {
  const pestana = pestanaDe(l);
  const desde = Date.parse(esperaDesde(l));
  const esperaMs = Number.isNaN(desde) ? 0 : Math.max(0, ahora - desde);
  const canal = leadCanal(l);
  const inmueble = l.propiedadSlug ? (tituloInmueble(l.propiedadSlug) ?? undefined) : undefined;
  const proximo = pestana === "seguimiento" ? l.perfil?.proximoContacto : undefined;
  const hoy = aTexto(new Date(ahora));
  const accion = l.perfil?.proximaAccion?.trim();
  let urg: Urgencia = pestana === "por_atender" ? urgencia(esperaMs) : "normal";
  let detalle: string;
  if (pestana === "por_atender") detalle = `Espera hace ${tiempo(esperaMs)}`;
  else if (pestana === "seguimiento") {
    if (proximo && proximo < hoy) { detalle = `Tocaba contactar el ${diaLargo(proximo)}`; urg = "error"; }
    else if (proximo === hoy) { detalle = "Contactar hoy"; urg = "aviso"; }
    else if (proximo) detalle = `Contactar el ${diaLargo(proximo)}`;
    else detalle = `Llegó hace ${tiempo(esperaMs)} · sin fecha para volver a contactar`;
    if (proximo && accion) detalle += ` · ${accion}`;
  }
  // Cerradas (AUD-03, C3): se distingue si terminó en cliente, sin operación o no era cliente.
  else detalle = l.estado === "descartado" ? "No es cliente" : l.clienteId ? "Ya es cliente" : "Sin operación";
  return {
    id: l.id,
    nombre: l.nombre?.trim() || "Sin nombre",
    pestana,
    canal: canal === "sin-dato" ? "" : LEAD_CANAL_LABELS[canal],
    inmueble,
    mensaje: l.mensaje?.trim() || undefined,
    telefono: l.telefono ?? "",
    email: l.email,
    esperaMs,
    urgencia: urg,
    detalle,
    ligadaAPersona: Boolean(l.clienteId),
    proximo,
  };
}

/**
 * Por atender: la que más espera primero. En seguimiento: por la fecha acordada para volver a contactar
 * (la más atrasada primero) y al final las que no tienen fecha. Cerradas: la más reciente primero.
 */
export function ordenar(filas: readonly FilaConsulta[], pestana: Pestana): FilaConsulta[] {
  const lista = filas.filter((f) => f.pestana === pestana);
  if (pestana === "por_atender") return lista.sort((a, b) => b.esperaMs - a.esperaMs);
  if (pestana === "seguimiento") {
    return lista.sort((a, b) => (a.proximo && b.proximo ? a.proximo.localeCompare(b.proximo) : a.proximo ? -1 : b.proximo ? 1 : a.esperaMs - b.esperaMs));
  }
  return lista.sort((a, b) => a.esperaMs - b.esperaMs);
}

export function filtrarConsultas(filas: readonly FilaConsulta[], consulta: string): FilaConsulta[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [...filas];
  return filas.filter((f) => {
    const pajar = normalizar(`${f.nombre} ${f.telefono} ${f.email ?? ""} ${f.canal} ${f.inmueble ?? ""} ${f.mensaje ?? ""}`);
    return palabras.every((p) => pajar.includes(p));
  });
}

/** Respuesta lista para que el asesor la envíe él mismo (el panel no manda nada solo). */
export function respuestaSugerida(f: Pick<FilaConsulta, "nombre" | "inmueble">): string {
  const primerNombre = f.nombre === "Sin nombre" ? "" : ` ${f.nombre.split(/\s+/)[0]}`;
  const sobre = f.inmueble ? ` por ${f.inmueble}` : "";
  return `Hola${primerNombre}, gracias por escribir a Fortius Inmuebles${sobre}. ¿A qué hora te puedo llamar para platicar lo que buscas?`;
}

/** Enlace de WhatsApp con el texto ya escrito. Solo dígitos; los números de 10 dígitos se toman como de México. */
export function enlaceWhatsApp(telefono: string, texto: string): string | null {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const numero = digitos.length === 10 ? `52${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/** Separa las consultas por atender en las de las últimas 24 horas y las que llevan días; cada grupo conserva su orden. */
export function partirPorAntiguedad(filas: readonly FilaConsulta[]): { recientes: FilaConsulta[]; viejas: FilaConsulta[] } {
  return { recientes: filas.filter((f) => f.esperaMs < DIA), viejas: filas.filter((f) => f.esperaMs >= DIA) };
}
