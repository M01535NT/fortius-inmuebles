"use client";

import * as React from "react";
import Link from "next/link";

import { EmptyState, PageHeader, btnGhost } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import { HistoryLink } from "@/components/admin/workspace/history-link";
import { db, useCollection, useLoadState } from "@/lib/admin/store";
import { TIPO_LABELS, type Property } from "@/data/propiedades";

/*
  Edición por slug. Ruta client-side: el slug llega vía React.use(params)
  y se conserva la instantánea que abrió la edición.
*/
export default function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  return <PropertyEditor key={slug} slug={slug} />;
}

/*
  Plaza o conjunto (titular, 27/10/2026): si se comercializa completa es este inmueble y su
  operación; los locales que se venden o rentan por separado son inmuebles propios, ligados aquí.
*/
function PlazaUnits({ slug, units }: { slug: string; units: Property[] }) {
  return (
    <section aria-labelledby="locales-plaza" className="space-y-3 rounded-xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="locales-plaza" className="text-lg font-semibold">Locales de esta plaza</h2>
          <p className="text-sm text-muted-foreground">Cada local que se vende o renta por separado es un inmueble con su propia operación y folio. Si la plaza se comercializa completa, se trabaja en la operación de este inmueble.</p>
        </div>
        <Link href={`/admin/propiedades/nueva?conjunto=${encodeURIComponent(slug)}`} className={btnGhost}>Agregar un local de esta plaza</Link>
      </div>
      {units.length ? (
        <ul className="divide-y divide-border">
          {units.map((unit) => (
            <li key={unit.slug} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0"><span className="font-semibold">{unit.titulo}</span> <span className="font-mono text-xs text-muted-foreground">{unit.codigo}</span></span>
              <span className="flex items-center gap-3 text-sm text-muted-foreground">{TIPO_LABELS[unit.tipo]} · {unit.publicada ? "Publicado" : "Sin publicar"}<Link href={`/admin/propiedades/${encodeURIComponent(unit.slug)}/editar`} className="font-semibold text-foreground underline underline-offset-4">Abrir</Link></span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Todavía no hay locales ligados a esta plaza.</p>}
    </section>
  );
}

function PropertyEditor({ slug }: { slug: string }) {
  const propiedades = useCollection(db.propiedades);
  const load = useLoadState(db.propiedades);
  const current = propiedades.find((p) => p.slug === slug);
  const [snapshot, setSnapshot] = React.useState(current);
  if (!snapshot && current) setSnapshot(current);
  const property = snapshot ?? current;
  if (!property && !load.loaded) {
    return <PageHeader title="Editar inmueble." />;
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inmueble no encontrado." />
        <EmptyState title={`No existe "${slug}" en el inventario.`} />
        <Link href="/admin/propiedades" className={btnGhost}>
          Volver al inventario
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar inmueble."
        description={`${property.codigo} · ${property.titulo}`}
        actions={<HistoryLink collection="propiedades" id={slug}/>}
      />
      {!current ? (
        <p role="alert" className="text-sm text-destructive">
          El inmueble ya no aparece en el servidor. Conserva el borrador;
          guardarlo requerirá resolver el conflicto.
        </p>
      ) : null}
      <PropertyForm key={slug} initial={property} />
      {property.tipo === "plaza" ? <PlazaUnits slug={slug} units={propiedades.filter((p) => p.conjunto === slug)} /> : null}
      <RelatedWork propertySlug={slug}/>
    </div>
  );
}
