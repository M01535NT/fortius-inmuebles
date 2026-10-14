import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, databaseError } from "@/lib/backend/http";
export async function GET() {
  return apiResponse(async () => {
    const { client, user } = await requireStaff();
    if (user.role === "admin") return { administrador: true, asesorId: null };
    const { data, error } = await client.rpc(
      "fortius_inmuebles_current_asesor_id",
    );
    if (error) databaseError(error);
    return { administrador: false, asesorId: data ?? null };
  });
}
