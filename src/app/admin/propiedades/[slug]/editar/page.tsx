"use client";

import * as React from "react";
import Link from "next/link";

import { EmptyState, PageHeader, btnGhost } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";
import { db, useCollection, useLoadState } from "@/lib/admin/store";

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
      />
      {!current ? (
        <p role="alert" className="text-sm text-destructive">
          El inmueble ya no aparece en el servidor. Conserva el borrador;
          guardarlo requerirá resolver el conflicto.
        </p>
      ) : null}
      <PropertyForm key={slug} initial={property} />
    </div>
  );
}
