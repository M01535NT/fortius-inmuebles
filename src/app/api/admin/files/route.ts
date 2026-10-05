import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readBody } from "@/lib/backend/http";
import { MAX_FILE_BYTES, validateFile } from "@/lib/backend/validation";
import { registerUpload } from "@/lib/backend/files";

export const runtime = "nodejs";
const bucketSchema = z.enum(["mnt-private", "mnt-public"]);
const pathSchema = z.string().max(300).regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif|pdf|mp4|webm)$/);
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user } = await requireStaff();
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "Se requiere formulario multipart");
    const bytes = await readBody(request, MAX_FILE_BYTES + 65536);
    let form: FormData;
    try { form = await new Response(bytes as BodyInit, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new ApiError(400, "Formulario de archivo inválido"); }
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Archivo requerido");
    const visibility = z.enum(["private", "public"]).parse(form.get("visibility") ?? "private");
    const { type, extension } = await validateFile(file);
    const client = createServerClient(undefined, true);
    const bucket = visibility === "public" ? "mnt-public" : "mnt-private";
    const path = `${user.id}/${randomUUID()}.${extension}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { contentType: type, upsert: false });
    if (error) databaseError(error);
    await registerUpload(client, user.id, bucket, path);
    const url = visibility === "public" ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : `/api/admin/files?bucket=${bucket}&path=${encodeURIComponent(path)}`;
    return { bucket, path, url, name: file.name.slice(0, 160), type };
  }, 201);
}
export async function GET(request: Request) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const params = new URL(request.url).searchParams;
    const bucket = bucketSchema.parse(params.get("bucket"));
    const path = pathSchema.parse(params.get("path"));
    const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60);
    if (error && "statusCode" in error && ["403", "404"].includes(String(error.statusCode))) throw new ApiError(404, "Archivo no encontrado o sin acceso");
    if (error) databaseError(error);
    return { url: data!.signedUrl, expiresIn: 60 };
  });
}
