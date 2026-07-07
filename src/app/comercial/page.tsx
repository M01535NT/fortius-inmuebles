import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  title: "Comercial",
  description: routePages.comercial.description,
};

export default function ComercialPage() {
  return <InteriorPage {...routePages.comercial} />;
}
