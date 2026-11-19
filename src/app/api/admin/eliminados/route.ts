import { requireStaff } from "@/lib/backend/auth";
import { listarEliminados, recuperar, recuperarSchema } from "@/lib/backend/eliminados";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/**
 * Lo que se mandó a Eliminados y quien mira puede ver, lo más reciente arriba: `{ eliminados, hayMas }`. `hayMas` dice
 * qué clases llegaron al tope (se muestran las más recientes y hay más).
 */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return listarEliminados(client, user);
  });
}

/** «Recuperar»: `{ clase, id, version }`. Lo regresa a su lugar; si alguien lo cambió antes, 409. */
export async function PATCH(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    await recuperar(client, user, recuperarSchema.parse(await readJson(request, 1024)));
    return { ok: true };
  });
}
