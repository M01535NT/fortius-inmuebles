import { requireStaff } from "@/lib/backend/auth";
import { anotarEnBandeja, listarBandeja } from "@/lib/backend/bandeja";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Los archivos por confirmar que subió quien está en sesión (PN-06, DEC-54). */
export async function GET() {
  return apiResponse(async () => {
    const { client, user } = await requireStaff();
    return { archivos: await listarBandeja(client, user.id) };
  });
}

/** Anota en la cola una carga temporal recién subida, con su ticket. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    return { archivo: await anotarEnBandeja(client, user.id, await readJson(request, 8192)) };
  }, 201);
}
