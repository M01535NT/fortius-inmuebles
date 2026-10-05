import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { draftWrite } from "@/lib/formatos/schemas";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const { data, error } = await client.from("fortius_inmuebles_formato_drafts").select("id,expediente_id,formato_id,data,version,created_at,updated_at").eq("id", id).maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(404, "Documento no encontrado");
    const emissions = await client.from("fortius_inmuebles_formato_emissions").select("id,draft_id,draft_version,sha256,created_by,created_at").eq("draft_id", id).order("created_at", { ascending: false });
    if (emissions.error) databaseError(emissions.error);
    return { documento: data, emisiones: emissions.data ?? [] };
  });
}

export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const input = draftWrite.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_formato_drafts").update({ data: input.data, version: input.version + 1 }).eq("id", id).eq("version", input.version).select("id,expediente_id,formato_id,data,version,created_at,updated_at").maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(409, "El documento cambió; recarga antes de guardar");
    return { documento: data };
  });
}
