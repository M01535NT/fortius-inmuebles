"use client";
import "../asunto/asunto.css";
import "../asunto/caso.css";
import "../fichas/modelo.css";
import "./equipo.css";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { iniciales } from "@/lib/panel/asuntos/api";
import { leerResumenEquipo, type ResumenEquipo, type ResumenMiembro } from "@/lib/panel/equipo";
import type { Moneda } from "@/lib/panel/inicio";
import { useSession } from "@/lib/panel/legado/sesion";

const dinero = (n: number, m: Moneda) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: m, currencyDisplay: m === "USD" ? "code" : "symbol", maximumFractionDigits: 0 }).format(n);
const cobrar = (c: ResumenMiembro["cobrar"]) => {
  const xs = (Object.entries(c) as [Moneda, number][]).filter(([, n]) => n > 0);
  return xs.length ? xs.map(([m, n]) => dinero(n, m)).join(" + ") : "$0";
};
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Equipo (boceto aprobado), con el orden del modelo visual: barra de 52 px con el título y el cuerpo a la izquierda con
 * una tarjeta por persona. Solo el director. Por cada persona, sus asuntos abiertos, lo de hoy, la semana y lo que falta
 * cobrar; arriba lo vencido, los asuntos sin siguiente paso y las solicitudes del sitio que tiene sin atender.
 */
export function Equipo() {
  const sesion = useSession();
  const director = sesion?.role === "admin";
  const [datos, setDatos] = useState<ResumenEquipo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(() => leerResumenEquipo().then((x) => { setDatos(x); setError(null); },
    (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), []);
  useEffect(() => { if (director) void cargar(); }, [cargar, director]);

  const barra = (
    <div className="cp-barra eq-barra">
      <h1 className="eq-h1">Equipo</h1>
      {datos ? <span className="as-cab-n">{datos.miembros.length}</span> : null}
      <span className="as-sp" />
      <span className="as-m eq-solo"><Icono nombre="escudo" tamano={14} />Solo lo ve el director</span>
    </div>
  );

  if (sesion && !director) {
    return (
      <div className="cp fm-col eq-col">
        {barra}
        <div className="as-vacio">
          <Icono nombre="escudo" tamano={26} /><b>Solo el director ve el Equipo</b>
          <Link className="as-btn" href="/admin"><Icono nombre="casa" tamano={16} />Ir a Inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cp fm-col eq-col">
      {barra}
      {error ? <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{error}</b><button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button></div> : null}
      {!datos && !error ? <div className="as-cargando" aria-label="Cargando"><span /><span /><span /></div> : null}

      {datos?.sin_asignar ? (
        <div className="as-ban as-ban-esp">
          <Icono nombre="globo" tamano={18} />
          <span>{datos.sin_asignar === 1 ? "1 solicitud del sitio espera" : `${datos.sin_asignar} solicitudes del sitio esperan`} a que la pases a alguien.</span>
          <Link className="as-btn" href="/admin">Ver en Inicio</Link>
        </div>
      ) : null}

      {datos?.miembros.map((m) => (
        <section key={m.id} className="fm-grupo" aria-label={m.nombre}>
          <div className="fm-card eq-card">
            <div className="eq-cab">
              <span className="eq-quien">
                <span className="fm-av" aria-hidden>{iniciales(m.nombre)}</span>
                <span className="as-ren-c"><b>{m.nombre}</b><span>{m.director ? "Director" : "Asesor"}</span></span>
              </span>
              <span className="eq-pills">
                {m.vencidas ? <span className="as-pill as-pill-bad"><Icono nombre="alerta" tamano={12} />{plural(m.vencidas, "vencida", "vencidas")}</span> : null}
                {m.sin_paso ? <span className="as-pill as-pill-warn">{m.sin_paso} sin siguiente paso</span> : null}
                {m.solicitudes ? <span className="as-pill as-pill-acc"><Icono nombre="globo" tamano={12} />{plural(m.solicitudes, "solicitud", "solicitudes")}</span> : null}
              </span>
              <Link className="pn-btn eq-ver" href={`/admin/asuntos?de=${m.id}`} aria-label={`Ver los asuntos de ${m.nombre}`}><Icono nombre="asu" tamano={15} />Ver</Link>
            </div>
            <div className="eq-cifras">
              <div className="eq-cifra"><b>{m.asuntos}</b><span>Asuntos</span></div>
              <div className="eq-cifra"><b>{m.hoy}</b><span>Para hoy</span></div>
              <div className="eq-cifra"><b>{m.semana}</b><span>Esta semana</span></div>
              <div className="eq-cifra"><b>{cobrar(m.cobrar)}</b><span>Por cobrar</span></div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
