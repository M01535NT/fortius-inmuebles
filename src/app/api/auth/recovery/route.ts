import { clientAddress, requestRecovery } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

// SEG-B3: en producción el enlace del correo vuelve al dominio configurado, no al que diga la petición.
// Vuelve a la reserva (/admin-anterior): hoy solo el provisional procesa el enlace y deja poner la contraseña nueva.
// Cuando el panel nuevo lo procese, esta dirección pasa a /admin.
function returnUrl(request: Request) {
  const site = process.env.NODE_ENV === "production" ? process.env.FORTIUS_INMUEBLES_SITE_URL : undefined;
  return new URL("/admin-anterior", site || request.url).href;
}

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    return requestRecovery(await readJson(request, 4096), returnUrl(request), clientAddress(request));
  });
}
