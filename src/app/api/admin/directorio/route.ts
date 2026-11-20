import { requireStaff } from "@/lib/backend/auth";
import { filtroSchema, listarDirectorio } from "@/lib/backend/directorio";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";

/**
 * Las personas que quien entró puede ver, cada una con sus asuntos. «Qué ver»: `ver` (activas, archivadas,
 * sin_seguimiento o todas; por omisión, activas) y `asesor` (quién la lleva).
 */
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const q = new URL(request.url).searchParams;
    const filtro = filtroSchema.parse({ ...(q.get("ver") ? { ver: q.get("ver") } : {}), ...(q.get("asesor") ? { asesor: q.get("asesor") } : {}) });
    return { personas: await listarDirectorio(client, filtro) };
  });
}
