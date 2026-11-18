import type { Metadata } from "next";

import { DocumentLink } from "@/components/navigation/document-link";
import { CabezaPagina } from "@/components/sitio/pagina";

export const metadata: Metadata = { title: "Página no encontrada" };

/* 404, rediseño del sitio (etapa 7, 17/11/2026): la misma cabeza de las páginas interiores. */
export default function NotFound() {
  return (
    <main className="s-pagina">
      <CabezaPagina titulo="Página no encontrada." entrada="La dirección cambió o ya no existe.">
        <DocumentLink href="/" className="s-btn s-btn-relleno">Volver al inicio</DocumentLink>
        <DocumentLink href="/inventario" className="s-btn s-btn-contorno">Ver propiedades</DocumentLink>
      </CabezaPagina>
    </main>
  );
}
