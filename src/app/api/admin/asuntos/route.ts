import { crearAsunto, listarAsuntos, nuevoAsuntoSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Los asuntos que ve quien entró (la base decide cuáles), con lo que sigue en cada uno. */
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { asuntos: await listarAsuntos(client) };
  });
}

/** Abre un asunto con sus apartados según lo encargado. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const entrada = nuevoAsuntoSchema.parse(await readJson(request, 8192));
    return { asunto: await crearAsunto(client, user, entrada) };
  }, 201);
}
