import { enlaceArchivo } from "@/lib/backend/apartados";
import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string; archivo: string }> };

/** Abre un archivo del asunto: un enlace firmado de un minuto, solo para quien ve el asunto. */
export async function GET(_request: Request, contexto: Contexto) {
  let respuesta: Response | undefined;
  const falla = await apiResponse(async () => {
    const { client } = await requireStaff();
    const { id, archivo } = await contexto.params;
    const url = await enlaceArchivo(client, idSchema.parse(id), idSchema.parse(archivo));
    respuesta = new Response(null, { status: 303, headers: { Location: url, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
    return {};
  });
  return respuesta ?? falla;
}
