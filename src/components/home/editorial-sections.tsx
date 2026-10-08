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
    <div className="editorial-price-grid">
      <figure className="editorial-interior"><div className="editorial-photo-clip"><Image src="/hero/interior-depa.webp" alt="Interior de un departamento, imagen de referencia" width={1000} height={720} sizes="(max-width: 767px) 100vw, 50vw" data-editorial-image /></div></figure>
      <div className="editorial-price-copy" data-editorial-reveal>
        <SplitHeading reveal="lines" lines={copy.manifiestoTitulo.split("\n")} className="editorial-section-title" />
        <p>{copy.manifiestoTexto}</p>
        <Link href="/herramientas" className="editorial-text-link">Consultar herramientas <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
    </div>
  </section>;
}

export function EditorialSellerGateway() {
  return <section className="editorial-seller-gateway" aria-labelledby="seller-gateway-title">
    <div className="editorial-container editorial-seller-gateway-grid">
      <div data-editorial-reveal>
        <h2 id="seller-gateway-title">¿Tienes una propiedad para vender?</h2>
        <p>Conoce el servicio, los honorarios y lo que necesitas para empezar.</p>
      </div>
      <Link href="/vender-propiedad" className="editorial-seller-gateway-link" data-editorial-reveal>
        <span>Ver cómo vender mi propiedad</span>
        <ArrowUpRight size={32} strokeWidth={1.4} aria-hidden="true" />
      </Link>
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
      </div>
      <Link href="/inventario" className="editorial-text-link">Ver inventario <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
    <div className="editorial-property-grid">{properties.map((property) => <div key={property.slug} data-editorial-reveal><PropertyCard property={property} /></div>)}</div>
  </section>;
}

export function EditorialDocuments({ content }: { content?: SiteContent | null }) {
  return <section id="entregables" className="editorial-documents editorial-container">
    <div className="editorial-documents-grid">
      <div className="editorial-sticky-heading"><SplitHeading reveal="lines" lines={homeText(content, "entregablesTitulo").split("\n")} className="editorial-section-title" /><p>{homeText(content, "entregablesTexto")}</p></div>
      <DeliverablesStack documents={DOCS.map((doc) => ({ title: doc.title, text: homeText(content, doc.copy) }))} />
    </div>
  </section>;
}

const TOOLS = [
  { title: "Calculadora de hipoteca", text: "Estima tu mensualidad con enganche, plazo y tasa editables.", href: "/herramientas/hipoteca" },
  { title: "Gastos de cierre", text: "Estima los gastos de compraventa, desglosados por concepto.", href: "/herramientas/gastos-de-cierre" },
];
export function EditorialTools() {
  return <section className="editorial-tools"><div className="editorial-container">
    <SplitHeading reveal="lines" lines={["Calculadoras", "inmobiliarias."]} className="editorial-section-title" />
    <div className="editorial-tools-grid">{TOOLS.map((tool) => <Link key={tool.href} href={tool.href} className="editorial-tool" data-cursor="Abrir" data-editorial-reveal><h3>{tool.title}</h3><p>{tool.text}</p><span>Abrir <ArrowUpRight size={20} aria-hidden="true" /></span></Link>)}</div>
  </div></section>;
}
