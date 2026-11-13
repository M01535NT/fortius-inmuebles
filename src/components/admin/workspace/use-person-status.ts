"use client";
import * as React from "react";
import { captureStatus, clientStatus, leadStatus } from "@/lib/admin/person-status";
import { useTodayData } from "./use-today-queue";

/**
  Condición calculada de personas e inmuebles (COR-10) con las operaciones que ya carga el panel
  para Hoy y el menú. Mientras no llegan (o si fallan) devuelve `undefined`: la pantalla no
  adivina si alguien es cliente.
*/
export function usePersonStatus() {
  const { dossiers } = useTodayData(60_000);
  return React.useMemo(() => ({
    ofClient: (id: string) => dossiers ? clientStatus(id, dossiers) : undefined,
    ofLead: (lead: { id: string; clienteId?: string | null }) => dossiers ? leadStatus(lead, dossiers) : undefined,
    ofProperty: (slug: string) => dossiers ? captureStatus(slug, dossiers) : undefined,
  }), [dossiers]);
}
