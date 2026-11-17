import { cargarEjemplos } from "@/lib/backend/asuntos-ejemplos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Carga los seis casos de docs/casos-reales.md como asuntos de ejemplo (solo el director; no repite). */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    return await cargarEjemplos(client, user);
  }, 201);
}
