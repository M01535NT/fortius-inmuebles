"use client";
import * as React from "react";
import type { InboxRead } from "@/lib/admin/inbox";
import { apiRequest, onAdminCacheClear, useSession } from "@/lib/admin/store";

/*
  Preferencias del usuario en el servidor (UX-02, RP-14; UX-05). Se piden una vez por sesión y las
  comparten todas las pantallas. Lo que el usuario acomoda (vista de Operaciones, filas o tarjetas
  en Inmuebles, vistas guardadas) se ve al instante y se guarda en el servidor; si el servidor lo
  rechaza, vuelve a como estaba y la pantalla avisa (RP-18). Lo que antes vivía en este navegador
  se sube la primera vez y se borra de aquí.
*/
export type PanelPreferences = {
  operacionesVista?: "lista" | "tablero";
  inmueblesVista?: "filas" | "tarjetas";
  vistasInventario?: Array<{ name: string; filters: Record<string, string> }>;
  recientes?: string[];
  atajos?: boolean;
};
export type UserPreferences = { bandeja?: { leidos?: InboxRead }; panel?: PanelPreferences };
type State = { session: string; data: UserPreferences | null } | undefined; // null: no se pudo consultar
type Stored = { preferencias?: { data?: UserPreferences } };

let state: State;
let pending: { session: string; request: Promise<void> } | undefined;
const listeners = new Set<() => void>();
const set = (next: State) => { state = next; listeners.forEach(fn => fn()); };
const adopt = (session: string, result: Stored) => { if (result.preferencias?.data && (!state || state.session === session)) set({ session, data: result.preferencias.data }); };

function load(session: string) {
  if (pending?.session === session) return pending.request;
  const request = apiRequest<Stored>("/api/admin/preferencias")
    .then(result => { if (pending?.session === session) set({ session, data: result.preferencias?.data ?? {} }); })
    .catch(() => { if (pending?.session === session) set({ session, data: null }); });
  pending = { session, request };
  return request;
}
export function resetPreferences() { state = undefined; pending = undefined; listeners.forEach(fn => fn()); }
onAdminCacheClear(resetPreferences);

/** Las preferencias de la sesión: `undefined` mientras llegan, `null` si no se pudieron consultar. */
export function usePreferences(): UserPreferences | null | undefined {
  const key = useSession()?.id ?? "";
  const current = React.useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state, () => undefined);
  React.useEffect(() => { if (key) void load(key); }, [key]);
  return current?.session === key ? current.data : undefined;
}

/** Marca avisos de «Para ti» como leídos; cuenta solo cuando el servidor lo confirma. */
export async function markInboxRead(session: string, keys: string[]) {
  adopt(session, await apiRequest<Stored>("/api/admin/preferencias", "POST", { claves: keys }));
}

/** Guarda una preferencia del panel. Se ve al instante; si el servidor la rechaza, regresa y lanza el error. */
export async function savePanel(session: string, patch: PanelPreferences) {
  const before = state?.session === session ? state.data : undefined;
  if (before) set({ session, data: { ...before, panel: { ...before.panel, ...patch } } });
  try { adopt(session, await apiRequest<Stored>("/api/admin/preferencias", "PATCH", { panel: patch })); }
  catch (error) { if (state?.session === session && before) set({ session, data: before }); throw error; }
}

function readLegacy(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function dropLegacy(key: string) { try { localStorage.removeItem(key); } catch { /* sin almacenamiento local no hay nada que borrar */ } }

/**
 * Una preferencia del panel guardada en el servidor. `legacy` es la llave con que este navegador la
 * guardaba antes: si el servidor todavía no la tiene, se sube una vez y se borra del navegador.
 */
export function usePanelPreference<K extends keyof PanelPreferences>(name: K, fallback: NonNullable<PanelPreferences[K]>, legacy?: { key: string; parse: (raw: string) => PanelPreferences[K] | undefined }) {
  const session = useSession()?.id ?? "";
  const prefs = usePreferences();
  const stored = prefs?.panel?.[name];
  const [error, setError] = React.useState("");
  const migrating = React.useRef(false);
  React.useEffect(() => {
    if (!legacy || !session || !prefs || stored !== undefined || migrating.current) return;
    const raw = readLegacy(legacy.key);
    const value = raw === null ? undefined : legacy.parse(raw);
    if (value === undefined) return;
    migrating.current = true;
    savePanel(session, { [name]: value } as PanelPreferences).then(() => dropLegacy(legacy.key), () => undefined).finally(() => { migrating.current = false; });
  }, [legacy, session, prefs, stored, name]);
  // Lo elegido se ve al instante aunque las preferencias todavía no lleguen; se suelta al confirmar o al fallar.
  const [shown, setShown] = React.useState<{ value: NonNullable<PanelPreferences[K]> }>();
  const save = React.useCallback(async (next: NonNullable<PanelPreferences[K]>) => {
    setError(""); setShown({ value: next });
    if (!session) return false;
    try { await savePanel(session, { [name]: next } as PanelPreferences); setShown(undefined); return true; }
    catch { setShown(undefined); setError("No se pudo guardar tu preferencia. Revisa tu conexión y vuelve a intentarlo."); return false; }
  }, [session, name]);
  return { value: (shown?.value ?? stored ?? fallback) as NonNullable<PanelPreferences[K]>, save, error, loaded: prefs !== undefined };
}
