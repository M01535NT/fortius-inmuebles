import { logoutSession } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin } from "@/lib/backend/http";

export async function POST(request: Request) {
  return apiResponse(async () => { assertSameOrigin(request); return logoutSession(); });
}
