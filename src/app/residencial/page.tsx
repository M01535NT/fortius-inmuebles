import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { SegmentDetail } from "@/components/sections/segment-detail";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/residencial" },
  title: "Residencial",
  description: routePages.residencial.description,
};

export default function ResidencialPage() {
  return <><InteriorPage {...routePages.residencial} primary={{ href: "/inventario", label: "Ver propiedades" }} secondary={{ href: "/comprar-propiedad/#busqueda", label: "Contar qué busco" }} /><SegmentDetail segment="residencial" /></>;
}
