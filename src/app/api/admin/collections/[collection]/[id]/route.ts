import { requireStaff } from "@/lib/backend/auth";
import { publicFilesBeforeSave, removeOrphanedPublicFiles } from "@/lib/backend/public-file-cleanup";
import { ApiError, apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { listRecords, putRecord, deleteRecord } from "@/lib/backend/repository";
import { parseRecord, parseWrite } from "@/lib/backend/validation";
import { taskExpedienteLinksReady } from "@/lib/backend/task-links";
import { assertPropertyPublicationAllowed } from "@/lib/backend/publication-gate";
const sorted = (value: unknown) => value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : {};
type Context = { params: Promise<{ collection: string; id: string }> };
export async function PUT(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    const { collection, id } = await context.params;
    const input = await readJson(request);
    // CRM-02: los textos de «Mensajes listos» solo los cambia el director; lo demás de Configuración sigue igual.
    if (collection === "config" && user.role !== "admin") {
      const { data } = parseWrite(input);
      const next = parseRecord(collection, id, data).mensajes ?? {};
      const current = (await listRecords(client, "config")).find(r => r.id === "singleton")?.data.mensajes ?? {};
      if (JSON.stringify(sorted(next)) !== JSON.stringify(sorted(current))) throw new ApiError(403, "Solo el director puede cambiar los mensajes.");
    }
    if (collection === "tareas") {
      const { data } = parseWrite(input);
      const task = parseRecord(collection, id, data);
      if (task.expedienteId && !await taskExpedienteLinksReady(client)) {
        throw new ApiError(503, "El vínculo con expedientes requiere una actualización del servicio. Puedes guardar tareas sin ese vínculo.");
      }
    }
    if (collection === "propiedades") {
      const { data } = parseWrite(input);
      await assertPropertyPublicationAllowed(client, id, parseRecord(collection, id, data));
      // Lo público que se quita se borra del almacenamiento después de guardar (titular, 13/11/2026).
      const before = await publicFilesBeforeSave(id);
      const record = await putRecord(client, collection, id, input);
      await removeOrphanedPublicFiles(before, id, record.data);
      return { record };
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
