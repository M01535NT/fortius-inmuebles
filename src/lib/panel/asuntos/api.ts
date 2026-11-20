import type {
  Asunto, ClaveApartado, Encargo, EntradaHistorial, FilaAsunto, Miembro, PersonaDuplicada,
} from "@/lib/backend/asuntos-contrato";
import type { Destino, ResultadoSubida } from "@/lib/backend/apartados-contrato";
import type { CambioFicha, FichaPersona } from "@/lib/backend/directorio-contrato";
import type { NombreIcono } from "@/components/panel/icons";

export * from "@/lib/backend/asuntos-contrato";
export * from "@/lib/backend/apartados-contrato";
export { CAMPOS_DATOS } from "@/lib/backend/directorio-contrato";
export type { AsuntoDePersona, CambioFicha, CampoDato, DatosDePersona, FichaPersona } from "@/lib/backend/directorio-contrato";

/** Error de una ruta del panel, con el mensaje que ya viene en lenguaje sencillo. */
export class FalloPanel extends Error {
  constructor(public estado: number, mensaje: string) { super(mensaje); }
}

export async function pedir<T>(ruta: string, metodo = "GET", cuerpo?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch(ruta, {
      method: metodo, credentials: "same-origin", cache: "no-store",
      headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new FalloPanel(0, "Sin conexión. Lo que escribiste sigue en pantalla; vuelve a intentarlo.");
  }
  const datos = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new FalloPanel(r.status, datos.error ?? "No se pudo terminar. Vuelve a intentarlo.");
  return datos as T;
}

const base = "/api/admin/asuntos";
export const leerAsuntos = () => pedir<{ asuntos: FilaAsunto[] }>(base).then((r) => r.asuntos);
export const leerAsunto = (id: string) => pedir<{ asunto: Asunto }>(`${base}/${id}`).then((r) => r.asunto);
export const leerEquipo = () => pedir<{ equipo: Miembro[]; companeros?: Miembro[]; yo: string }>(`${base}/equipo`);
export const leerHistorial = (id: string, antes?: number) =>
  pedir<{ entradas: EntradaHistorial[] }>(`${base}/${id}/historial${antes ? `?antes=${antes}` : ""}`).then((r) => r.entradas);
/** Solo notas y decisiones: las del costado de cada ventana. */
export const leerNotas = (id: string) =>
  pedir<{ entradas: EntradaHistorial[]; fijadas: number[] }>(`${base}/${id}/historial?solo=notas`);
/** Fija una nota arriba del costado o la suelta. */
export const fijarNota = (asuntoId: string, notaId: number, fijar: boolean) =>
  pedir<{ ok: true }>(`${base}/${asuntoId}/historial`, "PATCH", { id: notaId, fijar });
export type NuevaNota = { clase: "nota" | "decision"; texto: string; desde?: string; personas?: string[]; apartados?: string[]; equipo?: string[] };

/** La ficha completa de una persona (contacto, datos y otros asuntos). */
export const leerFicha = (personaId: string) => pedir<{ ficha: FichaPersona }>(`/api/admin/personas/${personaId}`).then((r) => r.ficha);
export const cambiarFicha = (personaId: string, cambio: CambioFicha) =>
  pedir<{ ficha: FichaPersona }>(`/api/admin/personas/${personaId}`, "PATCH", cambio).then((r) => r.ficha);
export const cargarEjemplos = () => pedir<{ creados: number }>(`${base}/ejemplos`, "POST", {});
export const abrirAsunto = (nombre: string, encargos: Encargo[]) => pedir<{ asunto: { id: string; folio: string } }>(base, "POST", { nombre, encargos }).then((r) => r.asunto);

export type CambioAsunto = Partial<Pick<Asunto,
  "nombre" | "encargos" | "en_que_va" | "en_espera" | "espera_motivo" | "espera_hasta" | "resultado" | "motivo_cierre" | "capto_id" | "vendio_id" | "responsable_id" | "situacion">>;
export const cambiarAsunto = (a: Pick<Asunto, "id" | "version">, cambio: CambioAsunto) =>
  pedir<{ asunto: Asunto }>(`${base}/${a.id}`, "PATCH", { version: a.version, ...cambio }).then((r) => r.asunto);
export const mandarAEliminados = (a: Pick<Asunto, "id" | "version">, restaurar = false) =>
  pedir<{ ok: true }>(`${base}/${a.id}`, "DELETE", { version: a.version, ...(restaurar ? { restaurar } : {}) });

type Parte = "apartados" | "filas" | "personas" | "tareas" | "etapas" | "historial"
  | "documentos" | "situacion" | "opinion" | "opinion_puntos" | "presupuestos" | "conceptos" | "cobros" | "interesados" | "ofertas" | "ligas";
export const agregar = <R = { id?: string }>(asuntoId: string, parte: Parte, cuerpo: unknown) =>
  pedir<{ resultado: R }>(`${base}/${asuntoId}/${parte}`, "POST", cuerpo).then((r) => r.resultado);
export const cambiar = <R = unknown>(asuntoId: string, parte: Exclude<Parte, "historial">, cuerpo: { id: string; version: number } & Record<string, unknown>) =>
  pedir<{ ok: true; resultado?: R }>(`${base}/${asuntoId}/${parte}`, "PATCH", cuerpo);

/** Sube archivos al asunto: a un renglón, «Subir varios» (cada uno a su renglón), el contrato, la opinión, el presupuesto o una tarjeta. */
export async function subir(asuntoId: string, destino: Destino, archivos: File[], ref?: string): Promise<ResultadoSubida[]> {
  const form = new FormData();
  form.set("destino", destino);
  if (ref) form.set("ref", ref);
  for (const f of archivos) form.append("archivos", f);
  let r: Response;
  try { r = await fetch(`${base}/${asuntoId}/archivos`, { method: "POST", body: form, credentials: "same-origin" }); }
  catch { throw new FalloPanel(0, "Sin conexión. Vuelve a intentarlo."); }
  const datos = (await r.json().catch(() => ({}))) as { error?: string; subidos?: ResultadoSubida[] };
  if (!r.ok) throw new FalloPanel(r.status, datos.error ?? "No se pudo subir. Vuelve a intentarlo.");
  return datos.subidos ?? [];
}
export const urlArchivo = (asuntoId: string, archivoId: string) => `${base}/${asuntoId}/archivos/${archivoId}`;
export const hacerRecibo = (asuntoId: string, cobroId: string) => pedir<{ documento_id: string }>(`${base}/${asuntoId}/recibo`, "POST", { cobro_id: cobroId });
export const continuarAsunto = (asuntoId: string, nombre?: string) =>
  pedir<{ asunto: { id: string; folio: string } }>(`${base}/${asuntoId}/continuar`, "POST", nombre ? { nombre } : {}).then((r) => r.asunto);
export type ResultadoPersona = { id?: string; duplicada?: PersonaDuplicada };

// ── Textos de pantalla ─────────────────────────────────────────────────────────────────────────────────
// Los nombres de en qué va, los encargos y los papeles salen de los catálogos (useCatalogos). Aquí solo los íconos.
/** Ícono y color de los cuatro encargos de sistema; uno que agregue el director usa el del asunto. */
const ICONO_ENCARGO: Partial<Record<Encargo, [NombreIcono, string]>> = {
  revisar: ["ojo", "violet"], comercializar: ["etiq", "orange"], tramitar: ["sello", "teal"], asesorar: ["band", "indigo"],
};
export const iconoEncargo = (e: Encargo | undefined): [NombreIcono, string] => (e ? ICONO_ENCARGO[e] : undefined) ?? ["asu", "gray"];

/** Los apartados con nombre fijo: nombre, ícono, color y en qué etapa de PLAN.md llega su ventana completa. */
export const APARTADO: Record<ClaveApartado, { nombre: string; icono: NombreIcono; color: string; etapa: number }> = {
  personas: { nombre: "Personas", icono: "users", color: "blue", etapa: 2 },
  inmueble: { nombre: "Inmueble", icono: "edif", color: "orange", etapa: 4 },
  interesados: { nombre: "Interesados", icono: "estrella", color: "orange", etapa: 5 },
  situacion: { nombre: "Situación", icono: "alerta", color: "red", etapa: 5 },
  documentos: { nombre: "Documentos", icono: "file", color: "teal", etapa: 5 },
  opinion: { nombre: "Opinión jurídica", icono: "balanza", color: "violet", etapa: 5 },
  honorarios: { nombre: "Honorarios", icono: "cartera", color: "green", etapa: 5 },
  plan: { nombre: "Plan", icono: "lista", color: "indigo", etapa: 2 },
  historial: { nombre: "Historial", icono: "reloj", color: "gray", etapa: 2 },
};

/** «Hoy», «Mañana», «Ayer», «jue 19 nov» o «Venció …». Fechas en texto AAAA-MM-DD, sin zona. */
export function hoyTexto(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function diasHasta(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  const [ha, hm, hd] = hoyTexto().split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, d) - Date.UTC(ha, hm - 1, hd)) / 86400000);
}
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fechaCorta(fecha: string | null, hora?: string | null): string {
  if (!fecha) return "Sin fecha";
  const n = diasHasta(fecha);
  const [a, m, d] = fecha.split("-").map(Number);
  const dia = n === 0 ? "Hoy" : n === 1 ? "Mañana" : n === -1 ? "Ayer" : `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} ${MESES[m - 1]}`;
  return hora ? `${dia} · ${hora}` : dia;
}
export function sumarDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter((p) => /^\p{L}/u.test(p)).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";

/** Hace cuánto: «hace 5 min», «ayer», «12 nov». */
export function haceCuanto(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = new Date(iso);
  const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return diasHasta(fecha) === -1 ? "Ayer" : `${d.getDate()} ${MESES[d.getMonth()]}`;
}
