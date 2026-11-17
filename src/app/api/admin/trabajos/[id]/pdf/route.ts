import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin } from "@/lib/backend/http";
import { pdfDelTrabajo } from "@/lib/backend/trabajos";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Arma el PDF del formato; si es de un asunto y cambió, queda también en sus Documentos. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    return await pdfDelTrabajo(client, user, id);
  });
}
