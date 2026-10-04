import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { homeText, resolveSiteContent, type HomeTextKey } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import { SplitHeading } from "@/components/gsap/split-heading";
import { PropertyCard } from "@/components/property/property-card";
import { getFeaturedProperties } from "@/lib/inventario";
import { DeliverablesStack } from "@/components/home/deliverables-stack";

export function EditorialIntro({ content }: { content?: SiteContent | null }) {
  const copy = resolveSiteContent(content);
  return <section className="editorial-intro editorial-container" aria-label="Revisión y precio">
    <div className="editorial-section-label" data-editorial-rule>Antes de publicar</div>
    <div className="editorial-intro-grid">
      <SplitHeading as="p" reveal="lines" lines={[homeText(content, "relatoTexto")]} className="editorial-statement" />
      <p className="editorial-support" data-editorial-reveal>{homeText(content, "relatoApoyo")}</p>
    </div>
    <div className="editorial-price-grid">
      <figure className="editorial-interior"><div className="editorial-photo-clip"><Image src="/hero/interior-depa.webp" alt="Interior de un departamento, imagen de referencia" width={1000} height={720} sizes="(max-width: 767px) 100vw, 50vw" data-editorial-image /></div><figcaption>La propiedad, antes de ponerla en venta.</figcaption></figure>
      <div className="editorial-price-copy" data-editorial-reveal>
        <span className="editorial-section-label">El precio de salida</span>
        <SplitHeading reveal="lines" lines={copy.manifiestoTitulo.split("\n")} className="editorial-section-title" />
        <p>{copy.manifiestoTexto}</p>
        <Link href="/herramientas" className="editorial-text-link">Consultar herramientas <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
    </div>
  </section>;
}

const DOCS: { title: string; copy: HomeTextKey }[] = [
  { title: "Análisis de factibilidad", copy: "factibilidadTexto" },
  { title: "Opinión de valor", copy: "valorTexto" },
  { title: "Plan de comercialización", copy: "planTexto" },
  { title: "Estimación de gastos", copy: "gastosTexto" },
  { title: "Contrato de servicios", copy: "contratoTexto" },
  { title: "Reportes de seguimiento", copy: "reportesTexto" },
];

export async function EditorialProperties() {
  const properties = (await getFeaturedProperties()).slice(0, 3);
  if (properties.length === 0) return null;
  return <section className="editorial-container editorial-properties">
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div><SplitHeading reveal="lines" lines={["Propiedades."]} className="display-title text-foreground" />
        <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted-foreground">{properties.some((property) => property.demo)
          ? "Explora las fichas y sus características."
          : "Consulta las características, el precio y la disponibilidad de cada inmueble."}</p>
      </div>
      <Link href="/inventario" className="editorial-text-link">Ver inventario <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
    <div className="editorial-property-grid">{properties.map((property) => <div key={property.slug} data-editorial-reveal><PropertyCard property={property} /></div>)}</div>
  </section>;
}

export function EditorialDocuments({ content }: { content?: SiteContent | null }) {
  return <section id="entregables" className="editorial-documents editorial-container">
    <div className="editorial-section-label" data-editorial-rule>El trabajo por escrito</div>
    <div className="editorial-documents-grid">
      <div className="editorial-sticky-heading"><SplitHeading reveal="lines" lines={homeText(content, "entregablesTitulo").split("\n")} className="editorial-section-title" /><p>{homeText(content, "entregablesTexto")}</p></div>
      <DeliverablesStack documents={DOCS.map((doc) => ({ title: doc.title, text: homeText(content, doc.copy) }))} />
    </div>
  </section>;
}

const TOOLS = [
  { title: "Calculadora de hipoteca", text: "Estima tu mensualidad con enganche, plazo y tasa editables.", href: "/herramientas/hipoteca" },
  { title: "Gastos de cierre", text: "Estima los gastos de compraventa, desglosados por concepto.", href: "/herramientas/gastos-de-cierre" },
  { title: "Evaluar mi propiedad", text: "Comparte la ubicación y el tipo de inmueble para solicitar una revisión.", href: "#evaluar" },
];
export function EditorialTools() {
  return <section className="editorial-tools"><div className="editorial-container">
    <div className="editorial-section-label" data-editorial-rule>Para hacer tus cuentas</div>
    <SplitHeading reveal="lines" lines={["Calculadoras", "inmobiliarias."]} className="editorial-section-title" />
    <div className="editorial-tools-grid">{TOOLS.map((tool) => <Link key={tool.href} href={tool.href} className="editorial-tool" data-cursor="Abrir" data-editorial-reveal><h3>{tool.title}</h3><p>{tool.text}</p><span>Abrir <ArrowUpRight size={20} aria-hidden="true" /></span></Link>)}</div>
  </div></section>;
}
