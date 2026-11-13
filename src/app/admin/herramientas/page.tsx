"use client";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { AppsCatalog } from "@/components/admin/apps/catalog";

/*
  Herramientas (SIM-15, C45): solo el catálogo. La pestaña «Documentos» se retiró: un folio se
  busca con el buscador del panel y los documentos se abren desde su operación.
*/
export default function HerramientasPage() {
  return <GuidedPage title="Más" subtitle="Herramientas de trabajo y notas del equipo."><AppsCatalog /></GuidedPage>;
}
