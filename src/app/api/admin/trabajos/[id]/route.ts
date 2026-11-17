import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { abrirTrabajo, cambiarTrabajo, cambioTrabajoSchema } from "@/lib/backend/trabajos";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** El trabajo con su asunto y lo que el asunto ya sabe para llenarlo. */
export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const id = idSchema.parse((await contexto.params).id);
    const { client } = await requireStaff();
    return await abrirTrabajo(client, id);
  });
}

/** Guarda lo capturado (y lo devuelve a la persona o al inmueble), lo pasa a un asunto o lo manda a Eliminados. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    return await cambiarTrabajo(client, user, id, cambioTrabajoSchema.parse(await readJson(request, 300_000)));
  });
}
