import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
import { leerInicio } from "@/lib/backend/inicio";

export const runtime = "nodejs";

/** Lo que hay que atender hoy, la semana y lo que falta cobrar (cada quien lo suyo; el director, todo). */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return { inicio: await leerInicio(client, user.id) };
  });
}
