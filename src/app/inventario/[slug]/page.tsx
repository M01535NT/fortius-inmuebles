import type { Metadata } from "next";
import { propertyShare, propertyShareMetadata } from "@/lib/property-share";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MapPin } from "lucide-react";

import { AgentProfile } from "@/components/property/agent-profile";
import { MessagingContact } from "@/components/contact/messaging-actions";
import { ContactDock } from "@/components/property/contact-dock";
import { Container } from "@/components/layout/container";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyDocuments } from "@/components/property/property-documents";
import { PropertyFaq } from "@/components/property/property-faq";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyInterestForm } from "@/components/property/property-interest-form";
import { PropertyLocation } from "@/components/property/property-location";
import { PropertyMobileCta } from "@/components/property/property-mobile-cta";
import { getPublicAdvisers, getPublicSettings } from "@/lib/backend/public";
import {
  ESTADO_LABELS,
  FUENTE_SUPERFICIE_LABELS,
  formatPrecio,

  OPERACION_LABELS,
  TIPO_LABELS,
  type Property,
} from "@/data/propiedades";
import {
  getPropertyBySlug,
  getRelatedProperties,
} from "@/lib/inventario";
import { siteConfig } from "@/data/site";

type Params = { slug: string };

/* Cada solicitud consulta el inventario publicado del panel MNT. */
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};
  return propertyShareMetadata(property);
}

