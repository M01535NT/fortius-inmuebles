import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { findRun, mapRun, RUNS } from "@/lib/apps/repository";
type Params = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Params) {
  return apiResponse(async () => { const { client } = await requireStaff(); return { run: await findRun(client, (await params).id) }; });
}
export async function PATCH(request: Request, { params }: Params) {
  return apiResponse(async () => {
    assertSameOrigin(request); const { client } = await requireStaff(); const id = z.uuid().parse((await params).id);
    const { version, deleted } = z.object({ version: z.number().int().positive(), deleted: z.boolean() }).strict().parse(await readJson(request));
    const { data, error } = await client.from(RUNS).update({ version: version + 1, deleted_at: deleted ? new Date().toISOString() : null }).eq("id", id).eq("version", version).select("*").maybeSingle();
    if (error) databaseError(error); if (!data) throw new ApiError(409, "Trabajo no disponible o modificado"); return { run: mapRun(data) };
  });
}
