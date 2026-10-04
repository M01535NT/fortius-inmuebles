import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { draftCreate } from "@/lib/formatos/schemas";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const parent = await client.from("mnt_expedientes").select("id").eq("id", id).maybeSingle();
    if (parent.error) databaseError(parent.error);
    if (!parent.data) throw new ApiError(404, "Expediente no encontrado");
    const { data, error } = await client.from("mnt_formato_drafts").select("id,expediente_id,formato_id,data,version,created_at,updated_at").eq("expediente_id", id).order("created_at", { ascending: false });
    if (error) databaseError(error);
    return { documentos: data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const input = draftCreate.parse(await readJson(request));
    const { data, error } = await client.from("mnt_formato_drafts").insert({ expediente_id: id, formato_id: input.formatoId, data: input.data }).select("id,expediente_id,formato_id,data,version,created_at,updated_at").single();
    if (error) databaseError(error);
    return { documento: data };
  }, 201);
}
