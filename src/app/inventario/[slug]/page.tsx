import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { Check, MapPin } from "lucide-react";

import { propertyShare, propertyShareMetadata } from "@/lib/property-share";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyDocuments } from "@/components/property/property-documents";
import { PropertyFaq } from "@/components/property/property-faq";
import { PropertyGallery } from "@/components/property/property-gallery";
import { InventoryBackLink } from "@/components/property/inventory-back-link";
import { PropertyLocation } from "@/components/property/property-location";
import { PropertyMobileCta } from "@/components/property/property-mobile-cta";
import { SharePanel } from "@/components/property/share-panel";
import { VisitPlanner } from "@/components/property/visit-planner";
import { getPublicAdvisers, getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import {
  ESTADO_LABELS,
  FUENTE_SUPERFICIE_LABELS,
  GRUPO_CARACTERISTICA_LABELS,
  formatPrecio,
  OPERACION_LABELS,
  TIPO_LABELS,
  type Property,
} from "@/data/propiedades";
import { getConjunto, getPropertyBySlug, getRelatedProperties } from "@/lib/inventario";
import { siteConfig } from "@/data/site";
import "./ficha.css";

type Params = { slug: string };

/* Cada solicitud consulta el inventario publicado del panel MNT. */
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};
  return propertyShareMetadata(property);
}

type FichaRow = { label: string; value: string; source?: string; confirmed?: boolean };

/* Ficha técnica: solo filas con dato; las superficies dicen de dónde salen. */
function fichaRows(p: Property): FichaRow[] {
  const f = p.ficha;
  const fuente = (key?: keyof typeof FUENTE_SUPERFICIE_LABELS) => key
    ? { source: `Fuente: ${FUENTE_SUPERFICIE_LABELS[key]}`, confirmed: key === "escritura" || key === "catastro" || key === "plano" }
    : { source: "Fuente por confirmar", confirmed: false };
  const rows: FichaRow[] = [];
  if (f.terrenoM2 != null) rows.push({ label: "Terreno", value: `${f.terrenoM2} m²`, ...fuente(p.informacionPublica?.fuenteTerreno) });
  if (f.construccionM2 != null) rows.push({ label: "Construcción", value: `${f.construccionM2} m²`, ...fuente(p.informacionPublica?.fuenteConstruccion) });
  if (f.recamaras) rows.push({ label: "Recámaras", value: String(f.recamaras) });
  if (f.banos) rows.push({ label: "Baños", value: String(f.banos) });
  if (f.estacionamientos) rows.push({ label: "Estacionamientos", value: String(f.estacionamientos) });
  if (f.antiguedad) rows.push({ label: "Antigüedad", value: f.antiguedad });
  return rows;
}

/* Montos recurrentes en la moneda del precio publicado (MXN si es a consulta). */
function money(amount: number, p: Property) {
  const moneda = p.precio.modalidad === "publico" ? p.precio.moneda : "MXN";
  return `$${amount.toLocaleString("en-US")} ${moneda}`;
}

function jsonLd(p: Property): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.titulo,
    description: p.descripcion[0],
    url: `${siteConfig.url}/inventario/${p.slug}`,
    image: p.galeria.map((g) => new URL(g.src, siteConfig.url).href),
    datePosted: p.publicadaEl,
    address: {
      "@type": "PostalAddress",
      addressLocality: p.zona,
      addressRegion: "Baja California",
      addressCountry: "MX",
    },
    // Sin offers cuando el precio es a consulta: no se inventan montos.
    ...(p.precio.modalidad === "publico"
      ? {
          offers: {
            "@type": "Offer",
            price: p.precio.monto,
            priceCurrency: p.precio.moneda,
            availability:
              p.estado === "disponible"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          },
        }
      : {}),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

async function qrSvg(url: string) {
  try {
    return await QRCode.toString(url, { type: "svg", margin: 1, width: 180, color: { dark: "#061f3f", light: "#ffffff" } });
  } catch {
    return undefined;
  }
}

