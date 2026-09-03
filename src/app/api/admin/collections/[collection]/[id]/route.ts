import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { putRecord, deleteRecord } from "@/lib/backend/repository";
type Context = { params: Promise<{ collection: string; id: string }> };
export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { collection, id } = await context.params;
    return { record: await putRecord(client, collection, id, await readJson(request)) };
  });
}
export async function DELETE(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { collection, id } = await context.params;
    await deleteRecord(client, collection, id, await readJson(request, 1024));
    return { ok: true };
  });
}
