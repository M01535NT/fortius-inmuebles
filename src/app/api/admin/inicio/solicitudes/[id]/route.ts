import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { cambiarSolicitud, cambioSolicitudSchema } from "@/lib/backend/inicio";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Atender una solicitud del sitio (abre la consulta), pasarla a otra persona (director) o marcar que no procede. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { client, user } = await requireStaff();
    return await cambiarSolicitud(client, user, id, cambioSolicitudSchema.parse(await readJson(request, 2_000)));
  });
}
