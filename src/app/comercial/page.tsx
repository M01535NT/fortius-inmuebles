import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { SegmentDetail } from "@/components/sections/segment-detail";
import { routePages } from "@/data/site";
import { segmentLinks } from "@/data/segment-links";

export const metadata: Metadata = {
  alternates: { canonical: "/comercial" },
  title: "Comercial",
  description: routePages.comercial.description,
};

export default function ComercialPage() {
  return <main className="pg-page">
    <InteriorPage {...routePages.comercial} eyebrow="Comercial" title="Locales y oficinas para tu negocio." siblings={segmentLinks("/comercial")}
      media={{ src: "/hero/plaza.webp", alt: "Plaza comercial iluminada al anochecer" }}
      primary={{ href: "/inventario?tipo=local", label: "Ver locales y oficinas" }} secondary={{ href: "/contacto", label: "Consultar un caso" }} />
    <SegmentDetail segment="comercial" />
  </main>;
}
