import type { Seccion } from "@/lib/panel/secciones";

import { Icono } from "./icons";

/** Pantalla provisional de una sección que todavía no se construye. Dice qué es y en qué etapa llega (PLAN.md). */
export function PaginaEtapa({ seccion }: { seccion: Seccion }) {
  return (
    <div className="pn-pagina">
      <h1 className="pn-h1">{seccion.nombre}</h1>
      <p className="pn-sub">{seccion.resumen}</p>
      <div className="pn-tarjeta" style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, padding: 20 }}>
        <Icono nombre={seccion.icono} tamano={32} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="pn-etiqueta" style={{ alignSelf: "flex-start" }}>Pronto</span>
          <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>El panel nuevo se construye por etapas. Esta pantalla todavía no trabaja con datos reales; mientras tanto se sigue usando el panel de siempre.</span>
        </div>
      </div>
    </div>
  );
}
