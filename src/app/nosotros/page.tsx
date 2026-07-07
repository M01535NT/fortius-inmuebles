import type { Metadata } from "next";

import { InstitutionalVideo } from "@/components/sections/institutional-video";
import { InteriorPage } from "@/components/sections/interior-page";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Firma inmobiliaria enfocada en método, análisis comercial y acompañamiento profesional.",
};

export default function NosotrosPage() {
  return (
    <>
      <InteriorPage
        eyebrow="Nosotros"
        title="Una firma de método, no de improvisación."
        description="La marca se construye alrededor de proceso, criterio y comunicación clara. No inventamos cifras ni credenciales: mostramos cómo trabajamos."
        bullets={[
          "Claridad antes de tomar decisiones.",
          "Orden documental y comercial.",
          "Seguimiento profesional de prospectos.",
          "Acompañamiento hasta el cierre.",
        ]}
      />
      <InstitutionalVideo />
    </>
  );
}
