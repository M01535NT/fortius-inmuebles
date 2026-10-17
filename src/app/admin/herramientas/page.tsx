"use client";
import * as React from "react";
import { RouteTabs } from "@/components/admin/workspace/route-tabs";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { AppsCatalog } from "@/components/admin/apps/catalog";
import { DocumentBrowser } from "@/components/admin/workspace/document-browser";

export default function HerramientasPage() {
  return <GuidedPage title="Herramientas" subtitle="Para preparar, analizar y acompañar cada operación. Dentro de cada operación aparecen las de su etapa.">
    <React.Suspense fallback={null}>
      <RouteTabs label="Herramientas y documentos" idPrefix="herramientas" tabs={[
        { id: "herramientas", label: "Herramientas", render: () => <AppsCatalog /> },
        { id: "documentos", label: "Documentos", render: () => <div className="flex flex-col gap-5">
          <p className="text-muted-foreground">Busca por folio o formato los documentos de todas las operaciones y abre cada uno dentro de su operación.</p>
          <DocumentBrowser />
        </div> },
      ]} />
    </React.Suspense>
  </GuidedPage>;
}
