"use client";

import * as React from "react";
import Link from "next/link";

import { EmptyState, PageHeader, btnGhost } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";
import { db, useCollection } from "@/lib/admin/store";

/*
  Edición por slug. Ruta client-side: el slug llega vía React.use(params)
  y la propiedad se busca en la capa local.
*/
export default function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const propiedades = useCollection(db.propiedades);
  const property = propiedades.find((p) => p.slug === slug);

  /* Aún hidratando (SSR devuelve lista vacía). */
  if (propiedades.length === 0) {
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
      <PropertyForm initial={property} />
    </div>
  );
}
