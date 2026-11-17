import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { cambiarMovimiento } from "@/lib/backend/movimientos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Registrar entrega o cobro, deshacer, quitar, restaurar o agregar el comprobante, con la versión que se leyó (409). */
export async function PATCH(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    return { movimiento: await cambiarMovimiento(client, createServerClient(undefined, true), user.id, id, await readJson(request, 8192)) };
  });
}
