import type { EventoTipo } from "@/lib/domain/records";
import { esDelPanel, type DatosCita } from "@/lib/panel/datos/agenda-acciones";
import { EVENTO_TIPO_LABELS } from "@/lib/domain/records";
import { aTexto, DIAS_LARGOS, horaTexto, MESES, MESES_CORTOS } from "@/lib/panel/calendario";

/**
 * Captura en una línea (DECISIONES.md, «Patrones de interacción» y «Agenda»): «Visita con Ana G. mañana 4pm en Otay»
 * se separa en tipo, día, hora, persona y lugar, sin IA, para mostrarlo en pastillas antes de guardar. Funciones puras.
 */

export type PersonaLinea = { id: string; nombre: string };
export type LineaCita = {
  tipo: EventoTipo; tipoTexto: string; fecha: string | null; hora: number | null;
  persona: { texto: string; id?: string } | null; lugar: string | null; titulo: string;
  /** Pastillas para confirmar («Tipo · Visita», «Día · Mañana»…). */
  pastillas: { k: string; v: string }[];
  /** Tiene lo mínimo para agendarse: un día. */
  completa: boolean;
};

export const quitarAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const TIPOS: { re: RegExp; tipo: EventoTipo; texto?: string }[] = [
  { re: /\b(firma|firmar|notari[ao]|escritura)\b/, tipo: "firma" },
  { re: /\b(llamar|llamada|marcar|marcarle)\b/, tipo: "llamada" },
  { re: /\b(reunion|junta|cita)\b/, tipo: "reunion" },
  { re: /\blevantamiento\b/, tipo: "otro", texto: "Levantamiento" },
  { re: /\b(visita|ensenar|mostrar)\b/, tipo: "visita" },
];

const DIAS_SEMANA = DIAS_LARGOS.map(quitarAcentos);
const MESES_N = MESES.map(quitarAcentos);
const MESES_C = MESES_CORTOS.map(quitarAcentos);

