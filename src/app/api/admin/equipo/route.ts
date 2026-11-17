import { requireStaff } from "@/lib/backend/auth";
import { leerResumenEquipo } from "@/lib/backend/equipo";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Cómo va cada persona del equipo. Solo el director. */
export async function GET() {
  return apiResponse(async () => {
    const { client, user } = await requireStaff();
    return { equipo: await leerResumenEquipo(client, user) };
  });
}
