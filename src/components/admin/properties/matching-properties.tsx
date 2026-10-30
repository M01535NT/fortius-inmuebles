"use client";
import Link from "next/link";
import { Building2 } from "@/components/admin/icons";
import { Pill, Thumb } from "@/components/admin/kit";
import { lastNotice, priceDroppedSince, propertiesFor, type Seeker } from "@/lib/admin/buyer-matches";
import { formatPrecio } from "@/data/propiedades";
import { db, useCollection } from "@/lib/admin/store";
import f from "@/components/admin/form.module.css";

/*
  Inmuebles publicados que le pueden servir a quien busca comprar o rentar (titular,
  29/10/2026). El aviso se envía y se registra desde el seguimiento del inmueble, para
  que quede un solo registro por inmueble y persona.
*/
export function MatchingProperties({ seeker }: { seeker: Seeker }) {
  const properties = useCollection(db.propiedades);
  if (!["comprar", "rentar", "invertir"].includes(seeker.perfil?.operacion ?? "")) return null;
  const matches = propertiesFor(seeker, properties).slice(0, 6);
  return <section aria-labelledby={`coincidencias-${seeker.id}`} className={f.group}>
    <div className={f.groupHead}><h2 id={`coincidencias-${seeker.id}`}>Inmuebles que le pueden servir</h2><p>{matches.length ? `${matches.length} publicados` : "Ninguno por ahora"}</p></div>
    {matches.length ? <ul className="flex flex-col gap-2">{matches.map(({ property, reasons }) => {
      const notice = lastNotice(property, seeker);
      return <li key={property.slug}><Link href={`/admin/propiedades/${encodeURIComponent(property.slug)}/seguimiento?seccion=compradores`} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-border p-3 hover:bg-secondary">
        <Thumb src={property.galeria[0]?.src} size={44} icon={<Building2 size={18} aria-hidden="true" />} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5"><strong className="[overflow-wrap:anywhere]">{property.titulo}</strong><small className="text-muted-foreground [overflow-wrap:anywhere]">{[formatPrecio(property.precio), ...reasons].join(" · ")}</small></span>
        {priceDroppedSince(property, notice) ? <Pill size="sm" tone="warn">Bajó de precio</Pill> : <Pill size="sm" tone={notice ? "success" : "brand"}>{notice ? "Avisado" : "Por avisar"}</Pill>}
      </Link></li>;
    })}</ul> : <p className="text-sm text-muted-foreground">Cuando se publique un inmueble con su tipo, zona o presupuesto, aparecerá aquí.</p>}
  </section>;
}
