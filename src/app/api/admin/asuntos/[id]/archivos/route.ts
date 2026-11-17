import { z } from "zod";

import { subirAlAsunto, TAMANO_MAXIMO_ARCHIVO } from "@/lib/backend/apartados";
import { DESTINOS } from "@/lib/backend/apartados-contrato";
import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, readBody } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/**
 * Sube archivos al asunto (multipart): «destino» dice dónde caen —un renglón de Documentos, «Subir varios»
 * (cada archivo a su renglón), el contrato firmado, la opinión, el presupuesto o la foto de una tarjeta— y «ref», cuál.
 */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const asuntoId = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const tipo = request.headers.get("content-type") ?? "";
    if (!tipo.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "Adjunta los archivos");
    const cuerpo = await readBody(request, 5 * TAMANO_MAXIMO_ARCHIVO + 65536);
    let form: FormData;
    try { form = await new Response(cuerpo as BodyInit, { headers: { "Content-Type": tipo } }).formData(); }
    catch { throw new ApiError(400, "No se pudieron leer los archivos"); }
    const destino = z.enum(DESTINOS).parse(form.get("destino"));
    const refCrudo = form.get("ref");
    const ref = typeof refCrudo === "string" && refCrudo ? idSchema.parse(refCrudo) : null;
    const archivos = form.getAll("archivos").filter((x): x is File => x instanceof File);
    return { subidos: await subirAlAsunto(client, user, asuntoId, destino, archivos, ref) };
  }, 201);
}
