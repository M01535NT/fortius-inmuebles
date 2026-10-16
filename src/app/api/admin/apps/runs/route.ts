import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { getApp } from "@/lib/apps/catalog";
import { RUNS, mapRun, saveRun } from "@/lib/apps/repository";
import { z } from "zod";
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff(); const params = new URL(request.url).searchParams;
    const slug = z.string().refine(v => !!getApp(v)).parse(params.get("slug"));
    if (params.get("vista") === "ultimo-por-expediente") {
      const { data, error } = await client.from(RUNS).select("expediente_id,updated_at").eq("slug", slug).is("deleted_at", null).not("expediente_id", "is", null).order("updated_at", { ascending: false }).limit(1000);
      if (error) databaseError(error);
      const ultimos: Record<string, string> = {};
      for (const row of (data ?? []) as Array<{ expediente_id: string | null; updated_at: string }>) if (row.expediente_id && !ultimos[row.expediente_id]) ultimos[row.expediente_id] = row.updated_at;
      return { ultimos };
    }
    const offset = z.coerce.number().int().min(0).max(100000).parse(params.get("offset") ?? 0);
    let query = client.from(RUNS).select("*", { count: "exact" }).eq("slug", slug);
    const expedienteId = params.get("expedienteId");
    if (expedienteId) query = query.eq("expediente_id", z.uuid().parse(expedienteId));
    query = params.get("deleted") === "true" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
    const { data, error, count } = await query.order("updated_at", { ascending: false }).order("id").range(offset, offset + 19);
    if (error) databaseError(error);
    return { runs: (data ?? []).map(mapRun), nextOffset: offset + (data?.length ?? 0) < (count ?? 0) ? offset + 20 : null };
  });
}
export async function POST(request: Request) {
  return apiResponse(async () => { assertSameOrigin(request); const { client, user } = await requireStaff(); return { run: await saveRun(client, user.id, await readJson(request, 4000000)) }; });
}
