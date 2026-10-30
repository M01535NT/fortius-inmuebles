import type { Metadata } from "next";
import { NocturnoHero } from "@/components/home/nocturno-hero";
import { NocturnoExpediente } from "@/components/home/nocturno-expediente";
import { NocturnoMetodo } from "@/components/home/nocturno-metodo";
import { NocturnoDestacadas } from "@/components/home/nocturno-sections";
import { NocturnoOpinion, NocturnoPromocion, NocturnoRevision } from "@/components/home/nocturno-servicios";
import { NocturnoComprar, NocturnoEquipo, NocturnoRecursos, NocturnoSegmentos, NocturnoTestimonios } from "@/components/home/nocturno-extras";
import { entregablesDe, etapasDe, pilaresDe } from "@/components/home/nocturno-content";
import { Respuestas } from "@/components/home/respuestas";
import { homeText } from "@/data/home-copy";
import { getPublicContent } from "@/lib/backend/public";
import { PERFIL_ILUSTRATIVO } from "@/data/perfil-ilustrativo";
import { getPublishedTeam } from "@/lib/backend/public-team";
import { getBlogPosts } from "@/lib/blog";
import { getFeaturedProperties, getPropiedades } from "@/lib/inventario";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/* Inicio · dirección Nocturno (LV-05): las secciones siguen el tema; la portada conserva su foto. */
export default async function HomePage() {
  const [content, propiedades, destacadas, team, posts] = await Promise.all([
    getPublicContent(), getPropiedades(), getFeaturedProperties(), getPublishedTeam().catch(() => []), getBlogPosts().catch(() => []),
  ]);
  const entregables = entregablesDe(content);
  return (
    <main className="nocturno-home">
      <NocturnoHero />
      <NocturnoExpediente intro={entregables.intro} pillars={pilaresDe(content)} documents={entregables.documents} />
      <NocturnoMetodo title={homeText(content, "metodoTitulo")} stages={etapasDe(content)} />
      <NocturnoRevision />
      <NocturnoOpinion />
      <NocturnoPromocion />
      <NocturnoDestacadas properties={destacadas} />
      <NocturnoTestimonios items={content.testimonios ?? []} />
      <NocturnoSegmentos properties={propiedades} />
      <NocturnoComprar />
      <NocturnoEquipo team={team.length ? team : [PERFIL_ILUSTRATIVO]} ilustrativo={!team.length} />
      <NocturnoRecursos posts={posts} />
      <div className="nx-faq"><Respuestas content={content} /></div>
    </main>
  );
}
