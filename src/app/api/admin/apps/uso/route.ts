import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, databaseError } from "@/lib/backend/http";
import { RUNS } from "@/lib/apps/repository";
import { lastMonths, usoPorHerramienta } from "@/lib/apps/uso";

/* Uso de herramientas por mes para Reportes (HER-05). Solo el administrador; no devuelve contenido de los trabajos. */
export async function GET() {
  return apiResponse(async () => {
    const { client, user } = await requireStaff();
    if (user.role !== "admin") throw new ApiError(403, "Los reportes son solo para administradores");
    const months = lastMonths(new Date());
    // Desde el día 1 del primer mes con margen de un día por el huso horario.
    const since = new Date(Date.parse(`${months[0]}-01T00:00:00Z`) - 86_400_000).toISOString();
    const rows: { slug: string; created_at: string }[] = []; const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await client.from(RUNS).select("slug,created_at").gte("created_at", since).order("created_at").order("id").range(from, from + page - 1);
      if (error) databaseError(error);
      rows.push(...((data ?? []) as typeof rows));
      if ((data?.length ?? 0) < page) break;
    }
    return usoPorHerramienta(rows, months);
  });
}
