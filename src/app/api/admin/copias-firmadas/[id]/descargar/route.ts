import { createHash } from "node:crypto";
import { z, ZodError } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { ApiError, databaseError } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, context: Context) {
  try {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const copy = await client.from("mnt_signed_copies").select("id,path,sha256").eq("id", id).maybeSingle();
    if (copy.error) databaseError(copy.error);
    if (!copy.data) throw new ApiError(404, "Copia firmada no encontrada");
    const privileged = createServerClient(undefined, true);
    const file = await privileged.storage.from("mnt-expedientes").download(copy.data.path);
    if (file.error || !file.data) throw new ApiError(503, "La copia archivada no está disponible");
    const bytes = Buffer.from(await file.data.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== copy.data.sha256) throw new ApiError(503, "La copia archivada no superó la verificación de integridad");
    return new Response(bytes, { headers: {
      ...privateHeaders, "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Fortius-firmado-${id}.pdf"`,
      "Content-Length": String(bytes.byteLength),
    } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof ZodError ? 400 : 500;
    return Response.json({ error: error instanceof ApiError ? error.message : status === 400 ? "Identificador inválido" : "No se pudo descargar la copia" }, { status, headers: privateHeaders });
  }
}
