import { idSchema } from "@/lib/backend/asuntos";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, readBody, readJson } from "@/lib/backend/http";
import {
  cambiarMedio, cambioMedioSchema, enlaceSchema, ponerEnlace, subirMedio, TAMANO_MAXIMO_MEDIO, tipoMedioSchema,
} from "@/lib/backend/inmuebles";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/**
 * Agrega una foto, un video o una toma 360. Con formulario multipart sube el archivo (uno por petición);
 * con JSON pone el enlace del video o del recorrido.
 */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const tipo = request.headers.get("content-type") ?? "";
    if (!tipo.toLowerCase().startsWith("multipart/form-data;")) {
      return { medio: await ponerEnlace(client, user.id, id, enlaceSchema.parse(await readJson(request, 4096))) };
    }
    const cuerpo = await readBody(request, TAMANO_MAXIMO_MEDIO + 65536);
    let form: FormData;
    try { form = await new Response(cuerpo as BodyInit, { headers: { "Content-Type": tipo } }).formData(); }
    catch { throw new ApiError(400, "No se pudo leer el archivo"); }
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new ApiError(400, "Adjunta un archivo");
    const clase = tipoMedioSchema.parse(form.get("tipo") ?? "foto");
    return { medio: await subirMedio(client, createServerClient(undefined, true), user.id, id, clase, archivo) };
  }, 201);
}

/** Ordena, describe o quita (recuperable) una foto, un video o una toma. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { client } = await requireStaff();
    await cambiarMedio(client, id, cambioMedioSchema.parse(await readJson(request, 2048)));
    return { ok: true };
  });
}
