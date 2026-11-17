"use client";
import Link from "next/link";

import { Gesto, Icono } from "@/components/panel/icons";
import { usePorAtender } from "@/components/panel/panel-shell";
import { CONFIGURACION, SECCIONES, type Seccion } from "@/lib/panel/secciones";

/** Orden del boceto «Más»: lo que se usa a diario primero. */
const ORDEN = ["consultas", "dinero", "equipo", "agenda", "formatos", "tramites", "herramientas"] as const;

/** Las descripciones del boceto «Más», más cortas que las del menú. */
const TEXTO: Partial<Record<string, string>> = {
  consultas: "Personas que escriben por el sitio o WhatsApp",
  dinero: "Lo que te deben, apartados en resguardo y cobros",
  equipo: "Temas con # y mensajes directos con tu equipo",
  agenda: "Citas, visitas y vencimientos de los próximos 7 días",
  formatos: "Contratos, recibos y fichas con los datos ya llenos",
  tramites: "Cancelación de hipoteca, escrituración y seguimiento",
  herramientas: "Calculadoras de crédito y de comisión",
  configuracion: "Tu perfil, avisos y equipo",
};

/**
 * «Más» del teléfono (boceto): las secciones que no caben en la barra de abajo, cada una con su descripción.
 * Consultas lleva el número de solicitudes sin responder. El número de Equipo llega con el chat (PN-11).
 */
export function ListaMas() {
  const porAtender = usePorAtender();
  const filas: Seccion[] = [...ORDEN.map((s) => SECCIONES.find((x) => x.slug === s)).filter((x): x is Seccion => Boolean(x)), CONFIGURACION];
  return (
    <div className="pn-tarjeta" style={{ marginTop: 16, overflow: "hidden" }}>
      {filas.map((s, i) => {
        const n = s.slug === "consultas" ? porAtender : 0;
        return (
          <Link key={s.slug} href={s.ruta} className="pn-mas-fila" style={{ borderTop: i ? "1px solid var(--border)" : 0 }}>
            <span className="pn-mas-ic" aria-hidden><Icono nombre={s.icono} tamano={22} /></span>
            <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{s.nombre}</span>
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{TEXTO[s.slug] ?? s.resumen}</span>
            </span>
            {n ? <span className="pn-contador" aria-label={`${n} sin responder`}>{n}</span> : null}
            <Gesto nombre="derecha" tamano={16} />
          </Link>
        );
      })}
    </div>
  );
}
