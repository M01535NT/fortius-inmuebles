import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { TiltCard } from "@/components/magicui/tilt-card";

import {
  ESTADO_LABELS,
  formatPrecio,
  OPERACION_LABELS,
  TIPO_LABELS,
  type Property,
} from "@/data/propiedades";

export function PropertyCard({ property, extra }: { property: Property; extra?: ReactNode }) {
  const href = `/inventario/${property.slug}`;
  const noDisponible = property.estado !== "disponible";
  const facts = [
    property.ficha.recamaras ? `${property.ficha.recamaras} rec.` : null,
    property.ficha.banos ? `${property.ficha.banos} baños` : null,
    property.ficha.construccionM2 ? `${property.ficha.construccionM2} m² const.` : property.ficha.terrenoM2 ? `${property.ficha.terrenoM2} m² terreno` : null,
  ].filter(Boolean);

  return (
    <TiltCard max={3} className="property-card-motion">
    <article data-property-card className="property-editorial-card group">
      <Link
        href={href}
        data-cursor="Ver"
        className="property-card-image"
      >
        <Image
          src={property.galeria[0].src}
          alt={property.galeria[0].alt}
          width={600}
          height={750}
          sizes="(max-width: 639px) 100vw, (max-width: 1199px) 50vw, 400px"
          className={
            "h-full w-full object-cover" +
            (property.estado === "vendida" || property.estado === "rentada" ? " opacity-80" : "")
          }
        />
        <span className="property-card-badge">
          {noDisponible ? ESTADO_LABELS[property.estado] : OPERACION_LABELS[property.operacion]}
          {property.demo ? " de ejemplo" : ""}
        </span>
      </Link>
      <div className="property-card-copy">
        <div className="property-card-heading">
          <p className="property-card-location">
            <MapPin className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {property.zona}
          </p>
          <h3 className="property-card-title"><Link href={href}>{property.titulo}</Link></h3>
          <p className="property-card-price">{formatPrecio(property.precio)}</p>
        </div>
        <div className="property-card-facts">
          <p>{facts.length ? facts.join(" · ") : TIPO_LABELS[property.tipo]}</p>
          <Link href={href} className="property-card-detail" aria-label={`Ver detalle de ${property.titulo}`}>
            <span className="sr-only">Ver detalle</span><ArrowUpRight className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
        {extra ? <div className="property-card-extra">{extra}</div> : null}
      </div>
    </article>
    </TiltCard>
  );
}
