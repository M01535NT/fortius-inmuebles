import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { cambiarGuia, cambioGuiaSchema } from "@/lib/backend/biblioteca";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Cambia una guía, la marca revisada por el abogado (director) o la manda a Eliminados. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    return { guia: await cambiarGuia(client, user, id, cambioGuiaSchema.parse(await readJson(request, 120_000))) };
  });
}
