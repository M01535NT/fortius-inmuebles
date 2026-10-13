import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
import { taskExpedienteLinksReady } from "@/lib/backend/task-links";

export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { expedienteLinks: await taskExpedienteLinksReady(client) };
  });
}
