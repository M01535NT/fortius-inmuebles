"use client";
import * as React from "react";
import { RouteTabs } from "@/components/admin/workspace/route-tabs";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { AgendaCalendar } from "@/components/admin/agenda/calendar";
import TareasScreen from "@/components/admin/screens/tareas";
import { db, useCollection } from "@/lib/admin/store";
import { isTaskOpen } from "@/lib/tasks";

export default function AgendaPage() {
  const open = useCollection(db.tareas).filter(isTaskOpen).length;
  return <GuidedPage title="Agenda">
    <React.Suspense fallback={null}>
      <RouteTabs label="Vista de la agenda" idPrefix="agenda" tabs={[
        { id: "agenda", label: "Agenda", render: () => <AgendaCalendar /> },
        { id: "tareas", label: "Tareas", count: open, render: () => <TareasScreen /> },
      ]} />
    </React.Suspense>
  </GuidedPage>;
}
