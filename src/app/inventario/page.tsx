import type { Metadata } from "next";

import { InventoryExplorer } from "@/components/property/inventory-explorer";
import { getPropiedades } from "@/lib/inventario";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/inventario",
  title: "Inventario",
  description:
    "Propiedades en venta y renta con características, precio y condiciones publicadas por cada inmueble.",
});

/* El inventario publicado del panel MNT se consulta en cada solicitud. */
export const revalidate = 0;

/* Dirección «Nocturno» (boceto InventarioNocturno): cabecera oscura con los
   filtros y resultados en rejilla o con mapa por zona. */
export default async function InventarioPage() {
  const propiedades = await getPropiedades();

  return (
    <main className="pg-page inv-page">
      <InventoryExplorer propiedades={propiedades} />
    </main>
  );
}
