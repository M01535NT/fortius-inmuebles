/**
 * Dictado de un espacio de texto en la captura de formatos (PN-06), con el reconocimiento de voz del propio navegador
 * (Web Speech: Chrome, Edge, Safari). El panel no manda la voz a ningún servicio propio ni nuevo: si el navegador
 * puede reconocer en el equipo (`processLocally`), se le pide; si no, usa el servicio que el navegador ya trae.
 * Donde la API no existe (Firefox), el botón no aparece.
 */

type Alternativa = { transcript: string };
type EventoResultado = { resultIndex?: number; results: ArrayLike<ArrayLike<Alternativa> & { isFinal?: boolean }> };
export type Reconocedor = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number; processLocally?: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: EventoResultado) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type Constructor = (new () => Reconocedor) & {
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

export const IDIOMA_DICTADO = "es-MX";

export function constructorDeVoz(w: unknown = typeof window === "undefined" ? undefined : window): Constructor | null {
  if (!w || typeof w !== "object") return null;
  const v = w as { SpeechRecognition?: Constructor; webkitSpeechRecognition?: Constructor };
  return v.SpeechRecognition ?? v.webkitSpeechRecognition ?? null;
}

export const hayDictado = () => constructorDeVoz() !== null;

/** Prepara el reconocedor: español de México, una frase a la vez y, si el navegador puede, reconociendo en el equipo. */
export async function crearReconocedor(Ctor: Constructor): Promise<Reconocedor> {
  const r = new Ctor();
  r.lang = IDIOMA_DICTADO; r.interimResults = false; r.continuous = false; r.maxAlternatives = 1;
  try {
    if (typeof Ctor.available === "function" && (await Ctor.available({ langs: [IDIOMA_DICTADO], processLocally: true })) === "available") r.processLocally = true;
  } catch { /* el navegador no sabe decirlo: usa su reconocimiento normal */ }
  return r;
}

/** Lo dictado en un evento (solo lo final). */
export function textoDictado(e: EventoResultado): string {
  const partes: string[] = [];
  for (let i = e.resultIndex ?? 0; i < e.results.length; i += 1) {
    const r = e.results[i];
    if (r.isFinal === false) continue;
    const t = r[0]?.transcript?.trim();
    if (t) partes.push(t);
  }
  return partes.join(" ");
}

/** Lo dictado se suma a lo escrito: separado por un espacio y, si el espacio estaba vacío, con mayúscula inicial. */
export function unirDictado(actual: unknown, dictado: string): string {
  const t = dictado.trim();
  const previo = typeof actual === "string" ? actual : actual === undefined || actual === null ? "" : String(actual);
  if (!t) return previo;
  if (!previo.trim()) return t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);
  return /\s$/.test(previo) ? `${previo}${t}` : `${previo} ${t}`;
}

/** Qué decirle al asesor cuando el dictado falla. Silencio o cancelación no son error. */
export function mensajeDeDictado(error: string | undefined): string | null {
  switch (error) {
    case "aborted": case undefined: return null;
    case "no-speech": return "No se oyó nada. Toca «Dictar» y habla cerca del micrófono.";
    case "not-allowed": case "service-not-allowed": return "El navegador no deja usar el micrófono. Dale permiso y vuelve a intentarlo.";
    case "audio-capture": return "No se encontró un micrófono.";
    case "network": return "El dictado necesita conexión en este navegador. Escríbelo a mano o vuelve a intentarlo.";
    case "language-not-supported": return "Este navegador no dicta en español.";
    default: return "No se pudo dictar. Escríbelo a mano o vuelve a intentarlo.";
  }
}
