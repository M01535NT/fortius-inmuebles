"use client";
import { useEffect, useState } from "react";

import type { Cliente } from "@/lib/backend/contracts";
import { leerDirectorio, type PersonaDirectorio } from "@/lib/panel/biblioteca";

/**
 * La persona como la muestran la Agenda y Trámites: la ficha del Directorio (lo que se elige hoy) o, en citas y trámites
 * de antes, el cliente del panel provisional, solo para mostrar su nombre.
 */
export type PersonaVista = { id: string; nombre: string; telefono: string; email: string; delDirectorio: boolean; archivada: boolean };

export const vistaDeDirectorio = (p: PersonaDirectorio): PersonaVista => ({
  id: p.id, nombre: p.nombre.trim(), telefono: p.telefonos[0] ? `${p.telefonos[0].pais} ${p.telefonos[0].numero}`.trim() : "",
  email: p.correo ?? "", delDirectorio: true, archivada: Boolean(p.archivada_el),
});
export const vistaDeCliente = (c: Cliente): PersonaVista => ({
  id: c.id, nombre: c.nombre?.trim() ?? "", telefono: c.telefono ?? "", email: c.email ?? "", delDirectorio: false, archivada: false,
});

/** El Directorio completo (también las archivadas, para poder mostrarlas), leído una vez. Si falla, queda vacío. */
export function useDirectorio(): PersonaVista[] {
  const [lista, setLista] = useState<PersonaVista[]>([]);
  useEffect(() => {
    let vivo = true;
    leerDirectorio({ ver: "todas" }).then((x) => { if (vivo) setLista(x.map(vistaDeDirectorio)); }, () => undefined);
    return () => { vivo = false; };
  }, []);
  return lista;
}

/** Opciones para elegir: las activas por nombre; una archivada solo si ya estaba elegida. */
export function opcionesPersona(lista: readonly PersonaVista[], actual?: string) {
  return lista
    .filter((p) => !p.archivada || p.id === actual)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((p) => ({ valor: p.id, etiqueta: p.nombre || p.telefono || "Sin nombre" }));
}

/** La persona de una cita o un trámite: primero la del Directorio; si no tiene, el cliente de antes. */
export function personaDe(
  r: { personaId?: string; clienteId?: string }, directorio: readonly PersonaVista[], clientes: readonly Cliente[],
): PersonaVista | null {
  if (r.personaId) return directorio.find((p) => p.id === r.personaId) ?? null;
  const c = r.clienteId ? clientes.find((x) => x.id === r.clienteId) : undefined;
  return c ? vistaDeCliente(c) : null;
}

export const rutaPersona = (p: PersonaVista) => p.delDirectorio
  ? `/panel/directorio?id=${encodeURIComponent(p.id)}`
  : `/panel/directorio?q=${encodeURIComponent(p.nombre || p.telefono)}`;
