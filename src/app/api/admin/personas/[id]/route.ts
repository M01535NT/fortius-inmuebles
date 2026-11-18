import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { cambiarFicha, cambioFichaSchema, leerFicha } from "@/lib/backend/personas-ficha";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** La ficha de una persona: contacto, datos y los asuntos donde aparece. */
export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const id = idSchema.parse((await contexto.params).id);
    const { client } = await requireStaff();
    return { ficha: await leerFicha(client, id) };
  });
}

/** Cambia su contacto o sus datos, cada parte con su versión. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    return { ficha: await cambiarFicha(client, user, id, cambioFichaSchema.parse(await readJson(request, 20_000))) };
  });
}
