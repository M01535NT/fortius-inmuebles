import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { unirPersonas } from "@/lib/backend/unir-personas";

export const runtime = "nodejs";

/** Une dos fichas de persona: la que se queda recibe los datos elegidos y lo de la otra; la otra se archiva (PN-03). */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    return { union: await unirPersonas(client, await readJson(request, 64 * 1024)) };
  });
}
