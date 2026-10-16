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
  const benefits = [
    { title: "Precio con referencias.", text: copy.manifiestoTexto },
    { title: "Pendientes identificados.", text: homeText(content, "relatoTexto") },
    { title: "Promoción acordada.", text: homeText(content, "relatoApoyo") },
    { title: "Seguimiento de la operación.", text: "Recibes información de consultas, visitas y ofertas para decidir cómo avanzar." },
  ];
  return <section id="por-que-fortius" className="editorial-intro editorial-container" aria-label="Por qué Fortius">
    <div className="editorial-price-grid">
      <figure className="editorial-interior"><div className="editorial-photo-clip"><Image src="/hero/interior-depa.webp" alt="Interior de un departamento, imagen de referencia" width={1000} height={720} sizes="(max-width: 767px) 100vw, 50vw" data-editorial-image /></div></figure>
      <div className="editorial-price-copy" data-editorial-reveal>
        <p className="editorial-eyebrow">Por qué Fortius</p>
        <SplitHeading reveal="lines" lines={copy.manifiestoTitulo.split("\n")} className="editorial-section-title" />
        <dl className="editorial-benefits">{benefits.map((benefit) => <div key={benefit.title}>
          <dt>{benefit.title}</dt><dd>{benefit.text}</dd>
        </div>)}</dl>
      </div>
    </div>
  </section>;
}

export function EditorialSellerGateway() {
  const journeys = [
    { title: "Soy propietario", text: "Quiero vender mi inmueble y conocer el servicio, los honorarios y los pasos para empezar.", action: "Quiero vender", href: "/vender-propiedad" },
    { title: "Busco un inmueble", text: "Quiero explorar propiedades y consultar sus características, precio y disponibilidad.", action: "Explorar propiedades", href: "/inventario" },
  ];
  return <section id="recorridos" className="editorial-seller-gateway editorial-journeys" aria-labelledby="seller-gateway-title">
    <div className="editorial-container">
      <h2 id="seller-gateway-title" data-editorial-reveal>¿Qué necesitas hacer?</h2>
      <div className="editorial-journey-grid">{journeys.map((journey, index) => <Link key={journey.href} href={journey.href} className="editorial-journey" data-editorial-reveal>
        <span className="editorial-journey-number" aria-hidden="true">0{index + 1}</span>
        <div><h3>{journey.title}</h3><p>{journey.text}</p>
          <span className="editorial-journey-action">{journey.action}<ArrowUpRight size={28} strokeWidth={1.4} aria-hidden="true" /></span>
        </div>
      </Link>)}</div>
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
  return <section id="destacadas" className="editorial-container editorial-properties" aria-label="Propiedades destacadas">
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div><SplitHeading reveal="lines" lines={["Propiedades", "destacadas."]} className="display-title text-foreground" />
      </div>
      <Link href="/inventario" className="editorial-text-link">Explorar todo el inventario <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
    {properties.length ? <div className="editorial-property-grid">{properties.map((property) => <div key={property.slug} data-editorial-reveal><PropertyCard property={property} /></div>)}</div>
      : <p className="editorial-property-empty">Por ahora no hay propiedades destacadas disponibles. Puedes consultar el inventario completo.</p>}
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

