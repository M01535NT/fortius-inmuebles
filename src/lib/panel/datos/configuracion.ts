import type { Asesor } from "@/lib/domain/records";

import type { SeccionFicha } from "./vistas";

/**
 * Configuración (PN-09): perfil, apariencia, avisos y equipo.
 * Lógica sin React para probarla aparte. El perfil se guarda en la ficha del asesor (colección `asesores`);
 * apariencia y avisos son preferencias de este navegador hasta que el servidor las admita.
 */

// ── Apariencia ──
export const CLAVE_TEMA = "fortius-theme";
export type Tema = "auto" | "light" | "dark";
export const TEMAS: readonly { valor: Tema; etiqueta: string }[] = [
  { valor: "auto", etiqueta: "Automático (como el dispositivo)" },
  { valor: "light", etiqueta: "Claro" },
  { valor: "dark", etiqueta: "Oscuro" },
];
export const temaValido = (v: string): Tema => (v === "light" || v === "dark" ? v : "auto");
/** Lo que se guarda: «auto» no se guarda (se quita la preferencia y manda el dispositivo). */
export const temaAGuardar = (t: Tema): string | null => (t === "auto" ? null : t);

// ── Avisos ──
export const CLAVE_AVISOS = "fortius-panel-avisos";
export type ClaveAviso = "consultas" | "citas" | "vencimientos" | "asignados";
export const AVISOS: readonly { clave: ClaveAviso; titulo: string; texto: string }[] = [
  { clave: "consultas", titulo: "Consultas nuevas", texto: "Cuando entra una consulta del sitio o de un portal." },
  { clave: "citas", titulo: "Citas próximas", texto: "Una hora antes de una visita, llamada o firma." },
  { clave: "vencimientos", titulo: "Vencimientos", texto: "Pendientes y documentos que vencen en los próximos días." },
  { clave: "asignados", titulo: "Te asignan algo", texto: "Cuando alguien te pasa una persona, un inmueble o un asunto." },
];
export type PreferenciasAvisos = Record<ClaveAviso, boolean>;
export const AVISOS_POR_OMISION: PreferenciasAvisos = { consultas: true, citas: true, vencimientos: true, asignados: true };

/** Lee lo guardado; lo que falte o no se entienda vale lo de por omisión. */
export function leerAvisos(texto: string | null | undefined): PreferenciasAvisos {
  const base = { ...AVISOS_POR_OMISION };
  if (!texto) return base;
  try {
    const crudo: unknown = JSON.parse(texto);
    if (!crudo || typeof crudo !== "object") return base;
    for (const { clave } of AVISOS) {
      const v = (crudo as Record<string, unknown>)[clave];
      if (typeof v === "boolean") base[clave] = v;
    }
  } catch { /* guardado dañado: valen los de por omisión */ }
  return base;
}
export const escribirAvisos = (p: PreferenciasAvisos): string => JSON.stringify(Object.fromEntries(AVISOS.map(({ clave }) => [clave, p[clave]])));

// ── Perfil ──
export type Perfil = { nombre: string; telefono: string };
export type ErroresPerfil = Partial<Record<keyof Perfil, string>>;

/** Mismas reglas que el servidor: nombre obligatorio (máx. 120), teléfono opcional con al menos 7 dígitos (máx. 40). */
export function validarPerfil(p: Perfil): ErroresPerfil {
  const e: ErroresPerfil = {};
  const nombre = p.nombre.trim();
  if (!nombre) e.nombre = "Escribe tu nombre.";
  else if (nombre.length > 120) e.nombre = "El nombre es muy largo.";
  const tel = p.telefono.trim();
  if (tel && tel.replace(/\D/g, "").length < 7) e.telefono = "El teléfono necesita al menos 7 dígitos.";
  else if (tel.length > 40) e.telefono = "El teléfono es muy largo.";
  return e;
}

/** «Mariana Estrada López» → «ME». */
export function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).map((p) => p[0]!.toLocaleUpperCase("es-MX")).join("") || "?";
}

export const perfilDe = (a: Pick<Asesor, "nombre" | "telefono">): Perfil => ({ nombre: a.nombre ?? "", telefono: a.telefono ?? "" });
export const perfilCambio = (a: Pick<Asesor, "nombre" | "telefono">, p: Perfil): boolean => {
  const actual = perfilDe(a);
  return actual.nombre.trim() !== p.nombre.trim() || actual.telefono.trim() !== p.telefono.trim();
};

/** La ficha con el perfil nuevo; las iniciales siguen al nombre y lo demás (perfil público, cargo) se conserva. */
export function aplicarPerfil<A extends Asesor>(a: A, p: Perfil): A {
  const nombre = p.nombre.trim();
  const telefono = p.telefono.trim();
  const siguiente: A = { ...a, nombre, iniciales: inicialesDe(nombre) };
  if (telefono) siguiente.telefono = telefono; else delete siguiente.telefono;
  return siguiente;
}

// ── Equipo ──
/** Activos primero y luego por nombre. */
export function ordenarEquipo<A extends Pick<Asesor, "nombre" | "activo">>(lista: readonly A[]): A[] {
  return [...lista].sort((x, y) => Number(y.activo !== false) - Number(x.activo !== false) || x.nombre.localeCompare(y.nombre, "es-MX"));
}

/** Foto del perfil público solo si es una dirección utilizable. */
export function fotoDe(a: Pick<Asesor, "perfilPublico">): string | null {
  const f = a.perfilPublico?.foto?.trim();
  return f && (/^https:\/\//.test(f) || f.startsWith("/")) ? f : null;
}

const FALTA = "Falta";
const valor = (etiqueta: string, v: string | undefined | null, obligatorio = false) => {
  const t = v?.trim();
  return t ? { etiqueta, valor: t } : obligatorio ? { etiqueta, valor: FALTA, falta: true } : null;
};

/** Ficha de solo lectura de un asesor del equipo. */
export function fichaAsesor(a: Asesor): SeccionFicha[] {
  const limpia = <T,>(xs: (T | null)[]) => xs.filter((x): x is T => x !== null);
  const contacto = limpia([
    valor("Teléfono", a.telefono, true),
    valor("WhatsApp", a.whatsapp),
    valor("Correo", a.email, true),
  ]);
  const pub = a.perfilPublico;
  const sitio = limpia([
    { etiqueta: "En el sitio", valor: pub?.publicado ? "Publicado" : "No publicado" },
    valor("Descripción", pub?.descripcion),
    valor("Teléfono público", pub?.telefono),
    valor("Correo público", pub?.email),
  ]);
  return [
    { titulo: "Datos", datos: limpia([valor("Nombre", a.nombre, true), valor("Cargo", a.cargo, true), { etiqueta: "Estado", valor: a.activo === false ? "Inactivo" : "Activo" }]) },
    { titulo: "Contacto", datos: contacto },
    { titulo: "Perfil público", datos: sitio },
  ];
}
