import type { Metadata } from "next";
import { EditorialAdvisor } from "@/components/home/editorial-advisor";
import { MethodTimeline } from "@/components/home/method-timeline";
import { EditorialImageReveal } from "@/components/home/editorial-image-reveal";
import { EditorialHero } from "@/components/home/editorial-hero";
import { EditorialHome } from "@/components/home/editorial-home";
import { EditorialDocuments, EditorialIntro, EditorialProperties, EditorialSellerGateway, EditorialTools } from "@/components/home/editorial-sections";
import { Respuestas } from "@/components/home/respuestas";
import { Segmentos } from "@/components/home/segmentos";
import { getPublicContent } from "@/lib/backend/public";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/* Editorial home; shared backend, navigation, inventory and contact flows. */
export default async function HomePage() {
  const content = await getPublicContent();
  return (
    <EditorialHome>
      <EditorialHero content={content} />
      <EditorialIntro content={content} />
      <EditorialImageReveal />
      <EditorialSellerGateway />
      <MethodTimeline content={content} />
      <EditorialDocuments content={content} />
      <div className="editorial-featured"><EditorialProperties /></div>
      <div className="editorial-segments"><Segmentos /></div>
      <Respuestas content={content} />
      <EditorialTools />
      <EditorialAdvisor />
    </EditorialHome>
  );
}
