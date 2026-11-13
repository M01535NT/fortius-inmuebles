import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
import { listRecordsFor } from "@/lib/backend/repository";
export async function GET(_request: Request, context: { params: Promise<{ collection: string }> }) {
  return apiResponse(async () => {
    const { client, user } = await requireStaff();
    const { collection } = await context.params;
    return { records: await listRecordsFor(client, collection, user.role) };
  });
}
