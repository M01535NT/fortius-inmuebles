import { continuarAsunto, continuarSchema } from "@/lib/backend/apartados";
import { apartadosPara, idSchema } from "@/lib/backend/asuntos";
import type { Encargo } from "@/lib/backend/asuntos-contrato";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** «Continuar en un asunto nuevo»: mismas personas, inmuebles y documentos; los dos dicen de dónde viene cada uno. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const asuntoId = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const e = continuarSchema.parse(await readJson(request, 2048));
    return { asunto: await continuarAsunto(client, user, asuntoId, e, (encargos) => apartadosPara(encargos as Encargo[])) };
  }, 201);
}
