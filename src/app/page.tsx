import type { Metadata } from "next";
import Link from "next/link";

import { CalculadoraInicio } from "@/components/sitio/inicio/calculadora-inicio";
import { CierreAsunto } from "@/components/sitio/inicio/cierre-asunto";
import { PortadaAsuntos } from "@/components/sitio/inicio/portada-asuntos";
import { QuienesSomos } from "@/components/sitio/inicio/quienes-somos";
import { TiraPropiedades } from "@/components/sitio/inicio/tira-propiedades";
import { Zonas } from "@/components/sitio/inicio/zonas";
import { FlechaDerecha } from "@/components/sitio/iconos";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";
import type { Property } from "@/data/propiedades";
import { getBlogPosts } from "@/lib/blog";
import { getPublicSettings } from "@/lib/backend/public";
import { getPropiedades } from "@/lib/inventario";
import { publicContact } from "@/lib/public-contact";
import "./inicio-sitio.css";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/*
  Inicio · rediseño del sitio (17/11/2026), según el lienzo «Fortius desde cero»: portada por asuntos,
  quiénes somos con el video que crece, tira de propiedades, calculadora, zonas, guías y el
  cierre «Cuéntanos tu asunto». Ya no lleva el método de cinco etapas ni el expediente.
*/
/*
  En el mercado ahora: primero las destacadas y luego las más recientes, sin repetir y nunca
  vendidas ni rentadas. Hasta ocho; si hay menos publicadas, salen las que haya.
*/
function seleccionMercado(propiedades: Property[]): Property[] {
  const vistas = new Set<string>();
  return propiedades
    .filter((p) => p.estado !== "vendida" && p.estado !== "rentada")
    .filter((p) => (vistas.has(p.slug) ? false : (vistas.add(p.slug), true)))
    .sort((a, b) => Number(b.destacada) - Number(a.destacada) || Date.parse(b.publicadaEl || "") - Date.parse(a.publicadaEl || "") || 0)
    .slice(0, 8);
}

export default async function HomePage() {
  const [propiedades, guias, settings] = await Promise.all([
    getPropiedades().catch(() => []),
    getBlogPosts().catch(() => []),
    getPublicSettings().catch(() => null),
  ]);
  const contact = publicContact(settings, "Hola, quiero contarles mi asunto.");
  const enMercado = seleccionMercado(propiedades);

  return (
    <main className="ini">
      <PortadaAsuntos whatsapp={contact.whatsapp || undefined} />
      <QuienesSomos />
      <TiraPropiedades propiedades={enMercado} />
      <CalculadoraInicio />
      <Zonas />
      {guias.length > 0 && <section className="s-contenedor gu" aria-labelledby="gu-titulo">
        <div className="gu-cabeza">
          <h2 id="gu-titulo" className="s-h2">Guías para decidir</h2>
          <Link href="/blog" className="s-enlace">Ver todas las guías<FlechaDerecha /></Link>
        </div>
        <ListaLineas grande fuerte className="gu-lista">
          {guias.slice(0, 4).map((g) => <FilaLinea key={g.slug} href={`/blog/${g.slug}`} titulo={g.titulo} />)}
        </ListaLineas>
      </section>}
      <CierreAsunto whatsapp={contact.whatsapp || undefined} />
    </main>
  );
}
