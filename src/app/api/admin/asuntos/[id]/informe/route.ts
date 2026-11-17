import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { hacerInforme, materialInforme, opcionesInformeSchema } from "@/lib/backend/informes";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/** Lo que el asunto puede decir en un informe para el cliente. La pantalla lo acomoda en la hoja mientras se elige. */
export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const asuntoId = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    return { material: (await materialInforme(client, user, asuntoId)).material };
  });
}

/** Hace el informe: el PDF queda en los Documentos del asunto y se anota en el Historial. No se envía a nadie. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const asuntoId = idSchema.parse((await contexto.params).id);
    const { user, client } = await requireStaff();
    const opciones = opcionesInformeSchema.parse(await readJson(request, 32768));
    return { informe: await hacerInforme(client, user, asuntoId, opciones) };
  }, 201);
}
