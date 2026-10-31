import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { exigirExpediente, listarArchivos, prepararArchivo } from "@/lib/backend/expediente-archivos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { formatosLegibles, lecturaDisponible } from "@/lib/ia/proveedor";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Documentos del cliente del expediente, su papelera, si la lectura está activada y qué tipos de archivo puede leer. */
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    await exigirExpediente(client, id);
    return { ...await listarArchivos(client, id), ia: lecturaDisponible(), legibles: formatosLegibles() };
  });
}

/** Permiso de un solo uso para subir un documento a la carga temporal privada. */
export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    await exigirExpediente(client, id);
    return prepararArchivo(createServerClient(undefined, true), user.id, await readJson(request, 4096));
  });
}
