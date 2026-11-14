import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

/*
  M-04 (decisiones del titular, 14/11/2026): el director pasa una operación a otro asesor. La base
  (fortius_inmuebles_reassign_operation) mueve juntas las operaciones abiertas del inmueble, el
  inmueble, el cliente y las tareas abiertas; conserva lo revisado, la publicación y quién captó, y
  deja una nota con el motivo. Esta ruta solo valida la entrada y traduce sus respuestas.
*/
const input = z.object({ asesorId: z.string().trim().min(1).max(80), motivo: z.string().trim().min(10).max(1000) }).strict();
type Context = { params: Promise<{ id: string }> };
const allowed = new Set(["Solo el director reasigna operaciones", "Escribe el motivo de la reasignación (al menos 10 caracteres)", "Elige un asesor activo del equipo", "La operación ya es de ese asesor", "Operación no encontrada"]);

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    if (user.role !== "admin") throw new ApiError(403, "Solo el director reasigna operaciones");
    const id = z.uuid().parse((await context.params).id);
    const data = input.parse(await readJson(request));
    const { data: result, error } = await client.rpc("fortius_inmuebles_reassign_operation", { p_id: id, p_asesor: data.asesorId, p_motivo: data.motivo });
    if (error) {
      const message = String(error.message ?? "");
      if (["PT400", "PT403", "PT404"].includes(error.code) && allowed.has(message)) throw new ApiError(Number(error.code.slice(2)), message);
      if (error.code === "PT409" && message.startsWith("El cliente tiene otras operaciones abiertas")) throw new ApiError(409, message);
      databaseError(error);
    }
    const movidas = (result as { movidas?: unknown } | null)?.movidas;
    return { movidas: Array.isArray(movidas) ? movidas.map(String) : [] };
  });
}
