"use client";

import * as React from "react";
import { PropertyFile } from "@/components/admin/properties/property-file";

/* Dirección anterior de «Llaves y compradores»: abre la misma ficha en «Llaves» (o la que pida «?seccion=»). */
export default function SeguimientoPropiedadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  return <PropertyFile key={slug} slug={slug} initialTab="llaves" />;
}
