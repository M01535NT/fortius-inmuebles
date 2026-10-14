import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import {
  apiResponse,
  ApiError,
  assertSameOrigin,
  databaseError,
  readJson,
} from "@/lib/backend/http";
import { interviewIssues, saveIntakeSchema } from "@/lib/intake/interview";
type Context = { params: Promise<{ id: string }> };
const fields =
  "id,intencion,asesor_id,lead_id,cliente_id,expediente_id,propiedad_slug,anterior_id,contacto,respuestas,estado,version,completed_at,updated_at";
export async function GET(_r: Request, c: Context) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const id = z.uuid().parse((await c.params).id);
    const { data, error } = await client
      .from("fortius_inmuebles_interviews")
      .select(fields)
      .eq("id", id)
      .maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(404, "Entrevista no encontrada o sin acceso");
    return { entrevista: data };
  });
}
export async function PUT(request: Request, c: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await c.params).id);
    const input = saveIntakeSchema.parse(await readJson(request, 64000));
    if (input.completar) {
      const current = await client
        .from("fortius_inmuebles_interviews")
        .select("intencion")
        .eq("id", id)
        .maybeSingle();
      if (current.error) databaseError(current.error);
      if (!current.data) throw new ApiError(404, "Entrevista no disponible");
      const issues = interviewIssues(current.data.intencion, input.respuestas);
      if (issues.length) throw new ApiError(400, issues[0].message);
    }
    const { data, error } = await client.rpc("fortius_inmuebles_save_intake", {
      p_id: id,
      p_version: input.version,
      p_answers: input.respuestas,
      p_complete: input.completar,
    });
    if (error) databaseError(error);
    return { entrevista: data };
  });
}
