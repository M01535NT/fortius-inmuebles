"use client";
import * as React from "react";
import { RouteTabs } from "@/components/admin/workspace/route-tabs";
import ProspectosScreen from "@/components/admin/screens/prospectos";
import ClientesScreen from "@/components/admin/screens/clientes";

export default function ContactosPage() {
  return <React.Suspense fallback={null}>
    <RouteTabs label="Tipo de contacto" idPrefix="contactos" tabs={[
      { id: "prospectos", label: "Prospectos", render: () => <ProspectosScreen /> },
      { id: "clientes", label: "Clientes", render: () => <ClientesScreen /> },
    ]} />
  </React.Suspense>;
}
