import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
import { leerRecordatorios } from "@/lib/backend/recordatorios";

export const runtime = "nodejs";

/** Lo que el panel revisa cada pocos minutos: el número de «Inicio» y los avisos del navegador. Solo lo de quien entró. */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return { recordatorios: await leerRecordatorios(client, user.id, user.role === "admin") };
  });
}
