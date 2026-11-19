import { idSchema } from "@/lib/backend/asuntos";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { cambiarArchivo, cambioCargaSchema, descartarArchivo, documentoDeCarga, subirArchivo, TAMANO_MAXIMO } from "@/lib/backend/consultas";
import { apiResponse, ApiError, assertSameOrigin, readBody, readJson } from "@/lib/backend/http";

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
    // Opcional: el nombre exacto del documento de la lista al que pertenece. Sin él, queda suelto.
    const campo = form.get("documento");
    const documento = documentoDeCarga.parse(typeof campo === "string" ? campo : null);
    return { carga: await subirArchivo(client, createServerClient(undefined, true), user, id, archivo, documento) };
  }, 201);
}

/** Cambia a qué documento de la lista pertenece un archivo ya cargado: `?carga=…` y `{ documento: "…" | null }`. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const carga = idSchema.parse(new URL(request.url).searchParams.get("carga"));
    const { documento } = cambioCargaSchema.parse(await readJson(request));
    const { client } = await requireStaff();
    return { carga: await cambiarArchivo(client, id, carga, documento) };
  });
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
