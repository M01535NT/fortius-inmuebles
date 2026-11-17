import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { unirPersonas, unirSchema } from "@/lib/backend/directorio";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Une esta ficha con otra de la misma persona (solo el director): queda la otra. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const { con } = unirSchema.parse(await readJson(request, 2_000));
    await unirPersonas(client, user, id, con);
    return { ok: true };
  });
}
