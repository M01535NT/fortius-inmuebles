import { updateProfile } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
export async function PATCH(request: Request) {
  return apiResponse(async () => { assertSameOrigin(request); return updateProfile(await readJson(request, 110000)); });
}
