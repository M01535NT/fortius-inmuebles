import { loginWithPassword } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export async function POST(request: Request) {
  return apiResponse(async () => { assertSameOrigin(request); return loginWithPassword(await readJson(request, 4096)); });
}
