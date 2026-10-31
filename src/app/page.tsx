import type { Metadata } from "next";
import { NocturnoHero } from "@/components/home/nocturno-hero";
import { NocturnoHacemos } from "@/components/home/nocturno-hacemos";
import { NocturnoExpediente } from "@/components/home/nocturno-expediente";
import { NocturnoMetodo } from "@/components/home/nocturno-metodo";
import { NocturnoDestacadas } from "@/components/home/nocturno-sections";
import { NocturnoCierre, NocturnoComprar, NocturnoEquipo, NocturnoRecursos, NocturnoTestimonios } from "@/components/home/nocturno-extras";
import { entregablesDe, etapasDe, pilaresDe } from "@/components/home/nocturno-content";
import { Respuestas } from "@/components/home/respuestas";
import { homeText } from "@/data/home-copy";
import { getPublicContent } from "@/lib/backend/public";
import { PERFIL_ILUSTRATIVO } from "@/data/perfil-ilustrativo";
import { getPublishedTeam } from "@/lib/backend/public-team";
import { getFeaturedProperties, getPropiedades } from "@/lib/inventario";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/*
  Inicio (30/10/2026): cada sección responde una pregunta, en este orden: qué hacemos,
  cómo te ayudamos a vender (método), lo que recibes (expediente), cómo te ayudamos a
  comprar (buscador), qué tenemos (baraja), quién te atiende, herramientas y preguntas;
  cierra una invitación a hablar. La portada, «Comprar» y el cierre llevan video.
*/
export default async function HomePage() {
  const [content, propiedades, destacadas, team] = await Promise.all([
    getPublicContent(), getPropiedades(), getFeaturedProperties(), getPublishedTeam().catch(() => []),
  ]);
  const entregables = entregablesDe(content);
  return (
    <main className="nocturno-home">
      <NocturnoHero />
      <NocturnoHacemos />
      <NocturnoMetodo title={homeText(content, "metodoTitulo")} stages={etapasDe(content)} />
      <NocturnoExpediente intro={entregables.intro} pillars={pilaresDe(content)} documents={entregables.documents} />
      <NocturnoComprar properties={propiedades} />
      <NocturnoDestacadas properties={destacadas} />
      <NocturnoTestimonios items={content.testimonios ?? []} />
      <NocturnoEquipo team={team.length ? team : [PERFIL_ILUSTRATIVO]} ilustrativo={!team.length} />
      <NocturnoRecursos />
      <div className="nx-faq"><Respuestas content={content} /></div>
      <NocturnoCierre />
    </main>
  );
}
