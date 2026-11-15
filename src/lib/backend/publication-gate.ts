import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, databaseError } from "./http";
import { propiedadVisible } from "./repository";
import { operationWorkflowSchema, publicationBlockers, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { operationalDate } from "@/lib/admin/operational-date";
import { sharedPublicationBlockers, sharedPublicationWarnings } from "@/lib/admin/shared-property";
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
 * COR-16 y FLX-03 (RP-100): al guardar un inmueble con `publicada: true` se revisa la captación. Un inmueble
 * propio se publica aunque falte algo: devuelve lo que falta como aviso y la base lo anota en el historial del asunto.
 * Un compartido necesita la inmobiliaria ligada (PUB-02); sin la autorización escrita se publica con aviso.
 * Un inmueble que ya estaba publicado conserva su publicación al guardarse.
 */
export async function assertPropertyPublicationAllowed(client: Pick<SupabaseClient, "from" | "rpc">, slug: string, record: Record<string, unknown>): Promise<string[]> {
  if (record.publicada !== true) return [];
  if ((await propiedadVisible(client, slug))?.publicada === true) return [];
  if (record.origen === "compartido") {
    const faltantes = sharedPublicationBlockers(record.aliado as PropertyAlly | undefined);
    if (faltantes.length) throw new ApiError(400, `Para publicar falta: ${faltantes.join("; ")}`, { faltantes });
    return sharedPublicationWarnings(record.aliado as PropertyAlly | undefined);
  }
  return (await publicationReadiness(client, slug, record.operacion)).faltantes;
}
