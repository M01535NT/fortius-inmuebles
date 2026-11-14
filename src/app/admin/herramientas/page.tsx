"use client";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { AppsCatalog, CatalogActions } from "@/components/admin/apps/catalog";

/*
  Herramientas (SIM-15, C45): solo el catálogo. La pestaña «Documentos» se retiró: un folio se
  busca con el buscador del panel y los documentos se abren desde su operación. «Administración»
  va junto al título (dirección B del boceto «Más», 14/11/2026). El título dice lo mismo que su entrada
  del menú, «Herramientas» (C56); «Más» queda solo en la barra inferior del celular.
*/
export default function HerramientasPage() {
  return <GuidedPage title="Herramientas" subtitle="Herramientas para trabajar sin abrir una operación." actions={<CatalogActions />}><AppsCatalog /></GuidedPage>;
}
