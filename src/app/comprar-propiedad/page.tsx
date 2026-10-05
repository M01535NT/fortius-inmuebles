import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { BuyerBrief } from "@/components/sections/buyer-brief";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/comprar-propiedad" },
  title: "Comprar inmueble",
  description: routePages.comprar.description,
};

export default function ComprarInmueblePage() {
  const leadsEnabled = process.env.FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED === "true";
  return <><InteriorPage {...routePages.comprar} primary={{ href: "/comprar-propiedad/#busqueda", label: leadsEnabled ? "Contar qué busco" : "Preparar mi búsqueda" }} secondary={{ href: "/inventario", label: "Ver propiedades" }} /><BuyerBrief /></>;
}
