import type { Evento } from "@/lib/domain/records";
import { normalizar } from "@/lib/panel/buscar";
import { diaLargo } from "@/lib/panel/calendario";
import type { Task } from "@/lib/tasks";
import { ACREEDORES, esHipoteca, type CualquierTramite, type Tramite, type TramiteNota } from "@/lib/tramites";

import { vistaTramite } from "./tramites-guias";

/**
 * Trámites (PN-07, boceto «Trámites», rehecho el 15/11/2026): una lista por lo que toca y un checklist.
 * Usa el trámite que ya existe (TRA-01, cancelación de hipoteca). Sin frenos (DEC-61): al cerrar un paso con pendientes o sin
 * su documento, se avisa y se cierra igual. Funciones puras.
 */

export type GrupoTramite = "hoy" | "esperando" | "en_curso" | "listo";
export const NOMBRE_GRUPO: Record<GrupoTramite, string> = { hoy: "Hoy toca preguntar", esperando: "Esperando", en_curso: "En curso", listo: "Listos" };

export type FilaTramite = {
  id: string; titulo: string; grupo: GrupoTramite; linea: string; estado: string; persona: PersonaDeTramite | null;
  pasoNombre: string; numeroPaso: number;
  /** Tipo de trámite (boceto: «Cancelación de hipoteca», «Avalúo»…), su categoría para el filtro y dónde está ahora. */
  tipoNombre: string; categoria: string; dondeEsta: string;
};

const dias = (desde: string, hasta: string) => {
  const [a, b] = [desde, hasta].map((t) => { const [y, m, d] = t.split("-").map(Number); return Date.UTC(y, m - 1, d); });
  return Math.round((b - a) / 86_400_000);
};

export function grupoDe(t: Pick<Tramite, "estado" | "espera">, hoy: string): GrupoTramite {
  if (t.estado !== "en_curso") return "listo";
  if (t.espera) return t.espera.volver <= hoy ? "hoy" : "esperando";
  return "en_curso";
}

/** Con quién va el trámite: una ficha del Directorio o, en los trámites de antes, un cliente del panel provisional. */
export type PersonaDeTramite = { id: string; nombre: string };

/** La persona del trámite: primero la del Directorio (`personaId`); si no tiene, el cliente de antes (`clienteId`). */
export function personaDeTramite<P extends PersonaDeTramite>(t: Pick<CualquierTramite, "personaId" | "clienteId">, personas: readonly P[]): P | null {
  const id = t.personaId || t.clienteId;
  return id ? personas.find((p) => p.id === id) ?? null : null;
}

export function filaTramite(t: CualquierTramite, personas: readonly PersonaDeTramite[], hoy: string): FilaTramite {
  const persona = personaDeTramite(t, personas);
  const v = vistaTramite(t);
  const grupo = grupoDe(t, hoy);
  let estado: string;
  if (t.estado === "cancelado") estado = "Cancelado";
  else if (grupo === "listo") estado = "Terminado";
  else if (t.espera && grupo === "hoy") estado = `Preguntar a ${t.espera.quien}${t.espera.volver < hoy ? ` (desde el ${diaLargo(t.espera.volver)})` : ""}`;
  else if (t.espera) { const n = dias(hoy, t.espera.volver); estado = `Espera a ${t.espera.quien} · ${n === 1 ? "falta 1 día" : `faltan ${n} días`}`; }
  else estado = v.modo === "ruta" ? `Paso ${t.pasoActual + 1} de ${v.total}: ${v.pasoActualNombre}` : v.pasoActualNombre;
  return {
    id: t.id, titulo: t.titulo, grupo, estado, persona, pasoNombre: v.pasoActualNombre, numeroPaso: t.pasoActual + 1,
    tipoNombre: v.nombreTipo, categoria: v.guia.categoria, dondeEsta: v.dondeEsta,
    linea: [v.nombreTipo, esHipoteca(t) ? ACREEDORES[t.acreedor] : "", persona?.nombre].filter(Boolean).join(" · "),
  };
}

/** Hoy primero, luego esperando (lo que vuelve antes), en curso y listos al final. */
export function ordenarTramites(filas: FilaTramite[], tramites: readonly CualquierTramite[]): FilaTramite[] {
  const peso: Record<GrupoTramite, number> = { hoy: 0, esperando: 1, en_curso: 2, listo: 3 };
  const volver = new Map(tramites.map((t) => [t.id, t.espera?.volver ?? "9999"]));
  return [...filas].sort((a, b) => peso[a.grupo] - peso[b.grupo] || (volver.get(a.id) ?? "").localeCompare(volver.get(b.id) ?? "") || a.titulo.localeCompare(b.titulo, "es"));
}

export function filtrarTramites(filas: readonly FilaTramite[], consulta: string): FilaTramite[] {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  return filas.filter((f) => palabras.every((p) => normalizar(`${f.titulo} ${f.linea}`).includes(p)));
}

