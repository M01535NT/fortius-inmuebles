import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/residencial" },
  title: "Residencial",
  description: routePages.residencial.description,
};

export default function ResidencialPage() {
  return <InteriorPage {...routePages.residencial} />;
}
