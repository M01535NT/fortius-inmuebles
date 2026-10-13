import type { Metadata } from "next";
import { MethodTimeline } from "@/components/home/method-timeline";
import { EditorialImageReveal } from "@/components/home/editorial-image-reveal";
import { EditorialHero } from "@/components/home/editorial-hero";
import { EditorialHome } from "@/components/home/editorial-home";
import { EditorialDocuments, EditorialIntro, EditorialProperties, EditorialSellerGateway } from "@/components/home/editorial-sections";
import { Respuestas } from "@/components/home/respuestas";
import { Segmentos } from "@/components/home/segmentos";
import { getPublicContent } from "@/lib/backend/public";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/* Editorial home; shared backend, navigation, inventory and contact flows. */
export default async function HomePage() {
  const content = await getPublicContent();
  return (
    <EditorialHome>
      <EditorialHero />
      <EditorialSellerGateway />
      <div className="editorial-featured"><EditorialProperties /></div>
      <div className="editorial-segments"><Segmentos /></div>
      <EditorialIntro content={content} />
      <EditorialImageReveal />
      <MethodTimeline content={content} />
      <EditorialDocuments content={content} />
      <Respuestas content={content} />
    </EditorialHome>
  );
}
