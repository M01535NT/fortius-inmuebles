import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PropertyCard } from "@/components/property/property-card";
import type { Property } from "@/data/propiedades";

export function NocturnoDestacadas({ properties }: { properties: Property[] }) {
  return <section id="destacadas" aria-labelledby="destacadas-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <p className="nx-eyebrow">Inventario</p>
        <h2 id="destacadas-title" className="nx-title">Propiedades destacadas</h2>
      </div>
      <Link href="/inventario" className="nx-link">Explorar el inventario <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
    {properties.length
      ? <div className="nx-props-grid">{properties.map((property) => <PropertyCard key={property.slug} property={property} />)}</div>
      : <p className="nx-empty">Por ahora no hay propiedades destacadas disponibles. Puedes consultar el inventario completo.</p>}
  </section>;
}
