import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
export async function GET() {
  return apiResponse(async () => { const { user } = await requireStaff(); return { user }; });
}
