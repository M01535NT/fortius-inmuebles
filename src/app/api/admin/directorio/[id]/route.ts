import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { cambiarPersona, cambioPersonaSchema } from "@/lib/backend/directorio";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Volver a llamar, lo que sigue, no contactar, la nota, o archivar y recuperar a una persona. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { client } = await requireStaff();
    return await cambiarPersona(client, id, cambioPersonaSchema.parse(await readJson(request, 10_000)));
  });
}
