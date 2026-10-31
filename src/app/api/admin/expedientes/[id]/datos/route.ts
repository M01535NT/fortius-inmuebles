import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { exigirExpediente } from "@/lib/backend/expediente-archivos";
import { aplicarDatos, datosAutomaticosDe, guardarDatosSinAutomaticos, leerDatosCompletos } from "@/lib/backend/expediente-datos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { mezclarDatos } from "@/lib/formatos/datos-expediente";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Datos del expediente (propuestos, confirmados y los automáticos de la persona y el inmueble) con su versión. */
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    await exigirExpediente(client, id);
    const { datos, version } = await leerDatosCompletos(client, id);
    return { datos, version };
  });
}

/** Guarda los datos y llena con lo confirmado las celdas vacías de los formatos del expediente. */
export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    await exigirExpediente(client, id);
    const automaticos = await datosAutomaticosDe(client, id);
    const saved = await guardarDatosSinAutomaticos(createServerClient(undefined, true), user.id, id, await readJson(request, 300000), automaticos);
    const datos = mezclarDatos(automaticos, saved.datos);
    return { datos, version: saved.version, formatosActualizados: await aplicarDatos(client, id, datos) };
  });
}
