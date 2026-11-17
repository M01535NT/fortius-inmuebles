import { idSchema } from "@/lib/backend/asuntos";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { descartarArchivo, subirArchivo, TAMANO_MAXIMO } from "@/lib/backend/consultas";
import { apiResponse, ApiError, assertSameOrigin, readBody } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** «Lo que ya mandó»: un archivo por petición. Al abrir el asunto cae en su documento, como recibido. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const tipo = request.headers.get("content-type") ?? "";
    if (!tipo.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "Se requiere formulario multipart");
    const cuerpo = await readBody(request, TAMANO_MAXIMO + 65536);
    let form: FormData;
    try { form = await new Response(cuerpo as BodyInit, { headers: { "Content-Type": tipo } }).formData(); }
    catch { throw new ApiError(400, "No se pudo leer el archivo"); }
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new ApiError(400, "Adjunta un archivo");
    return { carga: await subirArchivo(client, createServerClient(undefined, true), user, id, archivo) };
  }, 201);
}

/** Quita un archivo adjunto de la consulta (recuperable). */
export async function DELETE(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const carga = idSchema.parse(new URL(request.url).searchParams.get("carga"));
    const { client } = await requireStaff();
    await descartarArchivo(client, id, carga);
    return { ok: true };
  });
}
