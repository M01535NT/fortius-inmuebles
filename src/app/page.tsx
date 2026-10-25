import type { Metadata } from "next";
import { NocturnoHero } from "@/components/home/nocturno-hero";
import { NocturnoExpediente } from "@/components/home/nocturno-expediente";
import { NocturnoMetodo } from "@/components/home/nocturno-metodo";
import { NocturnoDestacadas } from "@/components/home/nocturno-sections";
import { entregablesDe, etapasDe, pilaresDe } from "@/components/home/nocturno-content";
import { Respuestas } from "@/components/home/respuestas";
import { homeText } from "@/data/home-copy";
import { TIPO_LABELS } from "@/data/propiedades";
import { getPublicContent } from "@/lib/backend/public";
import { getFeaturedProperties, getPropiedades } from "@/lib/inventario";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/* Inicio · dirección Nocturno (LV-05): las secciones siguen el tema; la portada conserva su foto. */
export default async function HomePage() {
  const [content, propiedades, destacadas] = await Promise.all([getPublicContent(), getPropiedades(), getFeaturedProperties()]);
  // El buscador solo ofrece zonas y tipos que existen en el inventario publicado.
  const zonas = [...new Set(propiedades.map((p) => p.zona).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const tipos = [...new Set(propiedades.map((p) => p.tipo))].map((value) => ({ value, label: TIPO_LABELS[value] }));
  const entregables = entregablesDe(content);
  return (
    <main className="nocturno-home">
      <NocturnoHero zonas={zonas} tipos={tipos} />
      <NocturnoDestacadas properties={destacadas.slice(0, 3)} />
      <NocturnoExpediente intro={entregables.intro} pillars={pilaresDe(content)} documents={entregables.documents} />
      <NocturnoMetodo title={homeText(content, "metodoTitulo")} stages={etapasDe(content)} />
      <div className="nx-faq"><Respuestas content={content} /></div>
    </main>
  );
}
