"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  CATALOGOS, etiquetaDe, ofrecidos, opcionesDe, significadoDe,
  type Catalogo, type Catalogos, type ClaveCatalogo, type Opcion, type ValorCatalogo,
} from "@/lib/backend/catalogos-contrato";
import { CATALOGOS_INICIALES, leerCatalogos } from "@/lib/panel/catalogos";

/**
 * Los catálogos para todo el panel (SPEC.md, sección 3): las listas desplegables y los nombres de cada valor salen de aquí.
 * Se cargan una vez al entrar y se guardan en este navegador, para que la siguiente vez los nombres estén desde el
 * primer momento. Mientras llegan la primera vez, y si la base no responde, se usan los valores con que empezó el panel
 * (los mismos que carga la base): nada se frena, y un aviso abajo dice que las listas pueden no estar al día.
 */
const CLAVE_GUARDADO = "fortius-catalogos";
const AVISO = "catalogos-sin-base";

const INICIAL: Catalogos = Object.fromEntries(CATALOGOS_INICIALES.map((c) => [c.clave, c])) as Catalogos;
/** Lo que falte (un catálogo que la base aún no tiene) se completa con el de inicio. */
const completar = (c: Catalogos): Catalogos => {
  const mapa = { ...c };
  for (const clave of CATALOGOS) if (!mapa[clave]) mapa[clave] = INICIAL[clave];
  return mapa;
};

type Estado = {
  catalogos: Catalogos; cargando: boolean; error: string | null;
  /** Las listas en pantalla son las de inicio o las últimas guardadas en este navegador, no las de la base: no se cambian. */
  sinBase: boolean;
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
  const [catalogos, setCatalogos] = useState<Catalogos>(INICIAL);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinBase, setSinBase] = useState(true);
  const conGuardado = useRef(false);
  const reintentar = useRef<() => void>(() => undefined);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      const lista = await leerCatalogos();
      const mapa = completar(Object.fromEntries(lista.map((c) => [c.clave, c])) as Catalogos);
      setCatalogos(mapa);
      guardar(mapa);
      setError(null);
      setSinBase(false);
      toast.dismiss(AVISO);
    } catch (e) {
      const motivo = e instanceof Error ? e.message : "No se pudieron leer las listas.";
      setError(motivo);
      setSinBase(true);
      // Se ve en cualquier pantalla, no solo en Configuración: las listas siguen, pero pueden no estar al día.
      toast(conGuardado.current
        ? "No se pudieron leer las listas. Se usan las últimas que se vieron en este equipo."
        : "No se pudieron leer las listas. Se usan las de inicio del panel.", {
        id: AVISO, duration: 15000, description: motivo,
        action: { label: "Reintentar", onClick: () => reintentar.current() },
      });
    } finally { setCargando(false); }
  }, []);
  useEffect(() => { reintentar.current = () => { void recargar(); }; }, [recargar]);

  useEffect(() => {
    // Lo guardado se pone primero (sin parpadeo de nombres) y luego se trae lo vigente.
    const guardado = leerGuardado();
    if (Object.keys(guardado).length) { conGuardado.current = true; setCatalogos(completar(guardado)); }
    void recargar();
  }, [recargar]);

  const poner = useCallback((c: Catalogo) => {
    setCatalogos((antes) => { const nuevo = { ...antes, [c.clave]: c }; guardar(nuevo); return nuevo; });
  }, []);

  const valor = useMemo(() => ({ catalogos, cargando, error, sinBase, recargar, poner }), [catalogos, cargando, error, sinBase, recargar, poner]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

const SIN_PROVEEDOR: Estado = { catalogos: INICIAL, cargando: false, error: null, sinBase: true, recargar: async () => undefined, poner: () => undefined };

/** Las listas y sus nombres. Fuera del panel (pruebas, vistas sueltas) responde con los valores de inicio. */
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
