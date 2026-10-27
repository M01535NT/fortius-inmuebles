import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { SegmentDetail } from "@/components/sections/segment-detail";
import { routePages } from "@/data/site";
import { segmentLinks } from "@/data/segment-links";

export const metadata: Metadata = {
  alternates: { canonical: "/industrial" },
  title: "Industrial",
  description: routePages.industrial.description,
};

export default function IndustrialPage() {
  return <main className="pg-page">
    <InteriorPage {...routePages.industrial} eyebrow="Industrial" title="Inmuebles industriales con revisión previa." siblings={segmentLinks("/industrial")}
      media={{ src: "/hero/nave-tijuana.webp", alt: "Nave industrial en Tijuana" }}
      primary={{ href: "/inventario?tipo=nave-industrial", label: "Ver naves y terrenos" }} secondary={{ href: "/contacto", label: "Consultar un caso" }} />
    <SegmentDetail segment="industrial" />
  </main>;
}
