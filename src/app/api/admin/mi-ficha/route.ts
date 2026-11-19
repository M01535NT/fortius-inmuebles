import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { elegirMiFicha, leerMiFicha, miFichaSchema } from "@/lib/backend/mi-ficha";

export const runtime = "nodejs";

/** La ficha del equipo de quien entró (también la del director) y, si el director no tiene, las fichas libres. */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return await leerMiFicha(client, user);
  });
}

/** El director elige cuál ficha del equipo es la suya: `{ asesorId }`. */
export async function PUT(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    return await elegirMiFicha(client, user, miFichaSchema.parse(await readJson(request, 1024)).asesorId);
  });
}
