import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError } from "./http";
import { propiedadVisible } from "./repository";
import { operationWorkflowSchema, publicationBlockers, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { operationalDate } from "@/lib/admin/operational-date";
import { sharedPublicationBlockers } from "@/lib/admin/shared-property";
import type { PropertyAlly } from "@/lib/propiedad-seguimiento";

type DatabaseClient = Pick<SupabaseClient, "from">;
export const NO_CAPTURE_OPERATION = "Abrir una operación de captación vinculada y completar sus revisiones y autorización.";

/** Elige la captación vinculada con menos faltantes para publicar el inmueble (la misma regla que ve la puerta del navegador). */
export async function publicationReadiness(client: DatabaseClient, slug: string, operacion: unknown): Promise<{ expedienteId?: string; faltantes: string[] }> {
  const { data, error } = await client.from("fortius_inmuebles_expedientes").select("id,etapa,flujo").eq("propiedad_slug", slug).is("deleted_at", null).eq("operacion", operacion);
  if (error) databaseError(error);
  const today = operationalDate();
  const best = ((data ?? []) as { id: string; etapa: string; flujo: { ruta?: string } | null }[])
    .filter(e => ["captacion", "arrendador"].includes(e.flujo?.ruta ?? ""))
    .map(e => {
      const parsed = operationWorkflowSchema.safeParse(e.flujo);
      return { expedienteId: e.id, faltantes: publicationBlockers(parsed.success ? parsed.data : null, e.etapa as WorkflowStage, today) };
    })
    .sort((a, b) => a.faltantes.length - b.faltantes.length)[0];
  return best ?? { faltantes: [NO_CAPTURE_OPERATION] };
}

/**
 * COR-16, relajado el 16/11/2026 («sin frenos de protección»): al guardar un inmueble con `publicada: true`
 * ya no se exige la captación en comercialización ni, en un compartido, la autorización escrita del aliado.
 * Se devuelve lo que falta para avisarlo. Un inmueble que ya estaba publicado no avisa de nuevo.
 */
export async function publicationWarnings(client: Pick<SupabaseClient, "from" | "rpc">, slug: string, record: Record<string, unknown>): Promise<string[]> {
  if (record.publicada !== true) return [];
  if ((await propiedadVisible(client, slug))?.publicada === true) return [];
  // PUB-02: un compartido no tiene captación; se avisa si falta la inmobiliaria o su autorización (la base exige al director).
  const { faltantes } = record.origen === "compartido" ? { faltantes: sharedPublicationBlockers(record.aliado as PropertyAlly | undefined) } : await publicationReadiness(client, slug, record.operacion);
  return faltantes;
}
