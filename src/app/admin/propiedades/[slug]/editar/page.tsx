"use client";

import * as React from "react";
import { PropertyFile } from "@/components/admin/properties/property-file";

/*
  Ficha del inmueble por slug (SIM-19): abre en «Ficha pública»; «?tab=» elige otra pestaña.
  El slug llega vía React.use(params) y la ficha conserva la instantánea que abrió la edición.
*/
export default function EditarPropiedadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  return <PropertyFile key={slug} slug={slug} initialTab="ficha" />;
}
