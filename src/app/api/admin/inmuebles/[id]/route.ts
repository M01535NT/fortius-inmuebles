import { z } from "zod";

import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { cambiarInmueble, cambioInmuebleSchema, eliminarInmueble, leerInmueble } from "@/lib/backend/inmuebles";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** La ficha completa: datos, fotos, video, 360, precios, asuntos y documentos. */
export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { inmueble: await leerInmueble(client, idSchema.parse((await contexto.params).id)) };
  });
}

/** Guarda cambios (guardar no publica; publicar es el interruptor «publicado»). Con la versión vista: si otro guardó antes, 409. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = idSchema.parse((await contexto.params).id);
    await cambiarInmueble(client, id, cambioInmuebleSchema.parse(await readJson(request, 65536)));
    return { inmueble: await leerInmueble(client, id) };
  });
}

const borrado = z.object({ version: z.number().int().positive(), restaurar: z.boolean().optional() }).strict();

/** Manda el inmueble a Eliminados (recuperable) y lo retira del sitio. */
export async function DELETE(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const e = borrado.parse(await readJson(request, 1024));
    await eliminarInmueble(client, idSchema.parse((await contexto.params).id), e.version, e.restaurar === true);
    return { ok: true };
  });
}
