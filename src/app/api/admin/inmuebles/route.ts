import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { crearInmueble, listarInmuebles, nuevoInmuebleSchema } from "@/lib/backend/inmuebles";

export const runtime = "nodejs";

/** Los inmuebles que ve quien entró (la base decide cuáles), con su portada y su asunto. */
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { inmuebles: await listarInmuebles(client) };
  });
}

/** Da de alta un inmueble: en el asunto indicado o con su propio asunto de captación. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    return { inmueble: await crearInmueble(client, user, nuevoInmuebleSchema.parse(await readJson(request, 4096))) };
  }, 201);
}
