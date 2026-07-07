import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";
import { LeadMagnet } from "@/components/sections/lead-magnet";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  title: "Vender inmueble",
  description: routePages.vender.description,
};

export default function VenderInmueblePage() {
  return (
    <>
      <InteriorPage {...routePages.vender} />
      <LeadMagnet />
      <DiagnosticCTA />
    </>
  );
}
