import { idSchema } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { coincidenciasDeConsulta } from "@/lib/backend/consultas";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string }> };

/**
 * ¿Quien llama ya está en el Directorio? Las fichas que coinciden con el nombre completo, los teléfonos o el correo de la
 * consulta (lo último guardado), con los asuntos en que están. Solo lectura; solo lo que quien atiende puede ver.
 */
export async function GET(_request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { coincidencias: await coincidenciasDeConsulta(client, idSchema.parse((await contexto.params).id)) };
  });
}
