"use client";
import * as React from "react";
import { RouteTabs } from "@/components/admin/workspace/route-tabs";
import CalendarioScreen from "@/components/admin/screens/calendario";
import TareasScreen from "@/components/admin/screens/tareas";

export default function AgendaPage() {
  return <React.Suspense fallback={null}>
    <RouteTabs label="Vista de la agenda" idPrefix="agenda" tabs={[
      { id: "agenda", label: "Agenda", render: () => <CalendarioScreen /> },
      { id: "tareas", label: "Tareas", render: () => <TareasScreen /> },
    ]} />
  </React.Suspense>;
}
