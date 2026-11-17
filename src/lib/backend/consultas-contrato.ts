/**
 * La consulta (SPEC.md, sección 4): lo que se intercambia entre la pantalla y el servidor, y las reglas que arman
 * la lista de qué pedirle y para qué se abre el asunto. Las usan la pantalla (en vivo) y el servidor (al abrir el asunto).
 * Tabla: docs/operacion/modelo-de-datos-panel.md, sección 4.11.
 */
import type { Encargo, Papel, Quien } from "./asuntos-contrato";

export const CANALES = ["llamada", "whatsapp", "en_persona", "sitio", "otro"] as const;
export type Canal = (typeof CANALES)[number];

export const QUIERE = ["vender", "rentar", "comprar", "regularizar", "asesoria"] as const;
export const DE_QUIEN = ["suyo", "familiar", "fallecio", "empresa", "no_sabe"] as const;
export const TIPOS_INMUEBLE = ["casa", "departamento", "terreno", "local", "oficina", "nave_bodega", "plaza_conjunto"] as const;
export const OCUPA = ["vacio", "dueno", "inquilino", "invadido", "no_sabe"] as const;
export const SI_NO = ["si", "no", "no_sabe"] as const;
export const DEBE = ["hipoteca", "predial", "servicios", "nada", "no_sabe"] as const;

export type Quiere = (typeof QUIERE)[number];
export type DeQuien = (typeof DE_QUIEN)[number];
export type TipoInmueble = (typeof TIPOS_INMUEBLE)[number];
export type Ocupa = (typeof OCUPA)[number];
export type SiNo = (typeof SI_NO)[number];
export type Debe = (typeof DEBE)[number];

/** Los datos de siempre. Ninguno es obligatorio. */
export type DatosConsulta = {
  que_quiere?: Quiere; de_quien?: DeQuien; tipo?: TipoInmueble; colonia?: string;
  ocupa?: Ocupa; escritura?: SiNo; debe?: Debe[];
};

export type OtraPersona = { nombre: string; papel: Papel; pais?: string; numero?: string; fallecida?: boolean };
export type DocumentoPedir = { nombre: string; grupo?: "persona" | "inmueble" | "credito" | "otro"; entrega_papel?: string; quitado?: boolean; propio?: boolean };
export type Carga = { id: string; nombre_original: string; mime: string; byte_length: number; created_at: string };

export const ESTADOS_CONSULTA = ["abierta", "asunto", "contacto", "no_procede"] as const;
export type EstadoConsulta = (typeof ESTADOS_CONSULTA)[number];

export type Consulta = {
  id: string; version: number; estado: EstadoConsulta;
  quien_nombre: string; quien_telefonos: { pais: string; numero: string }[]; quien_correo: string | null; canal: Canal;
  persona_id: string | null; que_pasa: string; datos: DatosConsulta;
  otras_personas: OtraPersona[]; documentos_pedir: DocumentoPedir[];
  asunto_id: string | null; motivo: string | null; es_ejemplo: boolean; created_at: string; updated_at: string;
  cargas: Carga[];
};

/** Lo que muestra la lista de consultas sin terminar. */
export type ConsultaAbierta = { id: string; quien_nombre: string; que_pasa: string; updated_at: string };

// ── Nombres en pantalla ──────────────────────────────────────────────────────────────────────────────
export const NOMBRE_CANAL: Record<Canal, string> = { llamada: "Llamada", whatsapp: "WhatsApp", en_persona: "En persona", sitio: "Sitio", otro: "Otro" };
export const NOMBRE_QUIERE: Record<Quiere, string> = { vender: "Vender", rentar: "Rentar", comprar: "Comprar", regularizar: "Regularizar", asesoria: "Asesoría" };
export const NOMBRE_DE_QUIEN: Record<DeQuien, string> = { suyo: "Suyo", familiar: "De un familiar", fallecio: "Falleció el titular", empresa: "De una empresa", no_sabe: "No sabe" };
export const NOMBRE_TIPO: Record<TipoInmueble, string> = {
  casa: "Casa", departamento: "Departamento", terreno: "Terreno", local: "Local", oficina: "Oficina", nave_bodega: "Nave o bodega", plaza_conjunto: "Plaza o conjunto",
};
export const NOMBRE_OCUPA: Record<Ocupa, string> = { vacio: "Vacío", dueno: "El dueño", inquilino: "Un inquilino", invadido: "Invadido", no_sabe: "No sabe" };
export const NOMBRE_SI_NO: Record<SiNo, string> = { si: "Sí", no: "No", no_sabe: "No sabe" };
export const NOMBRE_DEBE: Record<Debe, string> = { hipoteca: "Hipoteca", predial: "Predial", servicios: "Servicios", nada: "Nada", no_sabe: "No sabe" };

// ── Reglas ───────────────────────────────────────────────────────────────────────────────────────────
const D = (nombre: string, grupo: DocumentoPedir["grupo"], entrega_papel = "cliente"): DocumentoPedir => ({ nombre, grupo, entrega_papel });

