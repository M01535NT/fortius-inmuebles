import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

type Context = { params: Promise<{ id: string }> };
const lifecycleInput = z.object({ version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1) }).strict();

async function changeState(request: Request, context: Context, remove: boolean) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = lifecycleInput.parse(await readJson(request));
    let query = client.from("fortius_inmuebles_expedientes")
      .update({ deleted_at: remove ? new Date().toISOString() : null, version: input.version + 1 })
      .eq("id", id).eq("version", input.version);
    query = remove ? query.is("deleted_at", null) : query.not("deleted_at", "is", null);
    const { data, error } = await query.select("id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,version,deleted_at,created_at,updated_at").maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(409, "El expediente cambió o ya no está disponible; recarga antes de continuar");
    return { expediente: data };
  });
}

export async function DELETE(request: Request, context: Context) {
  return changeState(request, context, true);
}

export async function PATCH(request: Request, context: Context) {
  return changeState(request, context, false);
}
