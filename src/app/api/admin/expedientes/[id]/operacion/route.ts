import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { expedienteOperationWrite } from "@/lib/formatos/expediente-operations";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = expedienteOperationWrite.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_expedientes")
      .update({
        etapa: input.etapa, fecha_objetivo: input.fechaObjetivo,
        checklist: input.checklist, version: input.version + 1,
      })
      .eq("id", id).eq("version", input.version).is("deleted_at", null)
      .select("id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,etapa,fecha_objetivo,checklist,version,deleted_at,created_at,updated_at")
      .maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(409, "El expediente cambió o no está disponible; recarga antes de continuar");
    return { expediente: data };
  });
}
