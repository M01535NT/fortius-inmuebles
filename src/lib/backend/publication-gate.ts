import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, databaseError } from "./http";
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
 * COR-16: al guardar un inmueble con `publicada: true`, el servidor exige la captación en comercialización
 * con sus revisiones completas. Un inmueble que ya estaba publicado conserva su publicación al guardarse.
 */
export async function assertPropertyPublicationAllowed(client: DatabaseClient, slug: string, record: Record<string, unknown>): Promise<void> {
  if (record.publicada !== true) return;
  const stored = await client.from("fortius_inmuebles_records").select("data").eq("collection", "propiedades").eq("id", slug).maybeSingle();
  if (stored.error) databaseError(stored.error);
  if ((stored.data?.data as { publicada?: unknown } | undefined)?.publicada === true) return;
  // PUB-02: un compartido no tiene captación; pide la inmobiliaria y su autorización (la base exige además al director).
  const { faltantes } = record.origen === "compartido" ? { faltantes: sharedPublicationBlockers(record.aliado as PropertyAlly | undefined) } : await publicationReadiness(client, slug, record.operacion);
  if (faltantes.length) throw new ApiError(400, `Para publicar falta: ${faltantes.join("; ")}`, { faltantes });
}
