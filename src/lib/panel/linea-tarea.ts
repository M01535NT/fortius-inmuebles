import type { ClaseTarea } from "@/lib/backend/asuntos-contrato";
import { aTexto, DIAS_LARGOS, horaTexto } from "@/lib/panel/calendario";
import { fechaDe, horaDe, quitarAcentos } from "@/lib/panel/linea-cita";

/**
 * Escribir en una línea (SPEC.md, sección 15): «Llamar a Laura jueves 10am» se separa en qué hacer, día, hora y persona,
 * sin IA, para crear la tarea en su asunto. La persona se reconoce por su nombre aunque se escriba solo el primero
 * («Laura» encuentra a «Laura Méndez Ríos»). Funciones puras.
 */

export type PersonaParaLinea = { id: string; nombre: string; asuntos: string[] };
export type LineaTarea = {
  clase: ClaseTarea; titulo: string; fecha: string | null; hora: string | null;
  /** El día que de verdad se escribió (sin él, `fecha` es hoy si hay hora). */
  dia: string | null;
  persona: PersonaParaLinea | null;
  /** Pastillas para confirmar antes de guardar («Día · Jueves»…). */
  pastillas: { k: string; v: string }[];
  /** Parece una tarea: tiene día u hora o empieza con algo que se hace. */
  parece: boolean;
};

const CLASES: { re: RegExp; clase: ClaseTarea; texto: string }[] = [
  { re: /^(llamar|llamarle|llamada|marcar|marcarle)\b/, clase: "llamada", texto: "Llamada" },
  { re: /^(visita|visitar|ensenar|mostrar)\b/, clase: "visita", texto: "Visita" },
  { re: /^(firma|firmar)\b/, clase: "firma", texto: "Firma" },
  { re: /^(cita|reunion|junta|ver a|verse con)\b/, clase: "cita", texto: "Cita" },
  { re: /^(seguimiento|dar seguimiento|preguntar|recordar|recordarle)\b/, clase: "seguimiento", texto: "Seguimiento" },
];
const VERBOS = /^(llamar|llamarle|marcar|marcarle|visitar|ensenar|mostrar|firmar|ver|pedir|pedirle|mandar|mandarle|enviar|enviarle|revisar|preparar|hacer|cobrar|recoger|entregar|subir|agendar|escribir|escribirle|confirmar|preguntar|recordar|recordarle|avisar|avisarle|llevar|buscar)\b/;

/** Lo que dice cuándo: se quita del título («Llamar a Laura jueves 10am» → «Llamar a Laura»), solo si de verdad se leyó. */
const MESES_RE = "(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic)";
const DIA_CUANDO = [
  /\b(?:el\s+)?pasado\s+manana\b/g, /\b(?:para\s+)?(?:hoy|manana)\b/g,
  new RegExp(`\\b(?:el\\s+|este\\s+|el proximo\\s+|para el\\s+)?(?:${DIAS_LARGOS.map(quitarAcentos).join("|")})\\b`, "g"),
  new RegExp(`\\b(?:el\\s+)?\\d{1,2}\\s*(?:\\/\\s*\\d{1,2}|(?:de\\s+|\\s)${MESES_RE})\\b`, "g"),
  /\bel\s+\d{1,2}\b(?!\s*%|[.,]\d)/g,
];
const HORA_CUANDO = [
  /\b(?:a las|a la|tipo|como a las)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.?m\.?|p\.?m\.?|hrs?|h)?(?=\s|$|[.,;])/g,
  /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|hrs?)(?=\s|$|[.,;])/g, /\b\d{1,2}:\d{2}\b/g,
];

function sinCuando(original: string, t: string, conDia: boolean, conHora: boolean): string {
  const quitar = Array.from({ length: original.length }, () => false);
  for (const re of [...(conDia ? DIA_CUANDO : []), ...(conHora ? HORA_CUANDO : [])]) {
    re.lastIndex = 0;
    for (const m of t.matchAll(re)) for (let i = m.index; i < m.index + m[0].length; i++) quitar[i] = true;
  }
  return original.split("").filter((_, i) => !quitar[i]).join("").replace(/\s{2,}/g, " ").replace(/\s+([.,;])/g, "$1").replace(/[\s.,;]+$/, "").trim();
}

/** La persona cuyo nombre aparece en la línea; gana la que coincide en más palabras («Laura Méndez» antes que «Laura»). */
function personaDe(t: string, personas: readonly PersonaParaLinea[]): PersonaParaLinea | null {
  const palabras = new Set(t.replace(/[^a-z0-9ñ\s]/g, " ").split(/\s+/).filter(Boolean));
  let mejor: { p: PersonaParaLinea; n: number } | null = null;
  for (const p of personas) {
    const n = quitarAcentos(p.nombre).replace(/[^a-z0-9ñ\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3);
    if (!n.length || !palabras.has(n[0])) continue;
    const cuantas = n.filter((w) => palabras.has(w)).length + (p.asuntos.length ? 0.5 : 0);
    if (!mejor || cuantas > mejor.n) mejor = { p, n: cuantas };
  }
  return mejor?.p ?? null;
}

export function leerLineaTarea(texto: string, hoy: Date, personas: readonly PersonaParaLinea[] = []): LineaTarea {
  const original = texto.trim();
  const t = quitarAcentos(original);
  const clase = CLASES.find((x) => x.re.test(t));
  const dia = fechaDe(t, hoy);
  const min = horaDe(t);
  const persona = personaDe(t, personas);
  const limpio = sinCuando(original, t, Boolean(dia), min !== null) || original;
  const titulo = limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : "";
  const hora = min === null ? null : `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  const pastillas: { k: string; v: string }[] = [{ k: clase?.texto ?? "Tarea", v: titulo || "Sin título" }];
  if (dia) pastillas.push({ k: "Día", v: dia.texto.charAt(0).toUpperCase() + dia.texto.slice(1) });
  if (min !== null) pastillas.push({ k: "Hora", v: horaTexto(min) });
  if (persona) pastillas.push({ k: "Con", v: persona.nombre });
  return {
    clase: clase?.clase ?? "tarea", titulo: titulo.slice(0, 300),
    // Una hora sin día se entiende para hoy.
    fecha: dia?.fecha ?? (min !== null ? aTexto(hoy) : null), dia: dia?.fecha ?? null, hora, persona, pastillas,
    // Empieza con algo que se hace. Un nombre o una dirección («Domingo Pérez», «5 de Mayo») es una búsqueda, no una tarea.
    parece: original.length >= 4 && (Boolean(clase) || VERBOS.test(t)),
  };
}
