"use client";
import { useEffect } from "react";

import { EstadoError } from "@/components/panel/kit/estados";

/** Error de una pantalla del panel nuevo: dice qué pasó y deja reintentar; no muestra detalles técnicos. */
export default function ErrorPanel({ error, retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  useEffect(() => { console.error("[panel] Error de pantalla.", error.digest ?? ""); }, [error]);
  return (
    <div className="pn-pagina">
      <EstadoError titulo="No pudimos abrir esta pantalla" texto="Tus datos están a salvo. Vuelve a intentarlo; si sigue igual, avísale a dirección." alReintentar={retry ?? reset} />
    </div>
  );
}
