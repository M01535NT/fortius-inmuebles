"use client";
import { useCallback, useMemo, useState } from "react";

import { Desplegable } from "@/components/panel/kit/desplegable";
import type { Asesor } from "@/lib/domain/records";
import { useSession } from "@/lib/panel/legado/sesion";

/**
 * «Lo lleva» (PN-10): el director ve todo el equipo y puede quedarse con lo suyo o con lo de un asesor.
 * El asesor no lo ve: la base ya le muestra solo lo suyo. Solo ofrece los asesores que tienen algo en la lista.
 */
export function useLoLleva(asesorIds: readonly (string | null | undefined)[], miAsesor: string | null, asesores: readonly Asesor[]) {
  const esDirector = useSession()?.role === "admin";
  const [lleva, setLleva] = useState("");
  const opciones = useMemo(() => {
    const presentes = new Set(asesorIds.filter(Boolean));
    return [
      ...(miAsesor && presentes.has(miAsesor) ? [{ valor: "mios", etiqueta: "Los míos" }] : []),
      ...asesores.filter((a) => a.id !== miAsesor && presentes.has(a.id)).map((a) => ({ valor: a.id, etiqueta: a.nombre })),
    ];
  }, [asesorIds, miAsesor, asesores]);
  const objetivo = lleva === "mios" ? miAsesor : lleva;
  const pasa = useCallback((asesorId: string | null | undefined) => !lleva || asesorId === objetivo, [lleva, objetivo]);
  const visible = esDirector && opciones.length > 1;
  const control = visible ? <Desplegable etiqueta="Lo lleva" valor={lleva} vacio="Todo el equipo" opciones={opciones} alElegir={setLleva} /> : null;
  return { pasa, control, activo: visible && !!lleva, quitar: () => setLleva("") };
}
