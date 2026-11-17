import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { loteSchema, publicarVarios } from "@/lib/backend/inmuebles";

export const runtime = "nodejs";

/** Publica o retira del sitio varios inmuebles a la vez (todos o ninguno). */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    return { cambiados: await publicarVarios(client, loteSchema.parse(await readJson(request, 16384))) };
  });
}
