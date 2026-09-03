import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { prepareUpload } from "@/lib/backend/files";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user } = await requireStaff();
    return prepareUpload(createServerClient(undefined, true), user.id, await readJson(request, 4096));
  });
}
