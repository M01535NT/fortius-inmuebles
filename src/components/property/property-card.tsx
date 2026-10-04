import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { TiltCard } from "@/components/magicui/tilt-card";

import {
  ESTADO_LABELS,
  formatPrecio,
  OPERACION_LABELS,
  TIPO_LABELS,
  type Property,
} from "@/data/propiedades";

export function PropertyCard({ property }: { property: Property }) {
  const href = `/inventario/${property.slug}`;
  const noDisponible = property.estado !== "disponible";

  return (
    <TiltCard max={4}>
    <article data-property-card className="property-editorial-card group">
      <Link
        href={href}
        data-cursor="Ver"
        className="relative block overflow-hidden rounded-lg border border-border"
      >
        <Image
          src={property.galeria[0].src}
          alt={property.galeria[0].alt}
          width={900}
          height={620}
          sizes="(max-width: 768px) 100vw, 33vw"
          className={
            "aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" +
            (property.estado === "vendida" ? " opacity-80" : "")
          }
        />
        {noDisponible ? (
          <span className="absolute left-3 top-3 rounded-sm border border-border bg-background/90 px-2 py-1 font-mono text-xs uppercase tracking-[0.06em] text-foreground">
            {ESTADO_LABELS[property.estado]}
          </span>
        ) : null}
      </Link>
      <div className="grid gap-3 py-5">
        {property.demo && (
          <p className="w-fit rounded-sm border border-border bg-secondary px-2 py-1 text-xs font-medium text-foreground">
            Propiedad de demostración
          </p>
        )}
        <p className="property-eyebrow font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
          {TIPO_LABELS[property.tipo]} · {OPERACION_LABELS[property.operacion]}
        </p>
        <div>
          <h3 className="display-soft text-2xl text-foreground">{property.titulo}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" strokeWidth={1.5} />
            {property.zona}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-foreground">
            {formatPrecio(property.precio)}
          </span>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            Ver detalle
            <ArrowUpRight className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </article>
    </TiltCard>
  );
}
