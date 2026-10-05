import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { convertLead } from "@/lib/backend/lead-conversion";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { id } = await context.params;
    return convertLead(client, id, await readJson(request, 1024));
  });
}
