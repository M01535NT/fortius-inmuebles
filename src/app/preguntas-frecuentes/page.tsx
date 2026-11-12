import type { Metadata } from "next";
import Link from "next/link";

import { PreguntaItem } from "@/components/home/respuestas";
import { preguntasPorGrupo } from "@/data/preguntas-frecuentes";
import { getPublicContent } from "@/lib/backend/public";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/preguntas-frecuentes",
  title: "Dudas al vender o comprar en Tijuana",
  description:
    "Respuestas sobre vender o comprar un inmueble en Tijuana con Fortius Inmuebles: cómo se fija el precio, qué documentos pedir, gastos, crédito y plazos.",
});

/* Las preguntas base viven en el código y las que agrega el equipo, en Textos del sitio del panel. */
export default async function PreguntasFrecuentesPage() {
  const content = await getPublicContent().catch(() => null);
  const groups = preguntasPorGrupo(content);
  return <main className="pg-page">
    <section className="pg-hero">
      <div className="pg-container pg-hero-body">
        <h1 className="pg-title">Resuelve tus dudas antes de avanzar.</h1>
        <p className="pg-lead">Lo que más nos preguntan. ¿No está tu duda? Escríbenos.</p>
      </div>
    </section>
    <section className="pg-container pg-section pg-section-last" aria-label="Preguntas y respuestas">
      <div className="faq-groups">
        {groups.map(group => <div key={group.key} className="faq-group">
          <h2 className="pg-h2">{group.title}</h2>
          <div className="border-t border-border">
            {group.questions.map((item, index) => <PreguntaItem key={item.id} item={item} index={index} animated={false} />)}
          </div>
        </div>)}
      </div>
      <div className="pg-card pg-card-pad faq-more">
        <h2 className="pg-h3">¿Sigues con dudas?</h2>
        <p className="pg-muted">Un asesor te responde.</p>
        <Link href="/contacto" className="pg-btn">Hablar con un asesor</Link>
      </div>
    </section>
  </main>;
}