// El historial (pasos cerrados, esperas, respuestas) lo escribe la base; aquí solo se agregan notas. La base sella autor y fecha.
const ahoraISO = (ahora: Date) => ahora.toISOString();
const nota = (texto: string, ahora: Date): TramiteNota => ({ id: `n-${ahora.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`, tipo: "nota", texto: texto.trim().slice(0, 5000) });

/** Marca o desmarca un pendiente del paso actual. */
export function alternarPendiente<T extends CualquierTramite>(t: T, pendienteId: string): T {
  return { ...t, pasos: t.pasos.map((p, i) => (i !== t.pasoActual ? p : { ...p, pendientes: p.pendientes.map((x) => (x.id === pendienteId ? { ...x, hecho: !x.hecho } : x)) })) } as T;
}

/**
 * Pendientes que piden una fecha (por ahora «Fecha del último pago»): se capturan con un campo de fecha, no con una casilla.
 * La fecha se guarda en el mismo pendiente («Fecha del último pago: 2026-11-10») y lo marca hecho; sin fecha queda por hacer.
 * Así no cambia la forma del trámite que revisa la base.
 */
const PENDIENTES_CON_FECHA = ["Fecha del último pago"] as const;
const baseFecha = (texto: string) => PENDIENTES_CON_FECHA.find((p) => texto === p || texto.startsWith(`${p}: `));
export const esPendienteFecha = (texto: string) => baseFecha(texto) !== undefined;
export function fechaDePendiente(texto: string): string {
  const base = baseFecha(texto);
  const resto = base ? texto.slice(base.length + 2) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(resto) ? resto : "";
}
export function fecharPendiente<T extends CualquierTramite>(t: T, pendienteId: string, fecha: string): T {
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : "";
  return { ...t, pasos: t.pasos.map((p, i) => (i !== t.pasoActual ? p : { ...p, pendientes: p.pendientes.map((x) => {
    const base = x.id === pendienteId ? baseFecha(x.texto) : undefined;
    return base ? { ...x, texto: valida ? `${base}: ${valida}` : base, hecho: Boolean(valida) } : x;
  }) })) } as T;
}

/**
 * Cierra el paso actual. Sin frenos (DEC-61): si faltan pendientes o el documento, se avisa (`avisoAlCerrar`) y se cierra igual.
 * Solo no cierra un trámite que ya no está en curso.
 */
export function cerrarPaso<T extends CualquierTramite>(t: T, _documentos: readonly { pasoClave?: string }[] = [], ahora = new Date()): T | null {
  const total = t.pasos.length;
  if (t.estado !== "en_curso" || t.pasoActual >= total) return null;
  const siguiente = t.pasoActual + 1;
  return { ...t, pasoActual: siguiente, espera: null, estado: siguiente >= total ? "terminado" : "en_curso", actualizadoEl: ahoraISO(ahora) };
}

/** «Reabrir este paso»: solo el último cerrado (la base mueve los pasos de uno en uno) y lo anota en el historial. */
export function reabrirPaso<T extends CualquierTramite>(t: T, ahora = new Date()): T | null {
  if (t.estado === "cancelado" || t.pasoActual <= 0) return null;
  return { ...t, pasoActual: t.pasoActual - 1, estado: "en_curso", actualizadoEl: ahoraISO(ahora) };
}

/** Lo que falta para cerrar el paso actual: pendientes sin marcar y, si el paso lo pide, su documento. */
export function faltanDelPaso(t: CualquierTramite, documentos: readonly { pasoClave?: string }[]): string[] {
  const paso = t.pasos[t.pasoActual];
  if (!paso) return [];
  const faltan = paso.pendientes.filter((p) => !p.hecho).map((p) => p.texto);
  // En la hipoteca, solo los pasos con documento obligatorio (TRA-01); en las guías, el documento es sugerido y no se cuenta.
  const doc = esHipoteca(t) ? vistaTramite(t).pasos[t.pasoActual]?.documento : "";
  if (doc && !documentos.some((d) => d.pasoClave === paso.clave)) faltan.push(`Subir: ${doc}`);
  return faltan;
}

/** Lo que falta en el paso actual, dicho como aviso al cerrarlo («Paso cerrado con 2 pendientes sin marcar»). Vacío si no falta nada. */
export function avisoAlCerrar(t: CualquierTramite, documentos: readonly { pasoClave?: string }[]): string {
  const faltan = faltanDelPaso(t, documentos);
  if (!faltan.length) return "";
  return faltan.length === 1 ? `Quedó sin hacer: ${faltan[0]}` : `Quedaron ${faltan.length} cosas sin hacer`;
}

/** «Quitar la espera»: sin respuesta que anotar; el trámite vuelve a «En curso». */
export function quitarEspera<T extends CualquierTramite>(t: T, ahora = new Date()): T {
  return { ...t, espera: null, actualizadoEl: ahoraISO(ahora) };
}

/**
 * «Tarea» del trámite (boceto): una tarea con fecha que aparece en Hoy y, si se pide con hora, también una cita en la Agenda.
 * Las dos llevan el trámite, la persona y el inmueble.
 */
