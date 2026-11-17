import type { Metadata } from "next";

import { Boton } from "@/components/sitio/boton";
import { Bloque, CabezaPagina, Filas } from "@/components/sitio/pagina";
import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/vender-propiedad/gracias",
  title: "Recibimos tu solicitud",
  description:
    "Recibimos los datos de tu propiedad. Te contactamos para revisar el precio, los documentos y el siguiente paso de tu venta.",
  robots: { index: false, follow: false }, // página de confirmación, no indexable
});

const SIGUIENTE = [
  { titulo: "Ahora", texto: "Leemos los datos de tu propiedad." },
  { titulo: "Después", texto: "Te llamamos para la entrevista inicial y agendamos la visita." },
  { titulo: "Al final", texto: "Tras la visita y la revisión de papeles, te entregamos la opinión jurídica y la de valor." },
] as const;

/* Confirmación de Vender, Fortius II (etapa 7, 17/11/2026): qué sigue y a dónde ir mientras. */
export default async function GraciasPage() {
  const contact = publicContact(await getPublicSettings().catch(() => null));
  return (
    <main className="s-pagina">
      <CabezaPagina titulo="Recibimos los datos de tu propiedad." entrada="No publicamos nada ni compartimos tus datos. Primero hablamos contigo.">
        {contact.whatsapp && <Boton href={contact.whatsapp} target="_blank" rel="noopener noreferrer" flecha>Escribir por WhatsApp</Boton>}
        <Boton href="/herramientas/gastos-de-cierre" variante="contorno">Mientras, estima tus gastos</Boton>
      </CabezaPagina>
      <Bloque id="que-sigue" titulo="Qué sigue.">
        <Filas ordenadas filas={SIGUIENTE} />
      </Bloque>
    </main>
  );
}
