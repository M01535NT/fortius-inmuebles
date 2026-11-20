import type { Seccion } from "@/lib/panel/secciones";

import { Icono } from "./icons";
import "./asunto/asunto.css";
import "./asunto/vistas.css";

/**
 * Pantalla de una sección que todavía no se construye, con el marco del modelo visual: barra de 52 px con su nombre y,
 * al centro, qué será y en qué etapa de PLAN.md llega.
 */
export function PaginaEtapa({ seccion }: { seccion: Seccion }) {
  return (
    <div className="as-vista">
      <header className="as-vbar"><h1 className="as-h1-lista">{seccion.nombre}</h1></header>
      <div className="as-in as-elige">
        <Icono nombre={seccion.icono} tamano={28} />
        <b>{seccion.resumen}</b>
        <p className="as-m">Llega en la etapa {seccion.etapa}.</p>
      </div>
    </div>
  );
}
