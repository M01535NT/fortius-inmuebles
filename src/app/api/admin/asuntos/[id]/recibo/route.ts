import { z } from "zod";

import { hacerRecibo } from "@/lib/backend/apartados";
import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** «Hacer recibo» de un cobro: el formato de recibo lleno, guardado en los Documentos del asunto. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const asuntoId = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const { cobro_id } = z.object({ cobro_id: idSchema }).strict().parse(await readJson(request, 1024));
    return await hacerRecibo(client, user, asuntoId, cobro_id);
  }, 201);
}
