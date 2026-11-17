import { aplicarOrden, leerOrdenGuardado } from "@/lib/panel/ordenar";

import type { Cuenta } from "./configuracion-cuentas";

/**
 * Invitaciones y papeles del equipo (PN-09). Sin React para probarlo aparte.
 * No hay ruta para invitar todavía (PN-10): la invitación se prepara y se queda en la pantalla; no se envía ningún correo.
 */

export type Papel = "asesor" | "director";
export const PAPELES: readonly { valor: Papel; etiqueta: string }[] = [
  { valor: "asesor", etiqueta: "Asesor" },
  { valor: "director", etiqueta: "Director" },
];

/** Qué ve cada papel (RP-101: el director ve todo; el asesor, solo lo suyo). */
export const QUE_VE: Record<Papel, string> = {
  director: "Ve y cambia todo: personas, inmuebles, asuntos y dinero de todo el equipo, y administra el equipo.",
  asesor: "Ve solo lo suyo: lo que tiene a su cargo o en lo que participa.",
};

export const papelDeCuenta = (c: Pick<Cuenta, "role">): Papel => (c.role === "admin" ? "director" : "asesor");
export const alcanceDe = (c: Pick<Cuenta, "role" | "active">): string =>
  c.active ? (c.role === "admin" ? "Ve todo" : "Ve solo lo suyo") : "No puede entrar";

export type Invitacion = { correo: string; papel: Papel; asesorId: string | null; preparada: string };
export type BorradorInvitacion = { correo: string; papel: Papel; asesorId: string };

export const normalizarCorreo = (c: string): string => c.trim().toLocaleLowerCase("es-MX");
const FORMA_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mismas comprobaciones que hará el servidor: correo válido, que no tenga ya cuenta y que no esté preparado dos veces. */
export function validarInvitacion(b: BorradorInvitacion, cuentas: readonly Pick<Cuenta, "email">[], preparadas: readonly Pick<Invitacion, "correo">[]): string | null {
  const correo = normalizarCorreo(b.correo);
  if (!correo) return "Escribe el correo de la persona.";
  if (correo.length > 254 || !FORMA_CORREO.test(correo)) return "Revisa el correo: le falta algo.";
  if (cuentas.some((c) => normalizarCorreo(c.email) === correo)) return "Ese correo ya tiene cuenta para entrar.";
  if (preparadas.some((p) => p.correo === correo)) return "Ya hay una invitación preparada para ese correo.";
  return null;
}

export function crearInvitacion(b: BorradorInvitacion, ahora = new Date()): Invitacion {
  return { correo: normalizarCorreo(b.correo), papel: b.papel, asesorId: b.papel === "asesor" && b.asesorId ? b.asesorId : null, preparada: ahora.toISOString() };
}

/** Fichas a las que se puede invitar a alguien: activas, sin cuenta ligada y sin invitación preparada. */
export function fichasParaInvitar<A extends { id: string; nombre: string; activo?: boolean }>(
  asesores: readonly A[], conCuenta: ReadonlySet<string>, preparadas: readonly Pick<Invitacion, "asesorId">[],
): A[] {
  const apartadas = new Set(preparadas.map((p) => p.asesorId).filter(Boolean));
  return asesores.filter((a) => a.activo !== false && !conCuenta.has(a.id) && !apartadas.has(a.id)).sort((x, y) => x.nombre.localeCompare(y.nombre, "es-MX"));
}

/** «Asesor · Mariana Estrada» o «Director». */
export function resumenInvitacion(i: Pick<Invitacion, "papel" | "asesorId">, nombreFicha: (id: string) => string | undefined): string {
  if (i.papel === "director") return "Director · ve todo";
  const nombre = i.asesorId ? nombreFicha(i.asesorId) : undefined;
  return nombre ? `Asesor · entra como ${nombre}` : "Asesor · sin ficha todavía";
}

// ── Orden del equipo (solo presentación, DECISIONES «Arrastrar y soltar»: no cambia permisos) ──
export const CLAVE_ORDEN_EQUIPO = "fortius-panel-orden-equipo";
export const ordenEquipoGuardado = <A extends { id: string }>(base: readonly A[], guardado: string | null | undefined): A[] =>
  aplicarOrden(base, leerOrdenGuardado(guardado), (a) => a.id);
export const escribirOrdenEquipo = (lista: readonly { id: string }[]): string => JSON.stringify(lista.map((a) => a.id));
