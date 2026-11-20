"use client";
import { useEffect } from "react";

import { EstadoError } from "@/components/panel/kit/estados";
import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/vistas.css";

/** Error de una pantalla del panel nuevo: dice qué pasó y deja reintentar; no muestra detalles técnicos. */
export default function ErrorPanel({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => { console.error("[panel] Error de pantalla.", error.digest ?? ""); }, [error]);
  return (
    // El marco del modelo visual: barra de 52 px con el aviso y, debajo, qué pasó y «Reintentar».
    <div className="as-vista">
      <header className="as-vbar"><h1 className="as-h1-lista">No se abrió</h1></header>
      <div className="pn-marco-aviso">
        <EstadoError titulo="No pudimos abrir esta pantalla" texto="Tus datos están a salvo. Vuelve a intentarlo; si sigue igual, avísale a dirección." alReintentar={retry ?? reset} />
      </div>
    </div>
  );
}
