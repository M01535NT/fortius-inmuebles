import { leerCompaneros, leerEquipo } from "@/lib/backend/asuntos-equipo";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";

/**
 * Quiénes pueden llevar un asunto (el asesor solo se ve a sí mismo) y, aparte, los compañeros que se pueden
 * mencionar con @ en una nota: todo el equipo activo, solo con su nombre.
 */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    const [equipo, companeros] = await Promise.all([leerEquipo(client, user), leerCompaneros(user)]);
    return { equipo, companeros, yo: user.id };
  });
}
