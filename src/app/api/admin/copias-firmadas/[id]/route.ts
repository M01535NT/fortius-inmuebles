import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError } from "@/lib/backend/http";
import { marcaDeRetiro, resultadoDeRetiro } from "@/lib/backend/formatos-retiro";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/**
 * Quitar (DELETE) o restaurar (PATCH) la copia firmada de un PDF emitido, PN-06.
 * Eliminación recuperable: el PDF firmado y su huella se conservan; solo deja de listarse.
 * El acceso se comprueba con la sesión (RLS del PDF emitido); la marca la escribe el servidor.
 */
async function cambiar(request: Request, context: Context, quitar: boolean) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    const copy = await client.from("fortius_inmuebles_signed_copies").select("id,emission_id").eq("id", id).maybeSingle();
    if (copy.error) databaseError(copy.error);
    if (!copy.data) throw new ApiError(404, "Copia firmada no encontrada");
    let consulta = createServerClient(undefined, true).from("fortius_inmuebles_signed_copies")
      .update(marcaDeRetiro(quitar, user.id)).eq("id", id).eq("emission_id", copy.data.emission_id);
    consulta = quitar ? consulta.is("deleted_at", null) : consulta.not("deleted_at", "is", null);
    const copia = resultadoDeRetiro(await consulta.select("id,emission_id,sha256,created_at").maybeSingle(),
      quitar ? "Esa copia firmada ya se quitó. Recarga la página." : "Esa copia firmada ya está junto a su PDF.");
    return { copia };
  });
}

export async function DELETE(request: Request, context: Context) {
  return cambiar(request, context, true);
}

export async function PATCH(request: Request, context: Context) {
  return cambiar(request, context, false);
}
