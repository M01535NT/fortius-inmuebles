import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { expedienteCreate } from "@/lib/formatos/schemas";

export async function GET(request?: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const state = z.enum(["activos", "eliminados"]).parse(request ? new URL(request.url).searchParams.get("estado") ?? "activos" : "activos");
    let query = client.from("fortius_inmuebles_expedientes").select("id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,version,deleted_at,created_at,updated_at");
    query = state === "eliminados" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) databaseError(error);
    return { expedientes: data ?? [] };
  });
}

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const input = expedienteCreate.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_expedientes").insert({
      cliente_id: input.clienteId, asesor_id: input.asesorId, propiedad_slug: input.propiedadSlug ?? null,
      folio: input.folio, operacion: input.operacion, unidad: input.unidad,
    }).select("id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,version,created_at,updated_at").single();
    if (error) databaseError(error);
    return { expediente: data };
  }, 201);
}
