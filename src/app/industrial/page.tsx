import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { SegmentDetail } from "@/components/sections/segment-detail";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/industrial" },
  title: "Industrial",
  description: routePages.industrial.description,
};

export default function IndustrialPage() {
  return <><InteriorPage {...routePages.industrial} primary={{ href: "/inventario", label: "Ver propiedades" }} secondary={{ href: "/contacto", label: "Consultar un caso" }} /><SegmentDetail segment="industrial" /></>;
}
