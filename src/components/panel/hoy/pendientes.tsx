"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { leerMovimientos, sinMovimientosEnServidor, type Movimiento } from "@/lib/panel/datos/movimientos";
import { rutaTramite, tonoTramite, tramitesDeHoy } from "@/lib/panel/datos/hoy-pendientes";
import { NOMBRE_GRUPO } from "@/lib/panel/datos/tramites";
import type { Tramite } from "@/lib/tramites";

/** Trámites que esperan una respuesta que ya toca pedir (AUD-05). Bloque propio: si falla, lo demás de Hoy sigue. */
export function useTramitesDeHoy(hoy: string) {
  const tramites = useColeccion<Tramite>("tramites", { refrescarCada: 90_000 });
  const personas = useColeccion<Cliente>("clientes");
  const filas = useMemo(() => tramitesDeHoy(tramites.datos, personas.datos, hoy), [tramites.datos, personas.datos, hoy]);
  const tonos = useMemo(() => Object.fromEntries(tramites.datos.map((t) => [t.id, tonoTramite(t, hoy)])), [tramites.datos, hoy]);
  return { cargando: tramites.cargando, error: tramites.error, reintentar: tramites.reintentar, filas, tonos, datos: tramites.datos };
}

/**
 * Movimientos de Dinero para sus vencimientos (comisiones y gastos por cobrar). Mientras falte la tabla el servidor
 * responde 503: entonces no se muestra nada, ni error (DECISIONES, Dinero). Bloque propio con su reintento.
 */
export function useMovimientosQueVencen() {
  const [estado, setEstado] = useState<{ error: string | null; datos: Movimiento[] }>({ error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    leerMovimientos(c.signal).then(
      (datos) => setEstado({ error: null, datos }),
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setEstado({ error: sinMovimientosEnServidor(e) ? null : e instanceof Error ? e.message : "No se pudieron leer los cobros.", datos: [] });
      },
    );
    return () => c.abort();
  }, [intento]);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { ...estado, reintentar };
}

export function TramitesDeHoy({ estado }: { estado: ReturnType<typeof useTramitesDeHoy> }) {
  if (estado.cargando) return <Cargando lineas={2} etiqueta="Cargando los trámites" />;
  if (estado.error) return <EstadoError titulo="No se pudieron leer los trámites" texto={estado.error} alReintentar={estado.reintentar} />;
  if (!estado.filas.length) return null;
  return (
    <GrupoLista titulo={`${NOMBRE_GRUPO.hoy} · ${estado.filas.length}`}>
      {estado.filas.map((f) => (
        <Fila key={f.id} href={rutaTramite(f.id)} titulo={f.titulo} subtitulo={f.linea} detalle={f.estado} tonoDetalle={estado.tonos[f.id] ?? "aviso"} />
      ))}
    </GrupoLista>
  );
}

/**
 * Asuntos para Hoy («Asuntos en curso», el contexto de las tareas y las fechas clave), con personas e inmuebles.
 * Bloque propio con su reintento. Lo que se debe ya no va en Hoy (titular, 16/11/2026): se ve en Dinero.
 */
export function useAsuntosDeHoy() {
  const [estado, setEstado] = useState<{ cargando: boolean; error: string | null; expedientes: Expediente[] }>({ cargando: true, error: null, expedientes: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then(
      (expedientes) => setEstado({ cargando: false, error: null, expedientes }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudieron leer los asuntos.", expedientes: [] }); },
    );
    return () => c.abort();
  }, [intento]);
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const reintentar = useCallback(() => { setEstado((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }, []);
  return { cargando: estado.cargando, error: estado.error, reintentar, expedientes: estado.expedientes, personas: personas.datos, inmuebles: inmuebles.datos };
}