export function fechaDe(t: string, hoy: Date): { fecha: string; texto: string } | null {
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const mas = (n: number) => aTexto(new Date(base.getFullYear(), base.getMonth(), base.getDate() + n));
  if (/\bpasado manana\b/.test(t)) return { fecha: mas(2), texto: "pasado mañana" };
  if (/\bmanana\b/.test(t)) return { fecha: mas(1), texto: "mañana" };
  if (/\bhoy\b/.test(t)) return { fecha: mas(0), texto: "hoy" };
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${DIAS_SEMANA[i]}\\b`).test(t)) {
      const dif = (i - base.getDay() + 7) % 7 || 7;
      return { fecha: mas(dif), texto: DIAS_LARGOS[i] };
    }
  }
  // «el 20», «20 de nov», «20 nov», «20/11».
  const conMes = /\b(\d{1,2})\s*(?:\/\s*(\d{1,2})|de\s+([a-z]{3,10})|\s([a-z]{3,10}))/.exec(t);
  // «el 2%» o «el 50» de un monto no son días.
  const elDia = /\bel\s+(\d{1,2})\b(?!\s*%|[.,]\d)/.exec(t);
  const crudo = conMes ?? elDia ?? null;
  if (!crudo) return null;
  const dia = Number(crudo[1]);
  let mes = base.getMonth();
  if (conMes) {
    if (conMes[2]) mes = Number(conMes[2]) - 1;
    else {
      // La palabra tiene que ser un mes o el principio de uno («nov», «novi», «noviembre»): «2 dictámenes» no es diciembre.
      const palabra = conMes[3] ?? conMes[4] ?? "";
      const i = MESES_N.findIndex((x) => x.startsWith(palabra)) >= 0 ? MESES_N.findIndex((x) => x.startsWith(palabra)) : MESES_C.indexOf(palabra);
      if (i < 0) return elDia ? fechaDe(`el ${elDia[1]}`, hoy) : null;
      mes = i;
    }
  }
  if (dia < 1 || dia > 31 || mes < 0 || mes > 11) return null;
  let d = new Date(base.getFullYear(), mes, dia);
  if (d < base) d = new Date(base.getFullYear() + (conMes ? 1 : 0), conMes ? mes : mes + 1, dia);
  return { fecha: aTexto(d), texto: `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}` };
}

export function horaDe(t: string): number | null {
  const ampm = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)/.exec(t);
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (ampm[3].startsWith("p")) h += 12;
    return h * 60 + Number(ampm[2] ?? 0);
  }
  const reloj = /\b(\d{1,2}):(\d{2})\b/.exec(t);
  if (reloj) return Number(reloj[1]) * 60 + Number(reloj[2]);
  const alas = /\b(?:a las|a la|tipo|como a las)\s+(\d{1,2})\b/.exec(t) ?? /\b(\d{1,2})\s*(?:hrs?|h)\b/.exec(t)
    ?? /\b(?:hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(\d{1,2})\b(?!\s*(?:de|\/))/.exec(t);
  if (!alas) return null;
  let h = Number(alas[1]);
  if (h > 23) return null;
  // Sin am/pm, de 1 a 7 se entiende por la tarde (nadie agenda a las 4 de la mañana).
  if (h >= 1 && h <= 7) h += 12;
  return h * 60;
}

const CORTE = /\s+(?:en|el|hoy|manana|pasado|lunes|martes|miercoles|jueves|viernes|sabado|domingo|a las|a la|\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs?|h)\b|\d{1,2}:\d{2})\b/;

function tramo(original: string, normal: string, re: RegExp): string | null {
  const m = re.exec(normal);
  if (!m) return null;
  const desde = m.index + m[0].length;
  const resto = normal.slice(desde);
  const corte = CORTE.exec(resto);
  const fin = desde + (corte ? corte.index : resto.length);
  const txt = original.slice(desde, fin).trim().replace(/[.,;]+$/, "").trim();
  return txt || null;
}

export function leerLinea(texto: string, hoy: Date, personas: readonly PersonaLinea[] = []): LineaCita {
  const original = texto.trim();
  // Misma longitud que el original: quitar acentos no cambia posiciones en español común.
  const t = quitarAcentos(original);
  const tipoHallado = TIPOS.find((x) => x.re.test(t));
  const tipo = tipoHallado?.tipo ?? "visita";
  const tipoTexto = tipoHallado?.texto ?? EVENTO_TIPO_LABELS[tipo];
  const dia = fechaDe(t, hoy);
  const hora = horaDe(t);
  const quien = tramo(original, t, /\bcon\s+/);
  let persona: LineaCita["persona"] = null;
  if (quien) {
    const limpio = (s: string) => quitarAcentos(s).replace(/\./g, "").split(/\s+/).filter(Boolean);
    const q = limpio(quien);
    // «Ana G.» encuentra a «Ana González»: cada palabra escrita es el principio de la palabra del nombre.
    const hallada = q.length ? personas.find((p) => { const n = limpio(p.nombre); return q.every((w, i) => (n[i] ?? "").startsWith(w)); }) : undefined;
    persona = { texto: hallada?.nombre ?? quien, id: hallada?.id };
  }
  const lugar = tramo(original, t, /\ben\s+/);
  const titulo = persona ? `${tipoTexto} con ${persona.texto}` : lugar ? `${tipoTexto} en ${lugar}` : original ? original.charAt(0).toUpperCase() + original.slice(1) : tipoTexto;
  const pastillas: { k: string; v: string }[] = [{ k: "Tipo", v: tipoTexto }];
  if (dia) pastillas.push({ k: "Día", v: dia.texto.charAt(0).toUpperCase() + dia.texto.slice(1) });
  if (hora !== null) pastillas.push({ k: "Hora", v: horaTexto(hora) });
  if (persona) pastillas.push({ k: "Con", v: persona.texto + (persona.id ? "" : " (nueva)") });
  if (lugar) pastillas.push({ k: "Dónde", v: lugar });
  return { tipo, tipoTexto, fecha: dia?.fecha ?? null, hora, persona, lugar, titulo, pastillas, completa: Boolean(dia) };
}

/** ¿La línea parece una cita? (tiene día u hora). Para que «Buscar o crear» ofrezca agendarla. */
export const pareceCita = (l: LineaCita) => l.fecha !== null || l.hora !== null;

/** Lo leído, listo para `nuevaCita` de la Agenda. El lugar va en las notas (las citas aún no tienen campo de lugar). */
export function datosDeLinea(l: LineaCita, hoy: Date, asesorId: string | null = null): DatosCita {
  // La persona hallada: una ficha del Directorio va a `personaId`; un cliente del panel provisional, a `clienteId`.
  const id = l.persona?.id ?? "";
  return {
    tipo: l.tipo, titulo: l.titulo, fecha: l.fecha ?? aTexto(hoy), hora: l.hora,
    clienteId: esDelPanel(id) ? "" : id, propiedadSlug: "", notas: l.lugar ? `Lugar: ${l.lugar}` : "", asesorId,
    ...(esDelPanel(id) ? { personaId: id } : {}),
  };
}
