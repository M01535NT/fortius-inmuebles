import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { cambiarArchivo } from "@/lib/backend/expediente-archivos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Renombra un documento del cliente, lo manda a la papelera o lo restaura. */
export async function PATCH(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    return { archivo: await cambiarArchivo(client, createServerClient(undefined, true), user.id, id, await readJson(request, 2048)) };
  });
}
