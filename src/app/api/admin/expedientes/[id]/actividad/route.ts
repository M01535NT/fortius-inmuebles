import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { expedienteNoteCreate } from "@/lib/formatos/expediente-operations";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const parent = await client.from("fortius_inmuebles_expedientes")
      .select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    if (parent.error) databaseError(parent.error);
    if (!parent.data) throw new ApiError(404, "Expediente no encontrado");
    const { data, error } = await client.from("fortius_inmuebles_expediente_actividad")
      .select("id,tipo,descripcion,created_by,created_at")
      .eq("expediente_id", id).order("created_at", { ascending: false }).limit(100);
    if (error) databaseError(error);
    return { actividad: data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = expedienteNoteCreate.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_expediente_actividad")
      .insert({ expediente_id: id, tipo: "nota", descripcion: input.descripcion, created_by: user.id })
      .select("id,tipo,descripcion,created_by,created_at").single();
    if (error) databaseError(error);
    return { actividad: data };
  }, 201);
}
