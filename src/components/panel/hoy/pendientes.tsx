"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { dinero } from "@/lib/panel/datos/dinero";
import { leerCobros } from "@/lib/panel/datos/dinero-lectura";
import { rutaTramite, teDeben, tonoTramite, tramitesDeHoy, type ResumenTeDeben } from "@/lib/panel/datos/hoy-pendientes";
import { NOMBRE_GRUPO } from "@/lib/panel/datos/tramites";
import type { Tramite } from "@/lib/tramites";

/** Trámites que esperan una respuesta que ya toca pedir (AUD-05). Bloque propio: si falla, lo demás de Hoy sigue. */
export function useTramitesDeHoy(hoy: string) {
  const tramites = useColeccion<Tramite>("tramites", { refrescarCada: 90_000 });
  const personas = useColeccion<Cliente>("clientes");
  const filas = useMemo(() => tramitesDeHoy(tramites.datos, personas.datos, hoy), [tramites.datos, personas.datos, hoy]);
  const tonos = useMemo(() => Object.fromEntries(tramites.datos.map((t) => [t.id, tonoTramite(t, hoy)])), [tramites.datos, hoy]);
  return { cargando: tramites.cargando, error: tramites.error, reintentar: tramites.reintentar, filas, tonos };
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

/** Lo que falta por cobrar (Dinero). Bloque propio con su reintento; si no se debe nada, no aparece. */
export function useTeDeben(hoy: string) {
  const [estado, setEstado] = useState<{ cargando: boolean; error: string | null; expedientes: Expediente[]; cobros: Awaited<ReturnType<typeof leerCobros>> }>({ cargando: true, error: null, expedientes: [], cobros: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([leerExpedientes<Expediente>(c.signal), leerCobros(c.signal)]).then(
      ([expedientes, cobros]) => setEstado({ cargando: false, error: null, expedientes, cobros }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudo leer lo que te deben.", expedientes: [], cobros: [] }); },
    );
    return () => c.abort();
  }, [intento]);
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const resumen = useMemo<ResumenTeDeben | null>(() => {
    const asuntos = filasAsuntos(estado.expedientes, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy });
    return teDeben(estado.expedientes, asuntos, estado.cobros);
  }, [estado.expedientes, estado.cobros, personas.datos, inmuebles.datos, hoy]);
  const reintentar = useCallback(() => { setEstado((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }, []);
  return { cargando: estado.cargando, error: estado.error, resumen, reintentar };
}

export function LineaTeDeben({ estado }: { estado: ReturnType<typeof useTeDeben> }) {
  if (estado.error) return <EstadoError titulo="No se pudo leer lo que te deben" texto={estado.error} alReintentar={estado.reintentar} />;
  const r = estado.resumen;
  if (estado.cargando || !r) return null;
  return (
    <Link href="/panel/dinero" className="pn-tarjeta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", minHeight: 44, textDecoration: "none", color: "inherit" }}>
      <span style={{ display: "grid", gap: 2 }}>
        <span style={{ fontWeight: 600 }}>Te deben {dinero(r.total)}</span>
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{r.asuntos === 1 ? "En 1 asunto" : `En ${r.asuntos} asuntos`}</span>
      </span>
      <span style={{ fontWeight: 600, color: "var(--accent)" }}>Ver dinero</span>
    </Link>
  );
}
