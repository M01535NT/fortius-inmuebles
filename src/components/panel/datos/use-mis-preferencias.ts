"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";

import type { PanelPreferences, StoredPreferences } from "@/lib/backend/preferences";
import { pedir } from "@/lib/panel/asuntos/api";

/**
 * Las preferencias de quien entró que lo siguen en cualquier equipo (favoritos, vistas guardadas, lo ya visto de
 * «Para ti»). Se leen una vez y se comparten entre pantallas; un cambio se ve al momento y se guarda en el servidor.
 * Si no se pudo guardar, vuelve a como estaba y avisa con el error.
 */
type Estado = { cargado: boolean; panel: PanelPreferences };
let estado: Estado = { cargado: false, panel: {} };
let pidiendo: Promise<void> | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());
const poner = (e: Estado) => { estado = e; avisar(); };
const SIN_CARGAR: Estado = { cargado: false, panel: {} };

function cargar() {
  pidiendo ??= pedir<{ preferencias: StoredPreferences }>("/api/admin/preferencias")
    .then((r) => poner({ cargado: true, panel: r.preferencias.data.panel ?? {} }), () => poner({ cargado: true, panel: estado.panel }));
  return pidiendo;
}

export async function cambiarMisPreferencias(cambio: PanelPreferences): Promise<void> {
  const antes = estado;
  poner({ ...estado, panel: { ...estado.panel, ...cambio } });
  try {
    const r = await pedir<{ preferencias: StoredPreferences }>("/api/admin/preferencias", "PATCH", { panel: cambio });
    poner({ cargado: true, panel: r.preferencias.data.panel ?? {} });
  } catch (e) {
    poner(antes);
    throw e;
  }
}

export function useMisPreferencias(): Estado & { cambiar: (c: PanelPreferences) => Promise<void> } {
  const suscribir = useCallback((f: () => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; }, []);
  const e = useSyncExternalStore(suscribir, () => estado, () => SIN_CARGAR);
  useEffect(() => { void cargar(); }, []);
  return { ...e, cambiar: cambiarMisPreferencias };
}

export type Favorito = NonNullable<PanelPreferences["favoritos"]>[number];
export type VistaGuardada = NonNullable<PanelPreferences["vistas"]>[number];

/** ¿Está marcado con estrella? Y la función que lo marca o lo quita (los más nuevos arriba). */
export function useFavorito(tipo: Favorito["tipo"], id: string | null | undefined, nombre: string) {
  const { panel, cambiar } = useMisPreferencias();
  const lista = panel.favoritos ?? [];
  const guardado = id ? lista.find((f) => f.tipo === tipo && f.id === id) : undefined;
  const es = Boolean(guardado);
  // Si cambió el nombre, el favorito se pone al día al abrirlo.
  const viejo = Boolean(guardado && nombre.trim() && guardado.nombre !== nombre.trim().slice(0, 200));
  useEffect(() => {
    if (!viejo || !id) return;
    const actual = estado.panel.favoritos ?? [];
    void cambiar({ favoritos: actual.map((f) => (f.tipo === tipo && f.id === id ? { ...f, nombre: nombre.trim().slice(0, 200) } : f)) }).catch(() => undefined);
  }, [viejo, id, tipo, nombre, cambiar]);
  const alternar = useCallback(async () => {
    if (!id) return;
    const actual = estado.panel.favoritos ?? [];
    const siguiente = actual.some((f) => f.tipo === tipo && f.id === id)
      ? actual.filter((f) => !(f.tipo === tipo && f.id === id))
      : [{ tipo, id, nombre: nombre.trim().slice(0, 200) || "Sin nombre" }, ...actual].slice(0, 30);
    await cambiar({ favoritos: siguiente });
  }, [cambiar, id, tipo, nombre]);
  return { es, alternar };
}
