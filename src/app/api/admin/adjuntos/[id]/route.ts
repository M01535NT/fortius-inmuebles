import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError } from "@/lib/backend/http";
import { imagenesEnUso, marcaDeRetiro, resultadoDeRetiro } from "@/lib/backend/formatos-retiro";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const COLUMNAS = "id,draft_id,kind,caption,source,observed_on,mime,sha256,created_at";

/**
 * Quitar (DELETE) o restaurar (PATCH) una imagen de un levantamiento (04) o de la opinión (07), PN-06.
 * Eliminación recuperable: la imagen deja de listarse, pero su fila y sus bytes se conservan.
 * El acceso se comprueba con la sesión (RLS del borrador); la marca la escribe el servidor.
 * No se quita una imagen que la hoja todavía usa: primero se saca de su espacio (guardado con versión, 409).
 */
async function cambiar(request: Request, context: Context, quitar: boolean) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    const asset = await client.from("fortius_inmuebles_formato_assets").select("id,draft_id").eq("id", id).maybeSingle();
    if (asset.error) databaseError(asset.error);
    if (!asset.data) throw new ApiError(404, "Imagen no encontrada");
    if (quitar) {
      const draft = await client.from("fortius_inmuebles_formato_drafts").select("id,data").eq("id", asset.data.draft_id).maybeSingle();
      if (draft.error) databaseError(draft.error);
      if (!draft.data) throw new ApiError(404, "Documento no encontrado");
      if (imagenesEnUso(draft.data.data).has(id)) throw new ApiError(409, "La imagen sigue en la hoja. Quítala de su espacio y vuelve a intentarlo.");
    }
    let consulta = createServerClient(undefined, true).from("fortius_inmuebles_formato_assets")
      .update(marcaDeRetiro(quitar, user.id)).eq("id", id).eq("draft_id", asset.data.draft_id);
    consulta = quitar ? consulta.is("deleted_at", null) : consulta.not("deleted_at", "is", null);
    const adjunto = resultadoDeRetiro(await consulta.select(COLUMNAS).maybeSingle(), quitar ? "Esa imagen ya se quitó. Recarga la página." : "Esa imagen ya está en el documento.");
    return { adjunto };
  });
}

export async function DELETE(request: Request, context: Context) {
  return cambiar(request, context, true);
}

export async function PATCH(request: Request, context: Context) {
  return cambiar(request, context, false);
}
