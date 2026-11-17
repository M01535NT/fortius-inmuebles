import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { TIPOS_ELEGIBLES } from "@/lib/guias";
import { ACREEDORES, type Acreedor } from "@/lib/tramites";
import { operationWorkflowSchema } from "@/lib/formatos/operation-workflow";
import { cambiaDeTipo, operacionYFlujo } from "@/lib/formatos/tipo-asunto";

type Context = { params: Promise<{ id: string }> };
const input = z.object({
  version: z.number().int().positive(),
  tipo: z.enum(TIPOS_ELEGIBLES),
  acreedor: z.enum(Object.keys(ACREEDORES) as [Acreedor, ...Acreedor[]]).optional(),
}).strict();

/**
  FLX-03 B (DEC-55): cambia el tipo de un asunto sin perder lo hecho. La operación y la guía se
  escriben juntas, con la versión del asunto (409 si otro lo cambió); la base valida la guía y
  anota el cambio en el historial.
*/
export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const body = input.parse(await readJson(request, 1024));
    const current = await client.from("fortius_inmuebles_expedientes").select("operacion,flujo,version").eq("id", id).is("deleted_at", null).maybeSingle();
    if (current.error) databaseError(current.error);
    if (!current.data) throw new ApiError(404, "Expediente no encontrado");
    if (current.data.version !== body.version) throw new ApiError(409, "El expediente cambió o no está disponible; recarga antes de continuar");
    const parsed = current.data.flujo ? operationWorkflowSchema.safeParse(current.data.flujo) : null;
    if (parsed && !parsed.success) throw new ApiError(409, "La guía de este asunto no se puede leer; recarga antes de continuar");
    const base = parsed?.data ?? null;
    if (!cambiaDeTipo(base, current.data.operacion)) throw new ApiError(400, "El tipo de este asunto no se cambia desde aquí");
    const { operacion, flujo } = operacionYFlujo(body.tipo, base, current.data.operacion, { acreedor: body.acreedor });
    const { data, error } = await client.rpc("fortius_inmuebles_change_operation_type", { p_id: id, p_version: body.version, p_operacion: operacion, p_flow: flujo });
    if (error) {
      if (error.code === "PT409") throw new ApiError(409, "El expediente cambió o no está disponible; recarga antes de continuar");
      if (error.code === "PT400" || error.code === "PT403") throw new ApiError(Number(error.code.slice(2)), error.message);
      databaseError(error);
    }
    return { expediente: data };
  });
}
