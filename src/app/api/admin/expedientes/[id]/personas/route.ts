import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

/*
  Personas del asunto con su papel (PN-02, tabla `fortius_inmuebles_asunto_personas` de la migración 20261116090300).
  Ruta aditiva del panel nuevo. La base decide quién ve y quién suma (RLS: hay que poder ver el asunto y la ficha).
  Si la tabla todavía no existe, responde `{ disponible: false }` y la pantalla muestra solo a la persona principal.
  Quitar a alguien no borra: marca `retirado_el`; volver a sumarlo lo reactiva.
*/
const PAPELES = ["vende", "compra", "pone_en_renta", "renta", "copropietario", "apoderado", "aliado", "notaria", "banco", "abogado", "otro"] as const;
const persona = z.object({ personaId: z.string().trim().min(1).max(200), papel: z.enum(PAPELES) }).strict();
const COLUMNAS = "persona_id,papel,principal,created_at";
const faltaEnLaBase = (e: { code?: string }) => ["42703", "42P01", "PGRST204", "PGRST205"].includes(e.code ?? "");

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const { data, error } = await client.from("fortius_inmuebles_asunto_personas").select(COLUMNAS)
      .eq("asunto_id", id).is("retirado_el", null).order("created_at", { ascending: true });
    if (error) {
      if (faltaEnLaBase(error)) return { disponible: false, personas: [] };
      databaseError(error);
    }
    return { disponible: true, personas: data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = persona.parse(await readJson(request));
    // Si ya estuvo con ese papel y se retiró, se reactiva; si no, se agrega.
    const previa = await client.from("fortius_inmuebles_asunto_personas").update({ retirado_el: null })
      .eq("asunto_id", id).eq("persona_id", input.personaId).eq("papel", input.papel).select(COLUMNAS).maybeSingle();
    if (previa.error) {
      if (faltaEnLaBase(previa.error)) return { disponible: false, persona: null };
      databaseError(previa.error);
    }
    if (previa.data) return { disponible: true, persona: previa.data };
    const { data, error } = await client.from("fortius_inmuebles_asunto_personas")
      .insert({ asunto_id: id, persona_id: input.personaId, papel: input.papel }).select(COLUMNAS).single();
    if (error) databaseError(error);
    return { disponible: true, persona: data };
  }, 201);
}

export async function DELETE(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = persona.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_asunto_personas").update({ retirado_el: new Date().toISOString() })
      .eq("asunto_id", id).eq("persona_id", input.personaId).eq("papel", input.papel).is("retirado_el", null).select(COLUMNAS).maybeSingle();
    if (error) {
      if (faltaEnLaBase(error)) return { disponible: false, persona: null };
      databaseError(error);
    }
    if (!data) throw new ApiError(409, "Esa persona ya no estaba en el asunto; recarga antes de continuar");
    return { disponible: true, persona: data };
  });
}
