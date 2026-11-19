import { requireStaff } from "@/lib/backend/auth";
import { agregarValor, cambiarValor, cambioValorSchema, leerCatalogos, nuevoValorSchema } from "@/lib/backend/catalogos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Todas las listas con sus valores. Las lee todo el equipo: de aquí salen las listas desplegables del panel. */
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { catalogos: await leerCatalogos(client) };
  });
}

/** Agrega un valor a una lista. Solo el director. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const entrada = nuevoValorSchema.parse(await readJson(request, 4096));
    return { valor: await agregarValor(client, user, entrada) };
  }, 201);
}

/** Renombra, activa o desactiva un valor, o reordena una lista. Solo el director. */
export async function PATCH(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const entrada = cambioValorSchema.parse(await readJson(request, 32768));
    return { valor: await cambiarValor(client, user, entrada) };
  });
}
