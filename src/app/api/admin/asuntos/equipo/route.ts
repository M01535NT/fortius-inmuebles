import { leerEquipo } from "@/lib/backend/asuntos-equipo";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Quiénes pueden llevar un asunto. El asesor solo se ve a sí mismo. */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return { equipo: await leerEquipo(client, user), yo: user.id };
  });
}
