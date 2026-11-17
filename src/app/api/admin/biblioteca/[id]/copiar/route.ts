import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { copiarAlAsunto, copiarSchema } from "@/lib/backend/biblioteca";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Copia la guía a un asunto: ahí se cambia sin tocar la de la Biblioteca. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const { asunto_id } = copiarSchema.parse(await readJson(request, 2_000));
    return { resultado: await copiarAlAsunto(client, user, id, asunto_id) };
  });
}
