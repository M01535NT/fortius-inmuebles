import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";
import { LeadMagnet } from "@/components/sections/lead-magnet";
import { SellerProcess } from "@/components/sections/seller-process";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/vender-propiedad" },
  title: "Vender inmueble",
  description: routePages.vender.description,
};

export default function VenderInmueblePage() {
  return (
    <>
      <InteriorPage {...routePages.vender} primary={{ href: "/vender-propiedad/#diagnostico", label: "Contar mi caso" }} />
      <SellerProcess />
      <LeadMagnet />
      <DiagnosticCTA />
    </>
  );
}
