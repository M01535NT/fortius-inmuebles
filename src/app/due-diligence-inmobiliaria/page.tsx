import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  title: "Due diligence inmobiliaria",
  description: routePages.dueDiligence.description,
};

export default function DueDiligencePage() {
  return <InteriorPage {...routePages.dueDiligence} />;
}
