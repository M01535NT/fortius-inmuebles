import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { expedienteCreate } from "@/lib/formatos/schemas";

export async function GET(request?: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const params = request ? new URL(request.url).searchParams : new URLSearchParams();
    const state = z.enum(["activos", "eliminados"]).parse(params.get("estado") ?? "activos");
    const paginated = params.has("limit") || params.has("offset");
    const limit = z.coerce.number().int().min(1).max(200).parse(params.get("limit") ?? 100);
    let offset = z.coerce.number().int().min(0).max(100000).parse(params.get("offset") ?? 0);
    const records: Record<string, unknown>[] = [];
    for (;;) {
      let query = client.from("fortius_inmuebles_expedientes").select("id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,etapa,fecha_objetivo,checklist,flujo,version,deleted_at,created_at,updated_at", { count: "exact" });
      query = state === "eliminados" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
      const { data, error, count } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + limit - 1);
      if (error) databaseError(error);
      const rows = data ?? [];
      records.push(...rows);
      offset += rows.length;
      const hasMore = count !== null ? offset < count : rows.length === limit;
      if (hasMore && !rows.length) throw new ApiError(409, "La lista cambió; vuelve a cargar los expedientes");
      if (paginated) return { expedientes: records, nextOffset: hasMore ? offset : null };
      if (!hasMore) return { expedientes: records };
      // Compatibility for dashboards that still require the complete authorized list.
      // Never silently truncate those consumers; new consumers should use limit/offset.
      if (offset >= 100000) throw new ApiError(413, "Usa la consulta paginada para este volumen de expedientes");
    }
  });
}

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const input = expedienteCreate.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_expedientes").insert({
      cliente_id: input.clienteId, asesor_id: input.asesorId, propiedad_slug: input.propiedadSlug ?? null,
      operacion: input.operacion, unidad: input.unidad, ...(input.flujo ? {flujo: input.flujo} : {}),
    }).select("id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,etapa,fecha_objetivo,checklist,flujo,version,created_at,updated_at").single();
    if (error) databaseError(error);
    return { expediente: data };
  }, 201);
}
