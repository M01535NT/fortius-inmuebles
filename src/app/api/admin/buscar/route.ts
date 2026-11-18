import { requireStaff } from "@/lib/backend/auth";
import { leerIndiceBuscar } from "@/lib/backend/buscar-panel";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Lo que encuentra el buscador del panel: asuntos, personas e inmuebles que ve quien entró. */
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { indice: await leerIndiceBuscar(client) };
  });
}