/** Qué pedirle, según lo que se va contestando (boceto aprobado). Contenido de ejemplo: el titular lo ajusta. */
export function documentosSegun(d: DatosConsulta): DocumentoPedir[] {
  const x: DocumentoPedir[] = [D("Identificación de quien llama", "persona")];
  if (d.escritura !== "no") x.push(D("Escritura o datos del registro", "inmueble"));
  x.push(D("Boleta predial reciente", "inmueble"));
  if (d.de_quien === "fallecio") x.push(D("Acta de defunción", "persona"), D("Actas de nacimiento de los herederos", "persona"));
  if (d.de_quien === "familiar") x.push(D("Poder o carta del dueño", "persona"));
  if (d.de_quien === "empresa") x.push(D("Acta constitutiva y poder del representante", "persona"));
  if (d.debe?.includes("hipoteca")) x.push(D("Estado de cuenta del crédito", "credito"));
  if (d.ocupa === "inquilino") x.push(D("Contrato de renta vigente", "inmueble"));
  if (d.que_quiere === "comprar") x.push(D("Precalificación del crédito", "credito"));
  if (d.tipo === "nave_bodega") x.push(D("Licencia de uso de suelo", "inmueble"), D("Plano arquitectónico", "inmueble"));
  return x;
}

/**
 * La lista que se guarda: la que sale de las reglas, con lo que se quitó marcado, más lo que se agregó a mano.
 * Lo quitado se recuerda por nombre: si la regla vuelve a pedir algo que se quitó, sigue quitado.
 */
export function unirDocumentos(datos: DatosConsulta, antes: readonly DocumentoPedir[]): DocumentoPedir[] {
  const quitados = new Set(antes.filter((x) => x.quitado).map((x) => x.nombre));
  const regla = documentosSegun(datos).map((x) => (quitados.has(x.nombre) ? { ...x, quitado: true } : x));
  const nombres = new Set(regla.map((x) => x.nombre));
  return [...regla, ...antes.filter((x) => x.propio && !nombres.has(x.nombre))];
}

/** Para qué se abre el asunto (boceto aprobado). Se ve en pantalla antes de abrirlo y se puede cambiar después en el asunto. */
export function encargosSegun(d: DatosConsulta): Encargo[] {
  const e: Encargo[] = [];
  if (d.de_quien === "fallecio" || d.ocupa === "invadido" || d.escritura === "no" || d.que_quiere === "regularizar" || !d.que_quiere) e.push("revisar");
  if (d.que_quiere === "vender" || d.que_quiere === "rentar") e.push("comercializar");
  if (d.que_quiere === "comprar") e.push("tramitar");
  if (d.que_quiere === "asesoria") e.push("asesorar");
  return e;
}

/** El papel de quien llama: dueño si es suyo; si no, contacto. Se cambia después en Personas. */
export const papelDeQuienLlama = (d: DatosConsulta): Papel => (d.de_quien === "suyo" ? "propietario" : "contacto");

const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? "";

/** «Casa en la Murúa», o «Casa de Laura» si no hay colonia. */
export function nombreDelAsunto(quien: string, d: DatosConsulta): string {
  const tipo = d.tipo ? NOMBRE_TIPO[d.tipo] : "Inmueble";
  const colonia = d.colonia?.trim();
  if (colonia) return `${tipo} en ${colonia}`.slice(0, 160);
  const n = primerNombre(quien);
  return (n ? `${tipo} de ${n}` : d.tipo ? tipo : "Consulta sin nombre").slice(0, 160);
}

/** Se crea el inmueble si se dijo qué es o dónde está. */
export function inmuebleSegun(quien: string, d: DatosConsulta): { nombre: string; tipo: TipoInmueble | null; operacion: "venta" | "renta" | null; colonia: string | null } | null {
  if (!d.tipo && !d.colonia?.trim()) return null;
  return {
    nombre: nombreDelAsunto(quien, d), tipo: d.tipo ?? null, colonia: d.colonia?.trim() || null,
    operacion: d.que_quiere === "rentar" ? "renta" : d.que_quiere === "vender" ? "venta" : null,
  };
}

/**
 * El primer plan, para que el asunto no nazca sin «lo que sigue». Es un ejemplo, no una metodología:
 * cuando exista la Biblioteca (etapa 7) se elige de ahí. Días contados desde hoy.
 */
export function primerPlan(encargos: readonly Encargo[], hayDocumentos: boolean): { nombre: string; tareas: { titulo: string; quien: Quien; dias: number }[] }[] {
  const tareas: { titulo: string; quien: Quien; dias: number }[] = [];
  if (hayDocumentos) tareas.push({ titulo: "Recibir los documentos", quien: "cliente", dias: 3 });
  if (encargos.includes("revisar") || encargos.includes("asesorar")) {
    tareas.push({ titulo: "Estudiar el asunto", quien: "fortius", dias: 5 });
    if (encargos.includes("revisar")) tareas.push({ titulo: "Emitir la opinión jurídica", quien: "fortius", dias: 8 });
  }
  tareas.push({ titulo: "Presupuesto de honorarios", quien: "fortius", dias: 9 });
  return [{ nombre: "Primeros pasos", tareas }];
}

/** El mensaje para WhatsApp con lo que falta pedirle. El sistema no lo envía: lo envía el asesor. */
export function mensajeParaPedir(quien: string, docs: readonly DocumentoPedir[]): string {
  const n = primerNombre(quien);
  const lista = docs.filter((x) => !x.quitado).map((x) => `• ${x.nombre}`).join("\n");
  return `Hola${n ? ` ${n}` : ""}, para empezar a revisar tu asunto necesito:\n\n${lista}\n\nMe lo puedes mandar por aquí, en foto o PDF. Gracias.`;
}
