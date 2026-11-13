import { mfaStatus } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";

export async function GET() {
  return apiResponse(() => mfaStatus());
}
