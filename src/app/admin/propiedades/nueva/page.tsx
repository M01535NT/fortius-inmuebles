"use client";

import { PageHeader } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";

export default function NuevaPropiedadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo inmueble."
        description="Alta privada por defecto. La publicación se activa expresamente y requiere al menos una imagen pública."
      />
      <PropertyForm />
    </div>
  );
}
