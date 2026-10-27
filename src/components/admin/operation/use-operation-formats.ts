"use client";
import * as React from "react";
import { apiRequest } from "@/lib/admin/store";

type Page = { documentos?: Array<{ expedienteId: string; formatoId: string; emitido?: boolean }>; nextOffset?: number | null };

/**
  Formatos de cada operación: si existen y si la versión actual del más reciente está emitida.
  Los levantamientos 04A–04G cuentan como «04». Lo usan Operaciones y Hoy para nombrar la etapa
  con los mismos datos (COR-03). Si la consulta falla, el mapa queda vacío y la etapa se muestra
  con lo que haya.
*/
export function useOperationFormats(attempt = 0): Map<string, Map<string, boolean>> {
  const [formats, setFormats] = React.useState<Map<string, Map<string, boolean>>>(new Map());
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const byOperation = new Map<string, Map<string, boolean>>();
      for (let offset: number | null = 0; offset !== null && offset < 5000;) {
        const page: Page = await apiRequest(`/api/admin/documentos?limit=100&offset=${offset}`);
        for (const d of page.documentos ?? []) {
          const formato = d.formatoId.startsWith("04") ? "04" : d.formatoId;
          if (!byOperation.has(d.expedienteId)) byOperation.set(d.expedienteId, new Map());
          // La lista llega del más reciente al más antiguo: el primero de cada formato es el vigente.
          const own = byOperation.get(d.expedienteId)!;
          if (!own.has(formato)) own.set(formato, d.emitido === true);
        }
        offset = page.nextOffset ?? null;
      }
      if (alive) setFormats(byOperation);
    })().catch(() => undefined);
    return () => { alive = false; };
  }, [attempt]);
  return formats;
}
