import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { autorizarDestino, prepareUpload } from "@/lib/backend/files";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const input = await readJson(request, 4096);
    // B5: con la sesión de quien sube, para que la base diga qué inmuebles puede ver.
    await autorizarDestino(client, user.role, input);
    return prepareUpload(createServerClient(undefined, true), user.id, input);
  });
}
