import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { exigirExpediente, finalizarArchivo } from "@/lib/backend/expediente-archivos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Comprueba la carga temporal y la guarda entre los documentos del cliente. */
export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    await exigirExpediente(client, id);
    return { archivo: await finalizarArchivo(createServerClient(undefined, true), user.id, id, await readJson(request, 8192)) };
  }, 201);
}
