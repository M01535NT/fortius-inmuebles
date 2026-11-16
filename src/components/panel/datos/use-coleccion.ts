"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { borrarRegistro, ErrorDeLectura, guardarRegistro, leerRegistros, type NombreColeccion } from "@/lib/panel/datos/colecciones";

type Fila<T> = { id: string; data: T };
type Estado<T> = { cargando: boolean; error: string | null; filas: Fila<T>[] };
type Opciones = {
  /** Vuelve a leer en silencio al regresar a la ventana y cada tantos milisegundos (AUD-03, M8). */
  refrescarCada?: number;
};

/**
 * Carga una colección del servidor. Un solo estado: cargando, error o datos.
 * `guardar(id, data)` escribe con la versión que se leyó; si alguien guardó antes (409), relee y lanza el error para avisarlo.
 */
export function useColeccion<T>(nombre: NombreColeccion, opciones: Opciones = {}) {
  const [estado, setEstado] = useState<Estado<T>>({ cargando: true, error: null, filas: [] });
  const [intento, setIntento] = useState(0);
  const versiones = useRef(new Map<string, number>());
  const { refrescarCada } = opciones;

  useEffect(() => {
    const control = new AbortController();
    leerRegistros<T>(nombre, control.signal).then(
      (registros) => {
        versiones.current = new Map(registros.map((r) => [r.id, r.version]));
        setEstado({ cargando: false, error: null, filas: registros.map((r) => ({ id: r.id, data: r.data })) });
      },
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const texto = e instanceof Error ? e.message : "No se pudo cargar la lista.";
        // Si ya había datos (una lectura en silencio que falló), se conservan y no se muestra error.
        setEstado((s) => (s.filas.length ? { ...s, cargando: false } : { cargando: false, error: texto, filas: [] }));
      },
    );
    return () => control.abort();
  }, [nombre, intento]);

  useEffect(() => {
    if (!refrescarCada) return;
    const releer = () => { if (document.visibilityState === "visible") setIntento((n) => n + 1); };
    const t = window.setInterval(releer, refrescarCada);
    window.addEventListener("focus", releer);
    return () => { window.clearInterval(t); window.removeEventListener("focus", releer); };
  }, [refrescarCada]);

  const reintentar = useCallback(() => {
    setEstado((s) => ({ ...s, cargando: true, error: null }));
    setIntento((n) => n + 1);
  }, []);

  const guardar = useCallback(async (id: string, data: T): Promise<T> => {
    const version = versiones.current.get(id) ?? null;
    try {
      const r = await guardarRegistro<T>(nombre, id, data, version);
      versiones.current.set(r.id, r.version);
      setEstado((s) => {
        const existe = s.filas.some((f) => f.id === r.id);
        const filas = existe ? s.filas.map((f) => (f.id === r.id ? { id: r.id, data: r.data } : f)) : [{ id: r.id, data: r.data }, ...s.filas];
        return { ...s, filas };
      });
      return r.data;
    } catch (e) {
      if (e instanceof ErrorDeLectura && e.estado === 409) setIntento((n) => n + 1);
      throw e;
    }
  }, [nombre]);

  /** Quita el registro con la versión leída; si cambió (409), relee y lanza el error. */
  const borrar = useCallback(async (id: string): Promise<void> => {
    try {
      await borrarRegistro(nombre, id, versiones.current.get(id) ?? null);
      versiones.current.delete(id);
      setEstado((s) => ({ ...s, filas: s.filas.filter((f) => f.id !== id) }));
    } catch (e) {
      if (e instanceof ErrorDeLectura && e.estado === 409) setIntento((n) => n + 1);
      throw e;
    }
  }, [nombre]);

  /** Versión leída de un registro (para rutas que la piden aparte, como convertir una consulta). */
  const versionDe = useCallback((id: string): number | null => versiones.current.get(id) ?? null, []);

  const datos = useMemo(() => estado.filas.map((f) => f.data), [estado.filas]);
  return { cargando: estado.cargando, error: estado.error, datos, reintentar, guardar, borrar, versionDe };
}
