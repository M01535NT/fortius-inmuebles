import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { listarBandeja, listarLigados, prepararDocumento } from "@/lib/backend/documentos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/**
  FLX-01: lo que está en la Bandeja de quien llama (el director ve la de todos) y su papelera.
  Con `?clienteId=` o `?propiedadSlug=`, los documentos ya ligados a esa persona o a ese inmueble.
*/
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const params = new URL(request.url).searchParams;
    const clienteId = params.get("clienteId"), propiedadSlug = params.get("propiedadSlug");
    if (clienteId) return { documentos: await listarLigados(client, { clienteId }) };
    if (propiedadSlug) return { documentos: await listarLigados(client, { propiedadSlug }) };
    return listarBandeja(client);
  });
}

/** Permiso de un solo uso para subir un archivo a la carga temporal privada. No pide ningún dato. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user } = await requireStaff();
    return prepararDocumento(createServerClient(undefined, true), user.id, await readJson(request, 4096));
  });
}
