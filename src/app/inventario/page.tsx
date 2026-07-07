import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { InventoryExplorer } from "@/components/property/inventory-explorer";
import { SectionHeading } from "@/components/sections/section-heading";
import { propiedades } from "@/data/propiedades";

export const metadata: Metadata = {
  title: "Inventario",
  description:
    "Propiedades en venta y renta en Tijuana y Baja California, presentadas con información revisada.",
};

export default function InventarioPage() {
  return (
    <main className="bg-background pb-24 pt-32 md:pb-0">
      <Container className="pb-16 md:pb-24">
        <SectionHeading
          eyebrow="Inventario"
          title="Propiedades."
          description="Cada propiedad publicada pasó por revisión documental y análisis de precio. Lo que ves es información verificada, no promesas."
        />
        <div className="mt-12">
          <InventoryExplorer propiedades={propiedades} />
        </div>
      </Container>
    </main>
  );
}
