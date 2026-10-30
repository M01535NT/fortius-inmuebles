import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError } from "@/lib/backend/http";
import { defaultRoute } from "@/lib/admin/operation-view";
import { checklistCompleto, checklistTaskId, type PasoChecklist } from "./checklist-documentos";
import { isOwnerRoute, type InitialInterviewStatus, type OperationWorkflow } from "./operation-workflow";

/*
  Candados del flujo del propietario en el servidor (sin migración): los mismos que muestra
  el panel en «Te falta». Para salir de captación hacia el dictamen se exige la entrevista
  inicial (02) y el levantamiento (04) emitidos en su versión vigente, y el checklist de
  documentos completo. Lo demás (requisitos, una etapa a la vez) lo valida la base.
*/

type Expediente = { etapa: string | null; operacion: string; flujo: OperationWorkflow | null };
type Draft = { id: string; formato_id: string; version: number; updated_at: string };

/** Qué falta del arranque del propietario, con las mismas palabras del panel. */
export function initialBlockers(status: InitialInterviewStatus): string[] {
  return [
    ...(status.documentos !== "completo" ? ["Recibe los documentos del checklist"] : []),
    ...(!status.emitida ? ["Termina la entrevista inicial (02) y genera su PDF"] : []),
    ...(status.levantamiento !== "emitido" ? ["Termina el levantamiento (04) y genera su PDF"] : []),
  ];
}

/** Sólo aplica a ventas y rentas guiadas del propietario que salen de captación. */
export function needsInitialGate(current: Expediente, nextStage: string, nextFlow?: OperationWorkflow) {
  if (!["venta", "renta"].includes(current.operacion)) return false;
  const route = (nextFlow ?? current.flujo)?.ruta ?? defaultRoute(current.operacion);
  return isOwnerRoute(route) && (current.etapa ?? "captacion") === "captacion" && nextStage !== "captacion";
}

const latest = (drafts: Draft[], match: (formato: string) => boolean) => drafts.filter(d => match(d.formato_id)).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

/** Calcula el estado del arranque con los borradores, emisiones y la tarea del checklist del expediente. */
export async function loadInitialStatus(client: SupabaseClient, expedienteId: string): Promise<InitialInterviewStatus> {
  const [drafts, task] = await Promise.all([
    client.from("fortius_inmuebles_formato_drafts").select("id,formato_id,version,updated_at").eq("expediente_id", expedienteId),
    client.from("fortius_inmuebles_records").select("data").eq("collection", "tareas").eq("id", checklistTaskId(expedienteId)).maybeSingle(),
  ]);
  if (drafts.error) databaseError(drafts.error);
  if (task.error) databaseError(task.error);
  const list = (drafts.data ?? []) as Draft[];
  const interview = latest(list, f => f === "02"), survey = latest(list, f => f.startsWith("04"));
  const tracked = [interview, survey].filter((d): d is Draft => !!d);
  let emitted = new Set<string>();
  if (tracked.length) {
    const emissions = await client.from("fortius_inmuebles_formato_emissions").select("draft_id,draft_version").in("draft_id", tracked.map(d => d.id));
    if (emissions.error) databaseError(emissions.error);
    emitted = new Set((emissions.data ?? []).map(e => `${e.draft_id}:${e.draft_version}`));
  }
  const current = (d?: Draft) => !!d && emitted.has(`${d.id}:${d.version}`);
  const pasos = (task.data?.data as { pasos?: PasoChecklist[] } | undefined)?.pasos;
  return {
    iniciada: !!interview, emitida: current(interview),
    levantamiento: survey ? (current(survey) ? "emitido" : "borrador") : undefined,
    // «No aplica» con su motivo cuenta como completo (COR-06).
    documentos: task.data ? (Array.isArray(pasos) && checklistCompleto(pasos.filter(Boolean)) ? "completo" : "pendiente") : undefined,
  };
}
