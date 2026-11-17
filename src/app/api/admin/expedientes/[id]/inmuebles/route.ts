import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

/*
  Otros inmuebles del asunto (PN-02, tabla `fortius_inmuebles_asunto_inmuebles` de la migración 20261116090300).
  Ruta aditiva del panel nuevo, igual que la de personas. La base decide quién ve y quién liga (RLS: hay que poder ver el asunto).
  Si la tabla todavía no existe, responde `{ disponible: false }`; la pantalla liga entonces el inmueble principal
  (si no hay) o avisa que llega después. Quitar no borra: marca `retirado_el`; volver a ligarlo lo reactiva.
*/
const inmueble = z.object({ inmuebleId: z.string().trim().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/) }).strict();
const COLUMNAS = "inmueble_id,relacion,created_at";
const faltaEnLaBase = (e: { code?: string }) => ["42703", "42P01", "PGRST204", "PGRST205"].includes(e.code ?? "");

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const { data, error } = await client.from("fortius_inmuebles_asunto_inmuebles").select(COLUMNAS)
      .eq("asunto_id", id).is("retirado_el", null).order("created_at", { ascending: true });
    if (error) {
      if (faltaEnLaBase(error)) return { disponible: false, inmuebles: [] };
      databaseError(error);
    }
    return { disponible: true, inmuebles: data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = inmueble.parse(await readJson(request));
    // Si ya estuvo ligado y se quitó, se reactiva; si no, se agrega.
    const previa = await client.from("fortius_inmuebles_asunto_inmuebles").update({ retirado_el: null })
      .eq("asunto_id", id).eq("inmueble_id", input.inmuebleId).select(COLUMNAS).maybeSingle();
    if (previa.error) {
      if (faltaEnLaBase(previa.error)) return { disponible: false, inmueble: null };
      databaseError(previa.error);
    }
    if (previa.data) return { disponible: true, inmueble: previa.data };
    const { data, error } = await client.from("fortius_inmuebles_asunto_inmuebles")
      .insert({ asunto_id: id, inmueble_id: input.inmuebleId }).select(COLUMNAS).single();
    if (error) databaseError(error);
    return { disponible: true, inmueble: data };
  }, 201);
}

export async function DELETE(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = inmueble.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_asunto_inmuebles").update({ retirado_el: new Date().toISOString() })
      .eq("asunto_id", id).eq("inmueble_id", input.inmuebleId).is("retirado_el", null).select(COLUMNAS).maybeSingle();
    if (error) {
      if (faltaEnLaBase(error)) return { disponible: false, inmueble: null };
      databaseError(error);
    }
    if (!data) throw new ApiError(409, "Ese inmueble ya no estaba ligado al asunto; recarga antes de continuar");
    return { disponible: true, inmueble: data };
  });
}
