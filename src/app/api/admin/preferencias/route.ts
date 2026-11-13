import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { loadPreferences, markInboxRead, panelInput, readInput, updatePanel } from "@/lib/backend/preferences";

export const runtime = "nodejs";

/** Las preferencias de quien tiene la sesión (UX-02, UX-05). Nunca las de otra persona. */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return { preferencias: await loadPreferences(client, user.id) };
  });
}

/** Marca avisos de «Para ti» como leídos: { claves: [...] }. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const { claves } = readInput.parse(await readJson(request, 32_768));
    return { preferencias: await markInboxRead(client, user.id, claves) };
  });
}

/** Cambia preferencias del panel: { panel: { operacionesVista: "tablero" } }. */
export async function PATCH(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const { panel } = panelInput.parse(await readJson(request, 32_768));
    return { preferencias: await updatePanel(client, user.id, panel) };
  });
}
