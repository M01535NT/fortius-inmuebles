import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { SegmentDetail } from "@/components/sections/segment-detail";
import { routePages } from "@/data/site";
import { segmentLinks } from "@/data/segment-links";

export const metadata: Metadata = {
  alternates: { canonical: "/residencial" },
  title: "Residencial",
  description: routePages.residencial.description,
};

export default function ResidencialPage() {
  return <main className="pg-page">
    <InteriorPage {...routePages.residencial} eyebrow="01 · Residencial" title="Casas y departamentos para vivir." siblings={segmentLinks("/residencial")}
      media={{ src: "/hero/edificio-ciudad.webp", alt: "Torre residencial iluminada de noche" }}
      primary={{ href: "/inventario?tipo=casa", label: "Ver casas y departamentos" }} secondary={{ href: "/comprar-propiedad/#busqueda", label: "Contar qué busco" }} />
    <SegmentDetail segment="residencial" />
  </main>;
}
