import { idSchema } from "@/lib/backend/asuntos";
import { cambiarConsulta, cambioConsultaSchema, leerConsulta } from "@/lib/backend/consultas";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { consulta: await leerConsulta(client, idSchema.parse((await contexto.params).id)) };
  });
}

/** Guardado automático mientras se escribe. Responde la versión nueva. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = idSchema.parse((await contexto.params).id);
    return await cambiarConsulta(client, id, cambioConsultaSchema.parse(await readJson(request, 65536)));
  });
}
