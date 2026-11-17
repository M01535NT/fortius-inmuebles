import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { cambiarDocumento } from "@/lib/backend/documentos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** FLX-01: renombra un documento, cambia su tipo, lo manda a la papelera o lo restaura, y lo archiva o lo devuelve a la Bandeja. */
export async function PATCH(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    return { documento: await cambiarDocumento(client, createServerClient(undefined, true), user, id, await readJson(request, 2048)) };
  });
}
