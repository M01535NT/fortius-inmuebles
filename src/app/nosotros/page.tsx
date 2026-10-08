import type { Metadata } from "next";

import { InstitutionalVideo } from "@/components/sections/institutional-video";
import { InteriorPage } from "@/components/sections/interior-page";
import { EditorialAdvisor } from "@/components/home/editorial-advisor";

export const metadata: Metadata = {
  alternates: { canonical: "/nosotros" },
  title: "Nosotros",
  description:
    "Conoce quién atiende las operaciones inmobiliarias de Fortius y cómo se coordina cada decisión.",
};

export default function NosotrosPage() {
  return (
    <>
      <InteriorPage
        eyebrow="Nosotros"
        title="Conoce a Fortius."
        description="Moisés Núñez Tonalá es tu contacto para coordinar la promoción, las visitas y las propuestas. Tú conservas la decisión sobre el precio y las condiciones de la operación."
        bullets={[
          "Un contacto responsable de tu operación.",
          "Visitas y propuestas coordinadas contigo.",
          "Información pendiente identificada con claridad.",
          "Seguimiento desde la primera conversación hasta el cierre.",
        ]}
      />
      <EditorialAdvisor />
      <InstitutionalVideo />
    </>
  );
}
