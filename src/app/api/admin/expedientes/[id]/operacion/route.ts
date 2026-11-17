import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { expedienteOperationWrite } from "@/lib/formatos/expediente-operations";
import { discardReasonOf, DISCARD_REASONS } from "@/lib/formatos/operation-workflow";

/*
  Sin frenos de proceso (titular, 16/11/2026; migración 20261116100000): la ruta ya no exige el arranque
  (02, 04 y checklist), ni la cancelación de hipoteca antes de la firma, ni los requisitos por etapa.
  El panel nuevo lo muestra como avisos del asunto. Se conservan la sesión, el alcance, los permisos
  del director, la validación de datos y la versión (409).
*/
const workflowMessages = new Set([
 "No cambies el tipo de una operación avanzada; conserva su historial", "La guía no se elimina; registra pausa o descarte",
 "La captación debe corresponder al asesor titular del inmueble", "Contraparte incompatible o fuera de tu alcance",
 // COR-23 y COR-20: lo que solo decide o autoriza el director.
 "Esta revisión la marca el director; déjala como «Lo tengo»", "Tomar el encargo lo decide el director",
 "Solo el director autoriza una excepción", "Este requisito protege al cliente y no admite excepción",
 "Escribe el motivo de la excepción (al menos 10 caracteres)",
]);

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = expedienteOperationWrite.parse(await readJson(request));
    const current = await client.from("fortius_inmuebles_expedientes").select("flujo").eq("id", id).is("deleted_at", null).maybeSingle();
    if (current.error) databaseError(current.error);
    if (!current.data) throw new ApiError(404, "Expediente no encontrado");
    // COR-14 (RP-97): al descartar, el motivo sale de la lista fija; los ya descartados conservan el suyo.
    const before = (current.data.flujo as { estado?: string } | null)?.estado;
    if (input.flujo?.estado === "descartada" && before !== "descartada" && !discardReasonOf(input.flujo.motivo.trim()))
      throw new ApiError(400, `Elige el motivo del descarte: ${DISCARD_REASONS.join(", ")}.`);
    const { data, error } = await client.rpc("fortius_inmuebles_update_operation", {
      p_id:id,p_version:input.version,p_stage:input.etapa,p_date:input.fechaObjetivo,p_checklist:input.checklist,
      p_flow:input.flujo??null,p_slug:input.propiedadSlug??null,p_property_specified:input.propiedadSlug!==undefined,
    });
    if (error) {
      if (["PT400","PT403","PT409"].includes(error.code) && workflowMessages.has(error.message))
        throw new ApiError(Number(error.code.slice(2)),error.message);
      databaseError(error);
    }
    if (!data) throw new ApiError(409, "El expediente cambió o no está disponible; recarga antes de continuar");
    return { expediente: data };
  });
}
