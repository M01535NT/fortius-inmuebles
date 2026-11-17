import type { Seccion } from "@/lib/panel/secciones";

import { Icono } from "./icons";

/** Pantalla de una sección que todavía no se construye: su nombre y en qué etapa de PLAN.md llega. */
export function PaginaEtapa({ seccion }: { seccion: Seccion }) {
  return (
    <div className="pn-pagina" style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pn-encabezado"><div><h1 className="pn-h1">{seccion.nombre}</h1></div></div>
      <div className="pn-vacio">
        <Icono nombre={seccion.icono} tamano={28} />
        <b style={{ color: "var(--ink)", fontWeight: 600 }}>{seccion.resumen}</b>
        <span style={{ fontSize: 13 }}>Llega en la etapa {seccion.etapa}.</span>
      </div>
    </div>
  );
}
