"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  etiquetaDe, ofrecidos, opcionesDe, significadoDe,
  type Catalogo, type Catalogos, type ClaveCatalogo, type Opcion, type ValorCatalogo,
} from "@/lib/backend/catalogos-contrato";
import { leerCatalogos } from "@/lib/panel/catalogos";

/**
 * Los catálogos para todo el panel (SPEC.md, sección 3): las listas desplegables y los nombres de cada valor salen de aquí.
 * Se cargan una vez al entrar y se guardan en este navegador, para que la siguiente vez los nombres estén desde el
 * primer momento. Mientras llegan la primera vez, cada valor se ve con su clave escrita en bonito («En marcha»).
 */
const CLAVE_GUARDADO = "fortius-catalogos";

type Estado = {
  catalogos: Catalogos; cargando: boolean; error: string | null;
  recargar: () => Promise<void>;
  /** Pone un catálogo ya cambiado (después de guardar en Configuración), sin volver a pedirlos todos. */
  poner: (c: Catalogo) => void;
};

const Contexto = createContext<Estado | null>(null);

function leerGuardado(): Catalogos {
  try {
    const t = window.localStorage.getItem(CLAVE_GUARDADO);
    const lista = t ? (JSON.parse(t) as Catalogo[]) : [];
    return Array.isArray(lista) ? (Object.fromEntries(lista.map((c) => [c.clave, c])) as Catalogos) : {};
  } catch { return {}; }
}
function guardar(c: Catalogos) {
  try { window.localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(Object.values(c))); } catch { /* sin almacenamiento: se piden cada vez */ }
}

export function ProveedorCatalogos({ children }: { children: ReactNode }) {
  const [catalogos, setCatalogos] = useState<Catalogos>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await leerCatalogos();
      const mapa = Object.fromEntries(lista.map((c) => [c.clave, c])) as Catalogos;
      setCatalogos(mapa);
      guardar(mapa);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron leer las listas.");
    } finally { setCargando(false); }
  }, []);

  useEffect(() => {
    // Lo guardado se pone primero (sin parpadeo de nombres) y luego se trae lo vigente.
    const guardado = leerGuardado();
    if (Object.keys(guardado).length) setCatalogos(guardado);
    void recargar();
  }, [recargar]);

  const poner = useCallback((c: Catalogo) => {
    setCatalogos((antes) => { const nuevo = { ...antes, [c.clave]: c }; guardar(nuevo); return nuevo; });
  }, []);

  const valor = useMemo(() => ({ catalogos, cargando, error, recargar, poner }), [catalogos, cargando, error, recargar, poner]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

const SIN_PROVEEDOR: Estado = { catalogos: {}, cargando: false, error: null, recargar: async () => undefined, poner: () => undefined };

/** Las listas y sus nombres. Fuera del panel (pruebas, vistas sueltas) responde con las claves escritas en bonito. */
export function useCatalogos() {
  const e = useContext(Contexto) ?? SIN_PROVEEDOR;
  const { catalogos } = e;
  return useMemo(() => ({
    ...e,
    /** El nombre que se ve de un valor guardado. */
    etiqueta: (cat: ClaveCatalogo, clave: string | null | undefined) => etiquetaDe(catalogos[cat], clave),
    /** Las opciones de una lista desplegable, con lo que la fila ya tiene aunque esté desactivado. */
    opciones: (cat: ClaveCatalogo, actual?: string | readonly string[] | null): Opcion[] => opcionesDe(catalogos[cat], actual),
    /** Lo que se ofrece, con su significado y su padre (para agrupar o filtrar). */
    ofrecidos: (cat: ClaveCatalogo): ValorCatalogo[] => ofrecidos(catalogos[cat]),
    significado: (cat: ClaveCatalogo, clave: string | null | undefined) => significadoDe(catalogos[cat], clave),
  }), [e, catalogos]);
}

/** Lo que devuelve useCatalogos, para las funciones que arman textos fuera de un componente. */
export type LectorCatalogos = ReturnType<typeof useCatalogos>;
