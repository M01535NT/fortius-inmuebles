import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import {
  apiResponse,
  ApiError,
  assertSameOrigin,
  databaseError,
  readJson,
} from "@/lib/backend/http";
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    if (user.role !== "admin")
      throw new ApiError(403, "El historial requiere acceso de administrador");
    const params = new URL(request.url).searchParams;
    const offset = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(params.get("offset") ?? 0);
    let query = client
      .from("fortius_inmuebles_record_history")
      .select(
        "id,collection,record_id,action,actor_id,version,changed_fields,created_at,restored_at",
      )
      .order("created_at", { ascending: false })
      .order("id")
      .range(offset, offset + 49);
    if (params.get("collection"))
      query = query.eq("collection", params.get("collection"));
    if (params.get("record"))
      query = query.eq("record_id", params.get("record"));
    if (params.get("deleted") === "1")
      query = query
        .eq("action", "DELETE")
        .is("restored_at", null)
        .in("collection", ["propiedades", "posts", "notas", "eventos"]);
    const { data, error } = await query;
    if (error && ["42P01", "PGRST205"].includes(error.code))
      throw new ApiError(
        503,
        "El historial está pendiente de activación en la base de datos.",
      );
    if (error) databaseError(error);
    return { entries: data ?? [], hasMore: data?.length === 50 };
  });
}
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    if (user.role !== "admin")
      throw new ApiError(403, "Solo el administrador restaura registros");
    const input = z
      .object({ historyId: z.uuid() })
      .strict()
      .parse(await readJson(request, 1024));
    const { data, error } = await client.rpc(
      "fortius_inmuebles_restore_record",
      { p_history_id: input.historyId },
    );
    if (error) databaseError(error);
    return { record: data };
  });
}
