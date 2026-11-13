import { clientAddress, requestRecovery } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

// SEG-B3: en producción el enlace del correo vuelve al dominio configurado, no al que diga la petición.
function returnUrl(request: Request) {
  const site = process.env.NODE_ENV === "production" ? process.env.FORTIUS_INMUEBLES_SITE_URL : undefined;
  return new URL("/admin", site || request.url).href;
}

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    return requestRecovery(await readJson(request, 4096), returnUrl(request), clientAddress(request));
  });
}
