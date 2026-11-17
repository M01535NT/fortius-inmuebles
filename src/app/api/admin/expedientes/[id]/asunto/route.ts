import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

/*
  Título libre y tipo del asunto (PN-02, columnas `titulo` y `tipo_asunto` de la migración 20261116090200).
  Ruta aditiva del panel nuevo: si la base todavía no tiene esas columnas, responde `{ disponible: false }`
  sin cambiar nada y la pantalla usa su respaldo (la nota «Título: …»). Conserva sesión, alcance (RLS) y versión (409).
*/
const TIPOS = ["venta", "renta", "busqueda", "tramite", "inversion", "revision", "otro"] as const;
const entrada = z.object({
  version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER - 1),
  titulo: z.string().trim().min(1).max(160).nullable().optional(),
  tipo: z.enum(TIPOS).nullable().optional(),
}).strict().refine((v) => v.titulo !== undefined || v.tipo !== undefined, { message: "Nada que cambiar" });

const COLUMNAS = "id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,etapa,fecha_objetivo,checklist,flujo,version,created_at,updated_at,titulo,tipo_asunto";
/** La base aún no tiene la columna o la tabla (PN-02 sin aplicar). */
const faltaEnLaBase = (e: { code?: string }) => ["42703", "42P01", "PGRST204", "PGRST205"].includes(e.code ?? "");

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const id = z.uuid().parse((await context.params).id);
    const input = entrada.parse(await readJson(request));
    const cambio: Record<string, unknown> = { version: input.version + 1 };
    if (input.titulo !== undefined) cambio.titulo = input.titulo;
    if (input.tipo !== undefined) cambio.tipo_asunto = input.tipo;
    const { data, error } = await client.from("fortius_inmuebles_expedientes").update(cambio)
      .eq("id", id).eq("version", input.version).is("deleted_at", null).select(COLUMNAS).maybeSingle();
    if (error) {
      if (faltaEnLaBase(error)) return { disponible: false, expediente: null };
      databaseError(error);
    }
    if (!data) throw new ApiError(409, "El asunto cambió o ya no está disponible; recarga antes de continuar");
    return { disponible: true, expediente: data };
  });
}
