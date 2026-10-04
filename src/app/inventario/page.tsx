import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { InventoryExplorer } from "@/components/property/inventory-explorer";
import { SectionHeading } from "@/components/sections/section-heading";
import { getPropiedades } from "@/lib/inventario";

export const metadata: Metadata = {
  alternates: { canonical: "/inventario" },
  title: "Inventario",
  description:
    "Propiedades en venta y renta con características, precio y condiciones publicadas por cada inmueble.",
};

/* El inventario publicado del panel MNT se consulta en cada solicitud. */
export const revalidate = 0;

export default async function InventarioPage() {
  const propiedades = await getPropiedades();

  return (
    <main className="bg-background pb-24 pt-32 md:pb-0">
      <Container className="pb-16 md:pb-24">
        <SectionHeading
          level="h1"
          eyebrow="Inventario"
          title="Propiedades."
          description="Consulta las características de cada inmueble y pregunta por su disponibilidad, documentos y condiciones antes de decidir."
        />
        <div className="mt-12">
          <InventoryExplorer propiedades={propiedades} />
        </div>
      </Container>
    </main>
  );
}
