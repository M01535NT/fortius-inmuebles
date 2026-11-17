import { requireStaff } from "@/lib/backend/auth";
import { listarDirectorio } from "@/lib/backend/directorio";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Todas las personas que quien entró puede ver, cada una con sus asuntos. */
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { personas: await listarDirectorio(client) };
  });
}
