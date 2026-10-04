import type { Metadata } from "next";
import { Compromisos } from "@/components/home/compromisos";
import { Evaluar } from "@/components/home/evaluar";
import { Metodo } from "@/components/home/metodo";
import { EditorialHero } from "@/components/home/editorial-hero";
import { EditorialHome } from "@/components/home/editorial-home";
import { EditorialDocuments, EditorialIntro, EditorialProperties, EditorialTools } from "@/components/home/editorial-sections";
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
      <Metodo content={content} />
      <EditorialDocuments content={content} />
      <div className="editorial-featured"><EditorialProperties /></div>
      <div className="editorial-segments"><Segmentos /></div>
      <Respuestas content={content} />
      <EditorialTools />
      <Compromisos />
      <Evaluar content={content} />
    </EditorialHome>
  );
}
