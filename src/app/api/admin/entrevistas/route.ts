import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import {
  apiResponse,
  ApiError,
  assertSameOrigin,
  databaseError,
  readJson,
} from "@/lib/backend/http";
import { BUYER_INTENT_MESSAGE, isBuyerIntent, startIntakeSchema } from "@/lib/intake/interview";
const fields =
  "id,intencion,asesor_id,lead_id,cliente_id,expediente_id,propiedad_slug,anterior_id,contacto,respuestas,estado,version,completed_at,updated_at";
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const q = new URL(request.url).searchParams;
    let query = client
      .from("fortius_inmuebles_interviews")
      .select(fields)
      .neq("estado", "cancelada")
      .order("updated_at", { ascending: false })
      .limit(100);
    const lead = q.get("leadId"),
      exp = q.get("expedienteId"),
      customer = q.get("clienteId");
    if (lead)
      query = query.eq(
        "lead_id",
        z
          .string()
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/)
          .parse(lead),
      );
    if (exp) query = query.eq("expediente_id", z.uuid().parse(exp));
    if (customer)
      query = query.eq(
        "cliente_id",
        z
          .string()
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/)
          .parse(customer),
      );
    if (!lead && !exp && !customer) query = query.eq("estado", "borrador");
    const { data, error } = await query;
    if (error) databaseError(error);
    return { entrevistas: data ?? [] };
  });
}
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const input = startIntakeSchema.parse(await readJson(request, 8192));
    if (isBuyerIntent(input.intencion)) throw new ApiError(400, BUYER_INTENT_MESSAGE);
    const { data, error } = await client.rpc("fortius_inmuebles_start_intake", {
      p_id: input.id,
      p_intent: input.intencion,
      p_contact: { ...input.contacto, ...(input.seguimiento ? { seguimiento: input.seguimiento } : {}) },
      p_expediente_id: input.expedienteId ?? null,
    });
    if (error) databaseError(error);
    return { entrevista: data };
  }, 201);
}