/*
  Ficha del inmueble · «Escenario» (titular, 18/10/2026): banda oscura con
  título, precio y visor; franja de datos clave; secciones con índice fijo y
  tarjeta de visita fija; similares al final. Las secciones sin datos no se
  muestran.
*/
export default async function PropertyDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const [related, advisers, settings, conjunto] = await Promise.all([
    getRelatedProperties(slug), getPublicAdvisers(), getPublicSettings(), getConjunto(property),
  ]);
  const ficha = fichaRows(property);
  const share = propertyShare(property);
  const pageUrl = new URL(`/inventario/${property.slug}`, siteConfig.url).href;
  const enquiryMessage = `Hola, me interesa ${property.titulo} (${property.codigo}). ${pageUrl}`;
  const contact = publicContact(settings, enquiryMessage);
  const asesor = advisers.find((a) => a.id === property.asesorId);
  const muestraCalculadora = property.creditoDisponible && property.operacion === "venta" && property.precio.modalidad === "publico";
  const grupos = property.caracteristicas?.filter(grupo => grupo.elementos.length) ?? [];
  const beneficios = property.beneficios ?? [];
  const documentos = property.documentos ?? [];
  const costos = property.costos ?? {};
  const qr = await qrSvg(share.url);

  const secciones = [
    { id: "descripcion", label: "Descripción", show: property.descripcion.length > 0 },
    { id: "caracteristicas", label: "Características", show: grupos.length > 0 || property.amenidades.length > 0 },
    { id: "beneficios", label: "Beneficios", show: beneficios.length > 0 },
    { id: "ubicacion", label: "Ubicación", show: true },
    { id: "ficha-tecnica", label: "Ficha técnica", show: ficha.length > 0 },
    { id: "documentos", label: "Documentos", show: documentos.length > 0 },
    { id: "costos", label: "Costos", show: true },
    { id: "preguntas", label: "Preguntas", show: true },
  ].filter(section => section.show);

  return (
    <main className="pg-page fe-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(property) }} />

      <section className="pg-hero fe-hero" aria-labelledby="fe-title">
        <div className="pg-container fe-hero-body">
          <nav className="fe-crumbs" aria-label="Ruta">
            <InventoryBackLink />
            <span aria-hidden="true">/</span>
            <Link href={`/inventario?tipo=${property.tipo}&op=${property.operacion}`}>{TIPO_LABELS[property.tipo]} en {OPERACION_LABELS[property.operacion].toLowerCase()}</Link>
            <span aria-hidden="true">/</span>
            <span>{property.zona}</span>
          </nav>

          <div className="fe-hero-head">
            <div>
              <p className="fe-chips">
                <span className="fe-chip is-solid">{OPERACION_LABELS[property.operacion]}</span>
                {property.demo && <span className="fe-chip is-demo">Datos de ejemplo</span>}
                <span className="fe-chip">{property.codigo}</span>
                {property.estado !== "disponible" && <span className="fe-chip">{ESTADO_LABELS[property.estado]}</span>}
              </p>
              <h1 id="fe-title" className="fe-title">{property.titulo}</h1>
              <p className="fe-place"><MapPin size={16} strokeWidth={1.6} aria-hidden="true" />{property.zona}, {property.direccionAproximada}</p>
            </div>
            <div className="fe-price-block">
              <p className="fe-price">{formatPrecio(property.precio)}</p>
              {muestraCalculadora && <p className="fe-price-note">Con crédito hipotecario. <a href="#costos">Calcular mensualidad</a></p>}
              {property.operacion === "renta" && <p className="fe-price-note">Renta mensual. <a href="#costos">Ver costos</a></p>}
            </div>
          </div>

          {property.demo && <p className="fe-demo-note"><strong>Propiedad de demostración.</strong> Los datos y el precio son de ejemplo; esta ficha no anuncia una oferta real.</p>}

          <PropertyGallery
            imagenes={property.galeria}
            titulo={property.titulo}
            share={share}
            videoUrl={property.videoUrl}
            tour360Url={property.tour360Url}
            fichaUrl={`/inventario/${encodeURIComponent(property.slug)}/ficha-tecnica`}
            ficha={{ titulo: property.titulo, codigo: property.codigo, zona: property.zona, precio: formatPrecio(property.precio), filas: ficha.slice(0, 4).map(({ label, value }) => ({ label, value })), demo: property.demo }}
          />
        </div>
      </section>

      {ficha.length > 0 && <section className="fe-facts" aria-label="Características principales">
        <dl className="pg-container property-key-facts">
          {ficha.map((row) => <div key={row.label}><dd>{row.value}</dd><dt>{row.label}</dt></div>)}
        </dl>
      </section>}

      <div className="pg-container fe-layout">
        <div className="fe-main">
          <nav className="fe-sections" aria-label="Secciones del inmueble">
            {secciones.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
          </nav>

          {property.estado === "apartada" && <p className="fe-alert">Esta propiedad está apartada. Podemos avisarte si vuelve a estar disponible o mostrarte opciones similares.</p>}
          {property.estado === "rentada" && <p className="fe-alert">Esta propiedad ya fue rentada. Podemos mostrarte opciones similares.</p>}
          {conjunto.plaza && <p className="fe-alert">Forma parte de <Link href={`/inventario/${conjunto.plaza.slug}`} className="font-semibold underline underline-offset-4">{conjunto.plaza.titulo}</Link>.</p>}

          {property.descripcion.length > 0 && <section id="descripcion" className="fe-section" aria-label="Descripción">
            <p className="pg-eyebrow pg-eyebrow-ink">Descripción</p>
            <div className="fe-description">
              {property.descripcion.map((parrafo, index) => <p key={parrafo.slice(0, 32)} className={index === 0 ? "is-lead" : undefined}>{parrafo}</p>)}
            </div>
          </section>}

          {(grupos.length > 0 || property.amenidades.length > 0) && <section id="caracteristicas" className="fe-section" aria-labelledby="fe-features">
            <p className="pg-eyebrow pg-eyebrow-ink">Características</p>
            <h2 id="fe-features" className="fe-h2">Todo lo que tiene</h2>
            <div className="fe-groups">
              {(grupos.length ? grupos.map(grupo => ({ titulo: GRUPO_CARACTERISTICA_LABELS[grupo.grupo], elementos: grupo.elementos })) : [{ titulo: "Lo que ofrece", elementos: property.amenidades }]).map(grupo => (
                <div key={grupo.titulo} className="fe-card fe-group">
                  <h3>{grupo.titulo}</h3>
                  <ul>{grupo.elementos.map(elemento => <li key={elemento}><Check size={16} strokeWidth={2.4} aria-hidden="true" />{elemento}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>}

          {beneficios.length > 0 && <section id="beneficios" className="fe-section" aria-labelledby="fe-benefits">
            <p className="pg-eyebrow pg-eyebrow-ink">Beneficios</p>
            <h2 id="fe-benefits" className="fe-h2">Por qué destaca</h2>
            <ol className="fe-benefits">
              {beneficios.map((beneficio, index) => <li key={beneficio.titulo}>
                <span className="pg-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{beneficio.titulo}</h3>
                {beneficio.texto && <p>{beneficio.texto}</p>}
              </li>)}
            </ol>
          </section>}

          <section id="ubicacion" className="fe-section" aria-labelledby="fe-location">
            <p className="pg-eyebrow pg-eyebrow-ink">Ubicación y zona</p>
            <h2 id="fe-location" className="fe-h2">Qué hay cerca</h2>
            <PropertyLocation property={property} />
          </section>

          {ficha.length > 0 && <section id="ficha-tecnica" className="fe-section" aria-labelledby="fe-tech">
            <p className="pg-eyebrow pg-eyebrow-ink">Datos con fuente</p>
            <h2 id="fe-tech" className="fe-h2">Ficha técnica</h2>
            <dl className="fe-card fe-tech">
              {ficha.map((row) => <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
                {row.source ? <span className={"fe-source" + (row.confirmed ? " is-confirmed" : "")}>{row.source}</span> : <span />}
              </div>)}
            </dl>
            <div className="fe-card fe-availability">
              <h3>Disponibilidad y entrega</h3>
              <p>{property.informacionPublica?.disponibilidadRevisadaEl
                ? `Disponibilidad revisada el ${new Date(`${property.informacionPublica.disponibilidadRevisadaEl}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. Confírmala antes de programar una visita.`
                : "Confirma la disponibilidad antes de programar una visita."}</p>
              {property.informacionPublica?.ocupacionEntrega ? <p>{property.informacionPublica.ocupacionEntrega}</p> : null}
            </div>
          </section>}

          <section id="documentos" className="fe-section" aria-labelledby="fe-docs">
            <p className="pg-eyebrow pg-eyebrow-ink">{documentos.length ? "Documentos y costos" : "Costos"}</p>
            <h2 id="fe-docs" className="fe-h2">Para decidir con números</h2>
            <div className={"fe-docs-grid" + (documentos.length ? "" : " is-single")}>
              {documentos.length > 0 && <div className="fe-docs">
                <PropertyDocuments documentos={documentos} slug={property.slug} codigo={property.codigo} />
              </div>}
              <div id="costos" className="fe-card fe-costs">
                <dl>
                  <div><dt>{property.operacion === "renta" ? "Renta" : "Precio"}</dt><dd>{formatPrecio(property.precio)}</dd></div>
                  {costos.predialAnual != null && <div><dt>Predial anual</dt><dd>{money(costos.predialAnual, property)}</dd></div>}
                  {costos.mantenimientoMensual != null && <div><dt>Mantenimiento mensual</dt><dd>{money(costos.mantenimientoMensual, property)}</dd></div>}
                </dl>
                {property.operacion === "venta" && <Link href="/herramientas/gastos-de-cierre" className="pg-link">Calcular gastos de cierre</Link>}
                {muestraCalculadora && property.precio.modalidad === "publico" ? (
                  <details className="fe-mortgage">
                    <summary>Calcular mi mensualidad</summary>
                    <div className="fe-mortgage-body"><MortgageCalculator precio={property.precio.monto} moneda={property.precio.moneda} /></div>
                  </details>
                ) : null}
              </div>
            </div>
          </section>

          <section id="preguntas" className="fe-section" aria-labelledby="fe-faq">
            <p className="pg-eyebrow pg-eyebrow-ink">Preguntas</p>
            <h2 id="fe-faq" className="fe-h2">Antes de visitarla</h2>
            <PropertyFaq />
          </section>
        </div>

        <aside className="fe-aside" aria-label="Visita y contacto">
          <VisitPlanner slug={property.slug} codigo={property.codigo} titulo={property.titulo}
            asesor={asesor ? { nombre: asesor.nombre, cargo: asesor.cargo, iniciales: asesor.iniciales } : undefined}
            channels={{ whatsapp: contact.whatsapp, phoneHref: contact.phoneHref, emailHref: contact.emailHref }} />
          <SharePanel title={share.title} text={share.text} url={share.url} qrSvg={qr} />
        </aside>
      </div>

      {conjunto.locales.length > 0 && <section className="fe-related inv-page" aria-labelledby="fe-units">
        <div className="pg-container">
          <h2 id="fe-units" className="fe-h2">Locales de esta plaza</h2>
          <div className="property-catalog-grid">
            {conjunto.locales.map((p) => <PropertyCard key={p.slug} property={p} />)}
          </div>
        </div>
      </section>}

      {related.length > 0 && <section className="fe-related inv-page" aria-labelledby="fe-related">
        <div className="pg-container">
          <h2 id="fe-related" className="fe-h2">También te puede interesar</h2>
          <div className="property-catalog-grid">
            {related.map((p) => <PropertyCard key={p.slug} property={p} />)}
          </div>
        </div>
      </section>}

      <PropertyMobileCta settings={settings} message={`Hola, quiero agendar una visita a ${property.titulo} (${property.codigo}). ${pageUrl}`} />
    </main>
  );
}
