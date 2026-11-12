import type { Metadata } from "next";

import { DocumentLink } from "@/components/navigation/document-link";

export const metadata: Metadata = { title: "Página no encontrada" };

/* 404 con la misma letra y botones que las páginas interiores. */
export default function NotFound() {
  return (
    <main className="pg-page">
      <section className="pg-hero nf-hero">
        <div className="pg-container pg-hero-body">
          <h1 className="pg-title">Página no encontrada.</h1>
          <p className="pg-lead">La dirección cambió o ya no existe.</p>
          <div className="nf-actions">
            <DocumentLink href="/" className="pg-btn">Volver al inicio</DocumentLink>
            <DocumentLink href="/inventario" className="pg-btn pg-btn-ghost">Ver propiedades</DocumentLink>
          </div>
        </div>
      </section>
    </main>
  );
}
