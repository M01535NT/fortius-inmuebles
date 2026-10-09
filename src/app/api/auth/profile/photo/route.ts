import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse } from "@/lib/backend/http";

export async function GET() {
  try {
    const { user } = await requireStaff();
    const file = await createServerClient(undefined, true).storage.from("fortius-inmuebles-private").download(`profiles/${user.id}/avatar.jpg`);
    if (file.error || !file.data) throw new ApiError(404, "Fotografía no disponible");
    return new Response(await file.data.arrayBuffer(), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiResponse(async () => { throw error; }); }
}
