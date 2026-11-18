import type { Metadata } from "next";

import { Boton } from "@/components/sitio/boton";
import { Bloque, CabezaPagina, Preguntas, SiguientePaso } from "@/components/sitio/pagina";
import { preguntasPorGrupo } from "@/data/preguntas-frecuentes";
import { getPublicContent } from "@/lib/backend/public";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/preguntas-frecuentes",
  title: "Dudas al vender o comprar en Tijuana",
  description:
    "Respuestas sobre vender o comprar un inmueble en Tijuana con Fortius Inmuebles: cómo se fija el precio, qué documentos pedir, gastos, crédito y plazos.",
});

/*
  Preguntas frecuentes, rediseño del sitio (etapa 5, 17/11/2026): un bloque por grupo con las preguntas
  que se abren con un toque. Las preguntas base viven en el código y las que agrega el equipo,
  en Textos del sitio del panel.
*/
export default async function PreguntasFrecuentesPage() {
  const content = await getPublicContent().catch(() => null);
  const grupos = preguntasPorGrupo(content);
  return (
    <main className="s-pagina">
      <CabezaPagina titulo="Resuelve tus dudas antes de avanzar." entrada="Lo que más nos preguntan. ¿No está tu duda? Escríbenos." />
      {grupos.map((grupo) => (
        <Bloque key={grupo.key} id={`preguntas-${grupo.key}`} titulo={grupo.title}>
          <Preguntas preguntas={grupo.questions.map((q) => ({ id: q.id, q: q.q, a: q.a, enlace: q.link }))} />
        </Bloque>
      ))}
      <SiguientePaso id="pf-siguiente" titulo="¿Sigues con dudas?" texto="Un asesor te responde.">
        <Boton href="/contacto" tamano="grande">Hablar con un asesor</Boton>
      </SiguientePaso>
    </main>
  );
}
