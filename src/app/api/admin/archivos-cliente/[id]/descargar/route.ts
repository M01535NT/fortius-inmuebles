import { z, ZodError } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { descargarArchivo } from "@/lib/backend/expediente-archivos";
import { ApiError } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
const EXTENSIONES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function GET(_request: Request, context: Context) {
  try {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const { archivo, bytes } = await descargarArchivo(client, createServerClient(undefined, true), id);
    const nombre = `${archivo.titulo.replace(/[^\p{L}\p{N} ._-]+/gu, "").trim() || "Documento"}.${EXTENSIONES[archivo.mime] ?? "bin"}`;
    return new Response(bytes, { headers: { ...privateHeaders, "Content-Type": archivo.mime, "Content-Disposition": `inline; filename="documento.${EXTENSIONES[archivo.mime] ?? "bin"}"; filename*=UTF-8''${encodeURIComponent(nombre)}`, "Content-Length": String(bytes.byteLength) } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof ZodError ? 400 : 500;
    return Response.json({ error: error instanceof ApiError ? error.message : status === 400 ? "Identificador inválido" : "No se pudo descargar el documento" }, { status, headers: privateHeaders });
  }
}
