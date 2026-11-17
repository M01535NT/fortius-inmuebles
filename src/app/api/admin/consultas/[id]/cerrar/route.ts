import { idSchema } from "@/lib/backend/asuntos";
import { cerrarConsulta, cierreSchema } from "@/lib/backend/consultas";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Cuando no se vuelve asunto: «Guardar como contacto» o «No procede». También la reabre. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    return await cerrarConsulta(client, idSchema.parse((await contexto.params).id), cierreSchema.parse(await readJson(request, 2048)));
  });
}
