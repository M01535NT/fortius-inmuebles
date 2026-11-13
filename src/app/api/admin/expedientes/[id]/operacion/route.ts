import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { expedienteOperationWrite } from "@/lib/formatos/expediente-operations";

const workflowMessages = new Set([
 "No cambies el tipo de una operación avanzada; conserva su historial", "La guía no se elimina; registra pausa o descarte",
 "La operación inicia en captación o perfil", "Completa la guía activa y conserva el contexto antes de avanzar",
 "Avanza una etapa a la vez", "Resuelve las observaciones abiertas", "Vincula el inmueble antes de negociar",
 "La operación contraparte requiere revisión antes del cierre", "Identifica la contraparte interna o externa",
 "Resuelve o descarta las tareas pendientes antes de archivar", "Agenda una próxima tarea con fecha y responsable",
 "La captación debe corresponder al asesor titular del inmueble", "Contraparte incompatible o fuera de tu alcance",
 // COR-23 y COR-20: lo que solo decide o autoriza el director.
 "Esta revisión la marca el director; déjala como «Lo tengo»", "Tomar el encargo lo decide el director",
 "Solo el director autoriza una excepción", "Este requisito protege al cliente y no admite excepción",
 "Escribe el motivo de la excepción (al menos 10 caracteres)",
]);
import { discardReasonOf, DISCARD_REASONS, WORKFLOW_REQUIREMENTS, type RequirementKey } from "@/lib/formatos/operation-workflow";
import { initialBlockers, loadInitialStatus, needsInitialGate } from "@/lib/formatos/operation-gates";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = expedienteOperationWrite.parse(await readJson(request));
    // Candado del arranque del propietario (02, 04 y checklist), el mismo que aplica el panel.
    const current = await client.from("fortius_inmuebles_expedientes").select("etapa,operacion,flujo").eq("id", id).is("deleted_at", null).maybeSingle();
    if (current.error) databaseError(current.error);
    if (!current.data) throw new ApiError(404, "Expediente no encontrado");
    // COR-14 (RP-97): al descartar, el motivo sale de la lista fija; los ya descartados conservan el suyo.
    const before = (current.data.flujo as { estado?: string } | null)?.estado;
    if (input.flujo?.estado === "descartada" && before !== "descartada" && !discardReasonOf(input.flujo.motivo.trim()))
      throw new ApiError(400, `Elige el motivo del descarte: ${DISCARD_REASONS.join(", ")}.`);
    if (needsInitialGate(current.data, input.etapa, input.flujo)) {
      const pending = initialBlockers(await loadInitialStatus(client, id));
      if (pending.length) throw new ApiError(409, `Antes de avanzar: ${pending.join("; ")}`);
    }
    const { data, error } = await client.rpc("fortius_inmuebles_update_operation", {
      p_id:id,p_version:input.version,p_stage:input.etapa,p_date:input.fechaObjetivo,p_checklist:input.checklist,
      p_flow:input.flujo??null,p_slug:input.propiedadSlug??null,p_property_specified:input.propiedadSlug!==undefined,
    });
    if (error) {
      const pendingKey=error.message?.startsWith("Requisito de avance pendiente: ")?error.message.slice("Requisito de avance pendiente: ".length):"";
      if(error.code==="PT409"&&Object.hasOwn(WORKFLOW_REQUIREMENTS,pendingKey))
        throw new ApiError(409,`Requisito pendiente: ${WORKFLOW_REQUIREMENTS[pendingKey as RequirementKey].label}`);
      if (["PT400","PT403","PT409"].includes(error.code) && workflowMessages.has(error.message))
        throw new ApiError(Number(error.code.slice(2)),error.message);
      databaseError(error);
    }
    if (!data) throw new ApiError(409, "El expediente cambió o no está disponible; recarga antes de continuar");
    return { expediente: data };
  });
}