/* Ficha técnica: solo filas con dato; números en mono. */
function fichaRows(p: Property): { label: string; value: string; source?: string }[] {
  const f = p.ficha;
  const rows: { label: string; value: string; source?: string }[] = [];
  if (f.terrenoM2 != null) rows.push({ label: "Terreno", value: `${f.terrenoM2} m²`, source: p.informacionPublica?.fuenteTerreno ? FUENTE_SUPERFICIE_LABELS[p.informacionPublica.fuenteTerreno] : "Fuente por confirmar" });
  if (f.construccionM2 != null) rows.push({ label: "Construcción", value: `${f.construccionM2} m²`, source: p.informacionPublica?.fuenteConstruccion ? FUENTE_SUPERFICIE_LABELS[p.informacionPublica.fuenteConstruccion] : "Fuente por confirmar" });
  if (f.recamaras) rows.push({ label: "Recámaras", value: String(f.recamaras) });
  if (f.banos) rows.push({ label: "Baños", value: String(f.banos) });
  if (f.estacionamientos) rows.push({ label: "Estacionamientos", value: String(f.estacionamientos) });
  if (f.antiguedad) rows.push({ label: "Antigüedad", value: f.antiguedad });
  return rows;
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

export default async function PropertyDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const [related, advisers, settings] = await Promise.all([
    getRelatedProperties(slug), getPublicAdvisers(), getPublicSettings(),
  ]);
  const ficha = fichaRows(property);
  const asesor = advisers.find((a) => a.id === property.asesorId);
  const muestraCalculadora =
    property.creditoDisponible &&
    property.operacion === "venta" &&
    property.precio.modalidad === "publico";

  return (
    <main className="bg-background pb-24 pt-24 md:pb-0 md:pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(property) }} />

      <Container className="pb-16 md:pb-24">
        <Link
          href="/inventario"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Volver al inventario
        </Link>

        {property.demo && (
          <p className="mt-5 rounded-md border border-border bg-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
            <strong>Propiedad de demostración.</strong> Los datos y el precio son de ejemplo; esta ficha no anuncia una oferta real.
          </p>
        )}

        {/* Galería primero, 16:9 completo en el primer viewport. */}
        <div className="mt-5">
          <PropertyGallery
            imagenes={property.galeria}
            titulo={property.titulo}
            share={propertyShare(property)}
            videoUrl={property.videoUrl}
            tour360Url={property.tour360Url}
            fichaUrl={`/inventario/${encodeURIComponent(property.slug)}/ficha-tecnica`}
          />
        </div>

        {/* Encabezado debajo del medio */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-border pb-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              {property.codigo} · {TIPO_LABELS[property.tipo]} ·{" "}
              {OPERACION_LABELS[property.operacion]}
            </p>
            <h1 className="display-title mt-2 max-w-[26ch] text-3xl text-foreground sm:text-4xl md:text-4xl">
              {property.titulo}
            </h1>
            <p className="mt-2.5 flex items-center gap-2 text-base text-muted-foreground">
              <MapPin className="size-4 shrink-0 text-primary" strokeWidth={1.5} />
              {property.zona} · {property.direccionAproximada}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="display-soft text-2xl text-foreground md:text-3xl">
              {formatPrecio(property.precio)}
            </p>
            {property.estado !== "disponible" ? (
              <p className="mt-1.5 inline-block rounded-sm border border-border bg-secondary px-2.5 py-1 font-mono text-xs uppercase tracking-[0.06em] text-foreground">
                {ESTADO_LABELS[property.estado]}
              </p>
            ) : null}
          </div>
        </div>

        {/* Cuerpo */}
        {/* min-w-0 en ambas columnas: sin él, cualquier texto nowrap
            (truncate) dentro propaga su min-content y ensancha la página. */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.42fr]">
          <div className="min-w-0">
            {property.estado === "apartada" ? (
              <p className="mb-8 rounded-md border border-border bg-secondary/60 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                Esta propiedad está apartada. Podemos avisarte si vuelve a
                estar disponible o mostrarte opciones similares.
              </p>
            ) : null}
            {property.estado === "rentada" ? (
              <p className="mb-8 rounded-md border border-border bg-secondary/60 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                Esta propiedad ya fue rentada. Podemos mostrarte opciones similares.
              </p>
            ) : null}

            <div className="space-y-5">
              {property.descripcion.map((parrafo) => (
                <p key={parrafo.slice(0, 32)} className="max-w-[68ch] text-base leading-relaxed text-foreground/85">
                  {parrafo}
                </p>
              ))}
            </div>

            {/* Ficha técnica */}
            {ficha.length > 0 ? (
              <div className="mt-12">
                <h2 className="display-soft text-2xl text-foreground">Ficha técnica</h2>
                <dl className="mt-5 max-w-[560px]">
                  {ficha.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-6 border-b border-border py-3.5"
                    >
                      <dt className="text-sm text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-mono text-sm text-foreground">{row.value}{row.source ? <span className="mt-1 block font-sans text-xs text-muted-foreground">{row.source}</span> : null}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="mt-10 max-w-[560px] border-t border-border pt-5">
              <h2 className="display-soft text-xl text-foreground">Disponibilidad y entrega</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {property.informacionPublica?.disponibilidadRevisadaEl
                  ? `Disponibilidad revisada el ${new Date(`${property.informacionPublica.disponibilidadRevisadaEl}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. Confírmala antes de programar una visita.`
                  : "Confirma la disponibilidad antes de programar una visita."}
              </p>
              {property.informacionPublica?.ocupacionEntrega ? <p className="mt-2 text-sm leading-relaxed text-foreground/85">{property.informacionPublica.ocupacionEntrega}</p> : null}
            </div>

            {/* Amenidades */}
            {property.amenidades.length > 0 ? (
              <div className="mt-12">
                <h2 className="display-soft text-2xl text-foreground">Amenidades</h2>
                <ul className="mt-5 grid max-w-[560px] gap-x-8 gap-y-3 sm:grid-cols-2">
                  {property.amenidades.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 text-base text-foreground/85">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.5} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Ubicación: mapa por zona + puntos de interés */}
            <PropertyLocation property={property} />

            {/* Perfil completo del asesor titular */}
            {asesor ? <AgentProfile asesor={asesor} settings={settings} /> : null}

            <PropertyFaq />
          </div>

          {/* Aside: asesor → calculadora → formulario de interés */}
          <aside className="min-w-0 space-y-4">
            {asesor ? (
              <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
                {/* Avatar de iniciales: sin fotos de personas hasta tener el equipo real. */}
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-sm text-foreground"
                >
                  {asesor.iniciales}
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">{asesor.nombre}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{asesor.cargo}</p>
                </div>
              </div>
            ) : null}

            {muestraCalculadora && property.precio.modalidad === "publico" ? (
              <MortgageCalculator precio={property.precio.monto} moneda={property.precio.moneda} />
            ) : null}

            <div id="interes" className="scroll-mt-24 rounded-lg border border-border bg-card p-6">
              <MessagingContact settings={settings} title="Hablemos de esta propiedad." message={`Hola, me interesa ${property.titulo} (${property.codigo}). ${new URL(`/inventario/${property.slug}`, siteConfig.url).href}`}>
              <PropertyInterestForm
                slug={property.slug}
                codigo={property.codigo}
                titulo={property.titulo}
              />
              </MessagingContact>
            </div>

            {/* Documentos en PDF (se administran desde el panel) */}
            <PropertyDocuments
              documentos={property.documentos ?? []}
              slug={property.slug}
              codigo={property.codigo}
            />
          </aside>
        </div>

        {/* Relacionadas */}
        {related.length > 0 ? (
          <div className="mt-20 border-t border-border pt-12 md:mt-28">
            <h2 className="display-title text-3xl text-foreground sm:text-4xl">
              Otras propiedades.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PropertyCard key={p.slug} property={p} />
              ))}
            </div>
          </div>
        ) : null}
      </Container>

      <PropertyMobileCta settings={settings} message={`Hola, quiero agendar una visita a ${property.titulo} (${property.codigo}). ${new URL(`/inventario/${property.slug}`, siteConfig.url).href}`} />
      <ContactDock settings={settings} message={`Hola, me interesa ${property.titulo} (${property.codigo}). ${new URL(`/inventario/${property.slug}`, siteConfig.url).href}`} />
    </main>
  );
}
