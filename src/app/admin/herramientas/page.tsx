"use client";
import * as React from "react";
import { RouteTabs } from "@/components/admin/workspace/route-tabs";
import { AppsCatalog } from "@/components/admin/apps/catalog";
import { DocumentBrowser } from "@/components/admin/workspace/document-browser";
import { PageHeader } from "@/components/admin/ui";

export default function HerramientasPage() {
  return <React.Suspense fallback={null}>
    <RouteTabs label="Herramientas y documentos" idPrefix="herramientas" tabs={[
      { id: "herramientas", label: "Herramientas", render: () => <AppsCatalog /> },
      { id: "documentos", label: "Documentos", render: () => <div className="space-y-6">
        <PageHeader title="Documentos" description="Busca por folio o formato los documentos de todas las operaciones y abre cada uno dentro de su operación." />
        <DocumentBrowser />
      </div> },
    ]} />
  </React.Suspense>;
}
