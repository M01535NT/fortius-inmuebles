import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { cambiarBandeja } from "@/lib/backend/bandeja";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Guarda, descarta o regresa a «por confirmar» un archivo de la Bandeja, con la versión que se leyó. */
export async function PATCH(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    return { archivo: await cambiarBandeja(client, createServerClient(undefined, true), id, await readJson(request, 8192)) };
  });
}