export function tareaDeTramite(t: CualquierTramite, d: { texto: string; vence: string; hora: string | null }, ahora = new Date()): { tarea: Task; cita: Evento | null } {
  const titulo = d.texto.trim().slice(0, 160);
  const comun = { ...(t.clienteId ? { clienteId: t.clienteId } : {}), asesorId: t.asesorId, tramiteId: t.id, ...(t.propiedadSlug ? { propiedadSlug: t.propiedadSlug } : {}) };
  const tarea: Task = {
    id: `tarea-${crypto.randomUUID()}`, titulo, descripcion: `Trámite: ${t.titulo}`, categoria: "documentacion", estado: "pendiente", prioridad: "normal",
    vence: d.vence, pasos: [], creadoEl: ahora.toISOString(), ...comun,
  };
  const cita: Evento | null = d.hora
    ? { id: crypto.randomUUID(), titulo, fecha: d.vence, hora: d.hora, tipo: "otro", ...comun, ...(t.personaId ? { personaId: t.personaId } : {}) }
    : null;
  return { tarea, cita };
}

/** Tareas de un trámite que siguen abiertas, la más próxima primero. */
export function tareasDeTramite(tareas: readonly Task[], tramiteId: string): Task[] {
  return tareas.filter((x) => x.tramiteId === tramiteId && x.estado !== "cancelada")
    .sort((a, b) => Number(a.estado === "completada") - Number(b.estado === "completada") || (a.vence || "9999").localeCompare(b.vence || "9999"));
}

/** Filtros de la lista (boceto «Filtrar»): por tipo de trámite y por dónde está. Vacíos, no filtran. */
export function filtrarPorTramite(filas: readonly FilaTramite[], f: { tipos: ReadonlySet<string>; donde: ReadonlySet<string> }): FilaTramite[] {
  return filas.filter((x) => (!f.tipos.size || f.tipos.has(x.categoria)) && (!f.donde.size || f.donde.has(x.dondeEsta)));
}

export function ponerEnEspera<T extends CualquierTramite>(t: T, quien: string, volver: string, hoy: string, ahora = new Date()): T {
  const q = quien.trim().slice(0, 120);
  return { ...t, espera: { quien: q, desde: hoy, volver }, actualizadoEl: ahoraISO(ahora) };
}

/** «Ya respondieron»: quita la espera (la base lo anota en el historial) y guarda la respuesta como nota si se escribió. */
export function yaRespondieron<T extends CualquierTramite>(t: T, respuesta: string, ahora = new Date()): T {
  const r = respuesta.trim();
  return { ...t, espera: null, actualizadoEl: ahoraISO(ahora), notas: r ? [...t.notas, nota(`Respondió ${t.espera?.quien ?? ""}: ${r}`, ahora)] : t.notas };
}

export function anotarTramite<T extends CualquierTramite>(t: T, texto: string, ahora = new Date()): T {
  return { ...t, actualizadoEl: ahoraISO(ahora), notas: [...t.notas, nota(texto, ahora)] };
}

export function marcarPago<T extends CualquierTramite>(t: T, pagoId: string, ahora = new Date()): T {
  return { ...t, actualizadoEl: ahoraISO(ahora), pagos: t.pagos.map((p) => (p.id === pagoId ? { ...p, estado: p.estado === "pagado" ? "pendiente" : "pagado" } : p)) };
}

/**
 * Notas internas y historial del trámite (DECISIONES, «Notas internas»): las notas las escribe el equipo y nunca salen al cliente;
 * el historial es lo que hace el sistema solo (pasos cerrados, esperas, respuestas). Las más nuevas primero; sin fecha, al final.
 */
const recientesPrimero = (a: TramiteNota, b: TramiteNota) => (b.fecha ?? "").localeCompare(a.fecha ?? "");
export const notasInternas = (t: Pick<Tramite, "notas">) => t.notas.filter((n) => n.tipo === "nota").sort(recientesPrimero);
export const historialTramite = (t: Pick<Tramite, "notas">) => t.notas.filter((n) => n.tipo === "evento").sort(recientesPrimero);

/** Cuenta del equipo como la manda `GET /api/admin/asesor-cuentas` (solo el director la puede leer). */
export type CuentaEquipo = { user_id: string; role: string; asesor_id: string | null };

/** Quién escribió: el asesor ligado a la cuenta, «Dirección» si es del director sin ficha, o «Alguien del equipo» si no se sabe. */
export function nombreAutor(autor: string | undefined, cuentas: readonly CuentaEquipo[], asesores: readonly { id: string; nombre: string }[]): string {
  const c = autor ? cuentas.find((x) => x.user_id === autor) : undefined;
  const asesor = c?.asesor_id ? asesores.find((a) => a.id === c.asesor_id) : undefined;
  if (asesor?.nombre) return asesor.nombre;
  return c?.role === "admin" ? "Dirección" : "Alguien del equipo";
}
