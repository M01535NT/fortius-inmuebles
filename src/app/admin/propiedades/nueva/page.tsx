"use client";

import { PageHeader } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";

export default function NuevaPropiedadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo inmueble."
        description="Todo es editable después. Los campos vacíos simplemente no se muestran en el sitio."
      />
      <PropertyForm />
    </div>
  );
}
