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
import { conditionOf, conditionWith02 } from "@/lib/intake/condition";
const fields =
  "id,intencion,asesor_id,lead_id,cliente_id,expediente_id,propiedad_slug,anterior_id,contacto,respuestas,estado,version,completed_at,updated_at";
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const q = new URL(request.url).searchParams;
    // CAP-05: solo el chip de la condición; el detalle (puede nombrar personas) no sale de la operación.
    if (q.get("condiciones") === "1") {
      const { data, error } = await client
        .from("fortius_inmuebles_interviews")
        .select("expediente_id,cliente_id,lead_id,problema:respuestas->>problema")
        .neq("estado", "cancelada")
        .not("respuestas->>problema", "is", null)
        .neq("respuestas->>problema", "ninguno")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) databaseError(error);
      const condiciones = ((data ?? []) as Array<{ expediente_id: string | null; cliente_id: string | null; lead_id: string | null; problema: string | null }>)
        .flatMap(row => { const c = conditionOf({ problema: row.problema ?? undefined }); return c ? [{ expedienteId: row.expediente_id, clienteId: row.cliente_id, leadId: row.lead_id, text: c.text }] : []; });
      // CAP-06: si la llamada no dijo nada, cuenta lo anotado en la 02 (va después: la llamada manda).
      const drafts = await client
        .from("fortius_inmuebles_formato_drafts")
        .select("expediente_id,problema:data->>problema,ocupacion:data->>ocupacion,expediente:fortius_inmuebles_expedientes!inner(cliente_id,deleted_at)")
        .eq("formato_id", "02")
        .is("expediente.deleted_at", null)
        .or("data->>problema.not.is.null,data->>ocupacion.eq.sin_permiso")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (drafts.error) databaseError(drafts.error);
      for (const row of (drafts.data ?? []) as Array<{ expediente_id: string; problema: string | null; ocupacion: string | null; expediente: { cliente_id: string | null } | Array<{ cliente_id: string | null }> | null }>) {
        const c = conditionWith02(null, { problema: row.problema ?? undefined, ocupacion: row.ocupacion ?? undefined });
        const expediente = Array.isArray(row.expediente) ? row.expediente[0] : row.expediente;
        if (c) condiciones.push({ expedienteId: row.expediente_id, clienteId: expediente?.cliente_id ?? null, leadId: null, text: c.text });
      }
      return { condiciones };
    }
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
