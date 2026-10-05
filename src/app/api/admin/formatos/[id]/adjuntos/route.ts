import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readBody } from "@/lib/backend/http";
import { inspectFormatoImage, MAX_ASSET_BYTES } from "@/lib/formatos/assets";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const metadata = z.object({
  tipo: z.enum(["foto", "croquis", "soporte"]),
  descripcion: z.string().trim().min(1).max(240),
  fuente: z.string().trim().min(1).max(240),
  fechaObservacion: z.iso.date().optional(),
});

export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const draft = await client.from("mnt_formato_drafts").select("id").eq("id", id).maybeSingle();
    if (draft.error) databaseError(draft.error);
    if (!draft.data) throw new ApiError(404, "Documento no encontrado");
    const result = await client.from("mnt_formato_assets").select("id,draft_id,kind,caption,source,observed_on,mime,sha256,created_at").eq("draft_id", id).order("created_at", { ascending: true });
    if (result.error) databaseError(result.error);
    return { adjuntos: result.data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    const draft = await client.from("mnt_formato_drafts").select("id,expediente_id,formato_id").eq("id", id).maybeSingle();
    if (draft.error) databaseError(draft.error);
    if (!draft.data) throw new ApiError(404, "Documento no encontrado");
    if (!["04A", "04B", "04C", "04D", "04E", "04F", "04G", "07"].includes(draft.data.formato_id)) throw new ApiError(409, "Este formato no admite imágenes de levantamiento");
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "Se requiere formulario multipart");
    const body = await readBody(request, MAX_ASSET_BYTES + 32768);
    let form: FormData;
    try { form = await new Response(body as BodyInit, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new ApiError(400, "Formulario de imagen inválido"); }
    const file = form.get("archivo");
    if (!(file instanceof File)) throw new ApiError(400, "Adjunta una imagen");
    const details = metadata.parse({
      tipo: form.get("tipo"), descripcion: form.get("descripcion"), fuente: form.get("fuente"),
      fechaObservacion: form.get("fechaObservacion") || undefined,
    });
    const { bytes, mime, extension } = await inspectFormatoImage(file);
    const assetId = randomUUID();
    const path = `${draft.data.expediente_id}/${id}/${assetId}.${extension}`;
    const privileged = createServerClient(undefined, true);
    const uploaded = await privileged.storage.from("mnt-expedientes").upload(path, bytes, { contentType: mime, upsert: false });
    if (uploaded.error) databaseError(uploaded.error);
    const saved = await privileged.from("mnt_formato_assets").insert({
      id: assetId, draft_id: id, kind: details.tipo, caption: details.descripcion,
      source: details.fuente, observed_on: details.fechaObservacion ?? null,
      mime, byte_length: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"), path,
      uploaded_by: user.id,
    }).select("id,draft_id,kind,caption,source,observed_on,mime,sha256,created_at").single();
    if (saved.error) {
      await privileged.storage.from("mnt-expedientes").remove([path]);
      databaseError(saved.error);
    }
    return { adjunto: saved.data };
  }, 201);
}
