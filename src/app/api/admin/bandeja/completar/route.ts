import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { finalizarDocumento } from "@/lib/backend/documentos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** FLX-01: comprueba la carga temporal y la guarda en la Bandeja de quien la subió. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    return { documento: await finalizarDocumento(client, createServerClient(undefined, true), user.id, await readJson(request, 8192)) };
  }, 201);
}
