import { z } from "zod";

import { idSchema } from "@/lib/backend/asuntos";
import { abrirAsunto } from "@/lib/backend/consultas";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };
/** `persona_id`: la ficha del Directorio que es quien llama (no se crea otra); null, una nueva; sin él, como esté la consulta. */
const cuerpo = z.object({ version: z.number().int().positive(), persona_id: z.uuid().nullable().optional() }).strict();

/** «Abrir asunto»: crea el asunto con su persona, su inmueble, su lista de documentos y su primer plan. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { version, persona_id } = cuerpo.parse(await readJson(request, 256));
    return { asunto: await abrirAsunto(client, idSchema.parse((await contexto.params).id), version, persona_id) };
  }, 201);
}
