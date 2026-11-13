import { clientAddress, verifyMfaLogin } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export async function POST(request: Request) {
  return apiResponse(async () => { assertSameOrigin(request); return verifyMfaLogin(await readJson(request, 1024), clientAddress(request)); });
}
