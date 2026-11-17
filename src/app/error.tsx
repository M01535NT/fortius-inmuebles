"use client";

import { useEffect } from "react";
import { DocumentLink } from "@/components/navigation/document-link";
import { CabezaPagina } from "@/components/sitio/pagina";

/* Error de carga, Fortius II (etapa 7, 17/11/2026): dice qué pasó y deja reintentar. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[public-page] No se pudo completar la carga.");
  }, [error]);

  return (
    <main className="s-pagina">
      <CabezaPagina titulo="No pudimos cargar esta página." entrada="La información no se mostró como vacía. Intenta cargarla nuevamente en unos momentos.">
        <button type="button" onClick={reset} className="s-btn s-btn-relleno">Reintentar</button>
        <DocumentLink href="/" className="s-btn s-btn-contorno">Volver al inicio</DocumentLink>
      </CabezaPagina>
    </main>
  );
}
