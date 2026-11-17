import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { copiaSchema, copiarInmueble } from "@/lib/backend/inmuebles";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** «Agregar otro igual»: otro local de la misma plaza, en el mismo asunto, con su folio, precio y estado propios. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = idSchema.parse((await contexto.params).id);
    return { inmueble: await copiarInmueble(client, id, copiaSchema.parse(await readJson(request, 1024))) };
  }, 201);
}
