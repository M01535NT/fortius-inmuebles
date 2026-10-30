"use client";

import * as React from "react";
import { PropertyFollowup } from "@/components/admin/properties/property-followup";

/* Seguimiento privado del inmueble: llaves, preparación y avisos a compradores. */
export default function SeguimientoPropiedadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  return <PropertyFollowup key={slug} slug={slug} />;
}
