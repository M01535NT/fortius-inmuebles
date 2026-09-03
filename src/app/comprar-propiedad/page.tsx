import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/comprar-propiedad" },
  title: "Comprar inmueble",
  description: routePages.comprar.description,
};

export default function ComprarInmueblePage() {
  return <InteriorPage {...routePages.comprar} />;
}
