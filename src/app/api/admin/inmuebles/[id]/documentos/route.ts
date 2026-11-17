import { idSchema } from "@/lib/backend/asuntos";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, readBody, readJson } from "@/lib/backend/http";
import { agregarDocumento, documentoSchema, TAMANO_MAXIMO_MEDIO } from "@/lib/backend/inmuebles";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Agrega un plano o un permiso: con archivo (multipart) queda recibido; solo el nombre (JSON), queda por pedir. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const tipo = request.headers.get("content-type") ?? "";
    const privileged = createServerClient(undefined, true);
    if (!tipo.toLowerCase().startsWith("multipart/form-data;")) {
      const { nombre } = documentoSchema.parse(await readJson(request, 1024));
      return { documento: await agregarDocumento(client, privileged, user, id, nombre, null) };
    }
    const cuerpo = await readBody(request, TAMANO_MAXIMO_MEDIO + 65536);
    let form: FormData;
    try { form = await new Response(cuerpo as BodyInit, { headers: { "Content-Type": tipo } }).formData(); }
    catch { throw new ApiError(400, "No se pudo leer el archivo"); }
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new ApiError(400, "Adjunta un archivo");
    const { nombre } = documentoSchema.parse({ nombre: String(form.get("nombre") ?? archivo.name).slice(0, 200) || "Plano" });
    return { documento: await agregarDocumento(client, privileged, user, id, nombre, archivo) };
  }, 201);
}
