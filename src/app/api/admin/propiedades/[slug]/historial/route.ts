import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { anotarHistorialInmueble, listarHistorialInmueble } from "@/lib/backend/inmueble-historial";

export const runtime = "nodejs";

/** Historial del inmueble que la sesión puede ver (RLS). Sin la tabla de PN-02, 503. */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { historial: await listarHistorialInmueble(client, (await context.params).slug) };
  });
}

/** Anota en el historial: «Publicar así», precio, publicar o quitar del sitio, dirección exacta. Solo agrega. */
export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    return { entrada: await anotarHistorialInmueble(client, (await context.params).slug, await readJson(request, 8192)) };
  }, 201);
}
