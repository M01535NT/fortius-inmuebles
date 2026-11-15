import type { Evento, Nota } from "@/lib/admin/store";
import { EVENTO_TIPO_LABELS } from "@/lib/domain/records";
import type { Task } from "@/lib/tasks";
import { shortDate } from "@/lib/admin/today";

/*
  LV-10e · Personas como agenda con cara. La lista se lee como agenda: primero a quién le toca hoy
  (o se le pasó), luego lo de esta semana, lo que viene después y al final quien no tiene fecha.
  «Lo que ha pasado» junta lo que ya existe de la persona: sus notas, las citas que ya pasaron,
  las tareas terminadas y las notas del primer contacto. No inventa nada ni lee el historial técnico.
*/

export type Grupo = "toca" | "semana" | "despues" | "sinFecha";
export const GRUPOS: ReadonlyArray<{ id: Grupo; titulo: string }> = [
  { id: "toca", titulo: "Te toca hoy o antes" },
  { id: "semana", titulo: "Esta semana" },
  { id: "despues", titulo: "Más adelante" },
  { id: "sinFecha", titulo: "Sin fecha" },
];

function sumarDias(dia: string, n: number) {
  const d = new Date(`${dia}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** `sort` es la fecha del siguiente paso («2026-11-14» o «2026-11-14 11:00»), o «9999» sin fecha. */
export function grupoDe(sort: string, today: string): Grupo {
  if (sort.startsWith("9999")) return "sinFecha";
  const dia = sort.slice(0, 10);
  if (dia <= today) return "toca";
  return dia <= sumarDias(today, 6) ? "semana" : "despues";
}

/** Día local de Tijuana de una marca de tiempo; una fecha de calendario se queda igual. */
export function diaLocal(valor: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  return new Date(valor).toLocaleDateString("en-CA", { timeZone: "America/Tijuana" });
}

export type Suceso = { id: string; clase: "nota" | "cita" | "tarea" | "contacto"; orden: string; dia: string; texto: string; detalle: string; autor?: string };

const recorte = (texto: string, max = 120) => { const t = texto.trim().replace(/\s+/g, " "); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };

/**
  Lo que ha pasado con la persona, lo más reciente primero. `quien` ubica sus registros: el
  prospecto por su id; el cliente por su id o por cualquiera de sus operaciones.
*/
export function sucesos(quien: { kind: "lead" | "cliente"; id: string; operaciones: string[] }, datos: {
  notas: Nota[]; eventos: Evento[]; tareas: Task[]; notasContacto: Array<{ id: string; texto: string; fecha: string }>;
}, today: string, max = 8): Suceso[] {
  const ops = new Set(quien.operaciones);
  const suya = (ref: { leadId?: string; clienteId?: string; expedienteId?: string }) =>
    (quien.kind === "lead" ? ref.leadId === quien.id : ref.clienteId === quien.id) || (!!ref.expedienteId && ops.has(ref.expedienteId));
  const lista: Suceso[] = [];
  if (quien.kind === "cliente") for (const nota of datos.notas) if (!nota.aviso && (nota.clienteId === quien.id || (!!nota.expedienteId && ops.has(nota.expedienteId)))) {
    const dia = diaLocal(nota.actualizadoEl);
    lista.push({ id: `n${nota.id}`, clase: "nota", orden: nota.actualizadoEl, dia, autor: nota.autor, texto: `${nota.autor ? `${nota.autor} anotó` : "Nota"}: «${recorte(nota.titulo || nota.texto)}»`, detalle: `${shortDate(dia)} · nota` });
  }
  for (const evento of datos.eventos) if (suya(evento) && evento.fecha < today)
    lista.push({ id: `e${evento.id}`, clase: "cita", orden: `${evento.fecha}T${evento.hora ?? "00:00"}`, dia: evento.fecha, texto: evento.titulo, detalle: `${shortDate(evento.fecha)} · ${EVENTO_TIPO_LABELS[evento.tipo].toLowerCase()}` });
  for (const tarea of datos.tareas) if (tarea.estado === "completada" && tarea.completadoEl && suya(tarea)) {
    const dia = diaLocal(tarea.completadoEl);
    lista.push({ id: `t${tarea.id}`, clase: "tarea", orden: tarea.completadoEl, dia, texto: `Se terminó: ${recorte(tarea.titulo)}`, detalle: `${shortDate(dia)} · tarea` });
  }
  for (const nota of datos.notasContacto) {
    const dia = diaLocal(nota.fecha);
    lista.push({ id: `c${nota.id}`, clase: "contacto", orden: nota.fecha, dia, texto: `«${recorte(nota.texto)}»`, detalle: `${shortDate(dia)} · primer contacto` });
  }
  return lista.sort((a, b) => b.orden.localeCompare(a.orden)).slice(0, max);
}

/*
  FLX-01 · «Nuevo perfil» con las cinco preguntas de una llamada (DEC-50; RP-94 igual): nombre,
  teléfono, motivo, canal preferido y en qué quedaron. Se guarda como prospecto con lo que ya existe
  en la base: el motivo en `perfil.operacion` (y lo que contó en `mensaje`), el canal preferido en
  `perfil.canalPreferido` (el perfil acepta campos nuevos), y «en qué quedaron» como próximo
  contacto con su fecha, igual que al registrar un contacto (RP-21, COR-18).
*/
export const MOTIVOS = {
  vender: "Vender",
  comprar: "Comprar",
  rentar: "Rentar",
  arrendar: "Ofrecer en renta",
  invertir: "Invertir",
} as const;
export type Motivo = keyof typeof MOTIVOS;
export const CANALES_PREFERIDOS = { llamada: "Llamada", whatsapp: "WhatsApp", correo: "Correo" } as const;
export type CanalPreferido = keyof typeof CANALES_PREFERIDOS;
/** Para leerse dentro de una frase: «Prefiere WhatsApp», «Prefiere llamada». */
export const canalEnFrase = (c: CanalPreferido) => c === "whatsapp" ? "WhatsApp" : CANALES_PREFERIDOS[c].toLowerCase();
/** Lo que más se acuerda en una primera llamada; se puede escribir otra cosa. */
export const ACUERDOS = ["Enviarle opciones", "Agendar una visita", "Volver a llamarle", "Pedirle sus documentos"] as const;

/** Canal preferido guardado en el perfil, si es uno de los conocidos. */
export function canalPreferido(perfil: unknown): CanalPreferido | undefined {
  const valor = perfil && typeof perfil === "object" ? (perfil as Record<string, unknown>).canalPreferido : undefined;
  return typeof valor === "string" && valor in CANALES_PREFERIDOS ? valor as CanalPreferido : undefined;
}

export type Respuestas = {
  nombre: string; telefono: string; email: string; motivo: Motivo | ""; detalle: string;
  canal: CanalPreferido | ""; acuerdo: string; fecha: string; privacidad: boolean;
};

export function sinAcentos(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
const digitos = (texto: string) => texto.replace(/\D/g, "").slice(-10);

/** Qué falta para guardar (RP-94: nombre, interés y un medio de contacto) y dónde poner el foco. */
export function faltante(r: Respuestas): { campo: keyof Respuestas; texto: string } | null {
  if (r.nombre.trim().split(/\s+/).filter(Boolean).length < 1) return { campo: "nombre", texto: "Escribe su nombre." };
  if (digitos(r.telefono).length < 7) return { campo: "telefono", texto: "Escribe su teléfono para poder volver a buscarle." };
  if (!r.motivo) return { campo: "motivo", texto: "Elige para qué llamó." };
  if (r.canal === "correo" && !/^\S+@\S+\.\S+$/.test(r.email.trim())) return { campo: "email", texto: "Escribe su correo, porque prefiere que le escriban ahí." };
  if (!r.acuerdo.trim()) return { campo: "acuerdo", texto: "Anota en qué quedaron." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) return { campo: "fecha", texto: "Elige cuándo le vuelves a buscar." };
  return null;
}

/**
  Personas que podrían ser la misma (RP-94): mismo teléfono (últimos 10 dígitos) o mismo nombre sin
  acentos ni mayúsculas. Solo avisa; el asesor decide «es la misma» o «es otra», sin fusión.
*/
export function parecidas<T extends { id: string; nombre: string; telefono?: string }>(personas: readonly T[], nombre: string, telefono: string): Array<T & { por: "teléfono" | "nombre" }> {
  const tel = digitos(telefono), nom = sinAcentos(nombre);
  return personas.flatMap((p): Array<T & { por: "teléfono" | "nombre" }> => {
    if (tel.length >= 7 && digitos(p.telefono ?? "") === tel) return [{ ...p, por: "teléfono" as const }];
    if (nom.split(" ").length >= 2 && sinAcentos(p.nombre) === nom) return [{ ...p, por: "nombre" as const }];
    return [];
  });
}

/** El prospecto nuevo, contactado en esta llamada, con su próximo contacto. */
export function prospectoNuevo(r: Respuestas, ids: { id: string; nota: string }, at: string, asesorId?: string) {
  const detalle = r.detalle.trim();
  const motivo = r.motivo ? MOTIVOS[r.motivo] : "";
  return {
    id: ids.id,
    nombre: r.nombre.trim().replace(/\s+/g, " "),
    telefono: r.telefono.trim(),
    ...(r.email.trim() ? { email: r.email.trim() } : {}),
    origen: "manual" as const,
    estado: "contactado" as const,
    creadoEl: at,
    firstContactedAt: at,
    ...(asesorId ? { asesorId } : {}),
    ...(detalle ? { mensaje: detalle.slice(0, 2000) } : {}),
    perfil: {
      ...(r.motivo ? { operacion: r.motivo } : {}),
      ...(r.canal ? { canalPreferido: r.canal } : {}),
      proximoContacto: r.fecha,
      proximaAccion: r.acuerdo.trim().slice(0, 160),
      ...(r.privacidad ? { avisoPrivacidad: diaLocal(at) } : {}),
    },
    notas: [{ id: ids.nota, fecha: at, contacto: "llamada" as const, texto: `Primer contacto: ${motivo.toLowerCase()}${r.canal ? `. Prefiere ${canalEnFrase(r.canal)}` : ""}. Quedamos en: ${r.acuerdo.trim()}.` }],
  };
}

/*
  Inmuebles de su interés: la lista que el asesor arma en la ficha de la persona con «Agregar
  inmueble». Se guarda en la propia persona (prospecto o cliente) como `inmueblesInteres`, una
  lista de claves de inmueble, sin repetir y con un tope de 50.
*/
export const TOPE_INTERES = 50;
export function interesDe(persona?: object | null): string[] {
  const lista = (persona as { inmueblesInteres?: unknown } | null | undefined)?.inmueblesInteres;
  return Array.isArray(lista) ? [...new Set(lista.filter((x): x is string => typeof x === "string" && !!x))] : [];
}
export function conInteres(persona: object | null | undefined, slug: string): string[] {
  const actual = interesDe(persona).filter(x => x !== slug);
  return [...actual, slug].slice(-TOPE_INTERES);
}
export function sinInteres(persona: object | null | undefined, slug: string): string[] {
  return interesDe(persona).filter(x => x !== slug);
}
