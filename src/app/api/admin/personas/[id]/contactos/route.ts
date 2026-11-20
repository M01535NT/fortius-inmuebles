import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { nuevoContactoSchema } from "@/lib/backend/directorio";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { anotarContacto, nombresDelEquipo } from "@/lib/backend/personas-ficha";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Anota una llamada o un mensaje con su resultado; puede cambiar «volver a llamar» y «lo que sigue» en el mismo paso. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const entrada = nuevoContactoSchema.parse(await readJson(request, 8_000));
    return await anotarContacto(client, id, entrada, await nombresDelEquipo(user));
  }, 201);
}
