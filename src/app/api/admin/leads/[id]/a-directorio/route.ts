import { requireStaff } from "@/lib/backend/auth";
import { leadADirectorio, leadADirectorioSchema } from "@/lib/backend/directorio";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/**
 * «Crear persona» desde una consulta del sitio, en el panel nuevo: la liga a una ficha del Directorio que quien está en
 * sesión ve, o crea una nueva a su cargo. La conversión del panel provisional (`/convertir`, a «clientes») no cambia.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { id } = await context.params;
    return await leadADirectorio(client, id, leadADirectorioSchema.parse(await readJson(request, 1024)));
  });
}
