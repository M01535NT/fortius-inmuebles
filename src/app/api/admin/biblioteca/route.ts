import { requireStaff } from "@/lib/backend/auth";
import { crearGuia, listarGuias, nuevaGuiaSchema } from "@/lib/backend/biblioteca";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Las guías de la Biblioteca: qué pedir, qué hacer y apartados. */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return { guias: await listarGuias(client, user) };
  });
}

/** Una guía nueva, o el plan o un apartado de un asunto guardado para volver a usarlo. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    return { guia: await crearGuia(client, user, nuevaGuiaSchema.parse(await readJson(request, 120_000))) };
  }, 201);
}
