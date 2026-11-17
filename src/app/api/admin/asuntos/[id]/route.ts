import { z } from "zod";

import { cambiarAsunto, cambioAsuntoSchema, eliminarAsunto, idSchema, leerAsunto } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { asunto: await leerAsunto(client, idSchema.parse((await contexto.params).id)) };
  });
}

/** Cambia el nombre, lo encargado, en qué va, la espera, el cierre o quién lo lleva (este último, solo el director). */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const id = idSchema.parse((await contexto.params).id);
    await cambiarAsunto(client, user, id, cambioAsuntoSchema.parse(await readJson(request, 32768)));
    return { asunto: await leerAsunto(client, id) };
  });
}

const borrado = z.object({ version: z.number().int().positive(), restaurar: z.boolean().optional() }).strict();

/** Manda el asunto a Eliminados (recuperable). Con `restaurar`, lo regresa (solo el director). */
export async function DELETE(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const e = borrado.parse(await readJson(request, 1024));
    await eliminarAsunto(client, idSchema.parse((await contexto.params).id), e.version, e.restaurar === true);
    return { ok: true };
  });
}
