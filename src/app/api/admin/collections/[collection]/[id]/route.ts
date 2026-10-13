import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { putRecord, deleteRecord } from "@/lib/backend/repository";
import { parseRecord, parseWrite } from "@/lib/backend/validation";
import { taskExpedienteLinksReady } from "@/lib/backend/task-links";
type Context = { params: Promise<{ collection: string; id: string }> };
export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { collection, id } = await context.params;
    const input = await readJson(request);
    if (collection === "tareas") {
      const { data } = parseWrite(input);
      const task = parseRecord(collection, id, data);
      if (task.expedienteId && !await taskExpedienteLinksReady(client)) {
        throw new ApiError(503, "El vínculo con expedientes requiere una actualización del servicio. Puedes guardar tareas sin ese vínculo.");
      }
    }
    return { record: await putRecord(client, collection, id, input) };
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
