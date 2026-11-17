import { z } from "zod";

import { idSchema } from "@/lib/backend/asuntos";
import { abrirAsunto } from "@/lib/backend/consultas";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };
const cuerpo = z.object({ version: z.number().int().positive() }).strict();

/** «Abrir asunto»: crea el asunto con su persona, su inmueble, su lista de documentos y su primer plan. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { version } = cuerpo.parse(await readJson(request, 256));
    return { asunto: await abrirAsunto(client, idSchema.parse((await contexto.params).id), version) };
  }, 201);
}
