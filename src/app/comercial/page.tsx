import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { SegmentDetail } from "@/components/sections/segment-detail";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/comercial" },
  title: "Comercial",
  description: routePages.comercial.description,
};

export default function ComercialPage() {
  return <><InteriorPage {...routePages.comercial} primary={{ href: "/inventario", label: "Ver propiedades" }} secondary={{ href: "/contacto", label: "Consultar un caso" }} /><SegmentDetail segment="comercial" /></>;
}
