import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readBody } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const emission = await client.from("mnt_formato_emissions").select("id").eq("id", id).maybeSingle();
    if (emission.error) databaseError(emission.error);
    if (!emission.data) throw new ApiError(404, "Emisión no encontrada");
    const copies = await client.from("mnt_signed_copies").select("id,emission_id,sha256,created_at").eq("emission_id", id).order("created_at", { ascending: false });
    if (copies.error) databaseError(copies.error);
    return { copias: copies.data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    const result = await client.from("mnt_formato_emissions").select("id,draft_id").eq("id", id).maybeSingle();
    if (result.error) databaseError(result.error);
    if (!result.data) throw new ApiError(404, "Emisión no encontrada");
    const draft = await client.from("mnt_formato_drafts").select("expediente_id").eq("id", result.data.draft_id).maybeSingle();
    if (draft.error) databaseError(draft.error);
    if (!draft.data) throw new ApiError(404, "Expediente no encontrado");
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "Se requiere formulario multipart");
    const body = await readBody(request, MAX_PDF_BYTES + 65536);
    let form: FormData;
    try { form = await new Response(body as BodyInit, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new ApiError(400, "Formulario de archivo inválido"); }
    const file = form.get("archivo");
    if (!(file instanceof File)) throw new ApiError(400, "Adjunta el PDF firmado");
    if (file.size === 0 || file.size > MAX_PDF_BYTES) throw new ApiError(400, "El PDF debe ocupar entre 1 byte y 20 MB");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new ApiError(400, "El archivo no es un PDF válido");
    const copyId = randomUUID();
    const path = `${draft.data.expediente_id}/${copyId}.pdf`;
    const privileged = createServerClient(undefined, true);
    const uploaded = await privileged.storage.from("mnt-expedientes").upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (uploaded.error) databaseError(uploaded.error);
    const saved = await privileged.from("mnt_signed_copies").insert({
      id: copyId, emission_id: id, path,
      sha256: createHash("sha256").update(bytes).digest("hex"), uploaded_by: user.id,
    }).select("id,emission_id,sha256,created_at").single();
    if (saved.error) {
      await privileged.storage.from("mnt-expedientes").remove([path]);
      databaseError(saved.error);
    }
    return { copia: saved.data };
  }, 201);
}
