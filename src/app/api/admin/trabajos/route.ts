import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { crearTrabajo, crearTrabajoSchema, listarTrabajos } from "@/lib/backend/trabajos";

export const runtime = "nodejs";

/** Los trabajos de un asunto (`?asunto=`) o los sueltos de quien entró (Herramientas). */
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    const asunto = new URL(request.url).searchParams.get("asunto");
    return { trabajos: await listarTrabajos(client, user, asunto ? { asunto: idSchema.parse(asunto) } : { sueltos: true }) };
  });
}

/** Empieza un formato o guarda una cuenta, en un asunto o suelto. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    return await crearTrabajo(client, user, crearTrabajoSchema.parse(await readJson(request, 300_000)));
  }, 201);
}
