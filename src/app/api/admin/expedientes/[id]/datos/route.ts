import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { exigirExpediente } from "@/lib/backend/expediente-archivos";
import { aplicarDatos, guardarDatos, leerDatos } from "@/lib/backend/expediente-datos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Datos del expediente (propuestos y confirmados) con su versión. */
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    await exigirExpediente(client, id);
    return leerDatos(client, id);
  });
}

/** Guarda los datos y llena con lo confirmado las celdas vacías de los formatos del expediente. */
export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    await exigirExpediente(client, id);
    const saved = await guardarDatos(createServerClient(undefined, true), user.id, id, await readJson(request, 300000));
    return { ...saved, formatosActualizados: await aplicarDatos(client, id, saved.datos) };
  });
}
