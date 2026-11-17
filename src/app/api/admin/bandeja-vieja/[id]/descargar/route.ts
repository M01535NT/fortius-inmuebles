import { z, ZodError } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { descargarDocumento } from "@/lib/backend/documentos";
import { ApiError } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
const EXTENSIONES: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** FLX-01: entrega el archivo solo a quien puede verlo, comprobado contra su huella. */
export async function GET(_request: Request, context: Context) {
  try {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const { documento, bytes } = await descargarDocumento(client, createServerClient(undefined, true), id);
    const extension = EXTENSIONES[documento.mime] ?? "bin";
    const nombre = `${documento.titulo.replace(/[^\p{L}\p{N} ._-]+/gu, "").trim() || "Documento"}.${extension}`;
    return new Response(bytes, { headers: { ...privateHeaders, "Content-Type": documento.mime, "Content-Disposition": `inline; filename="documento.${extension}"; filename*=UTF-8''${encodeURIComponent(nombre)}`, "Content-Length": String(bytes.byteLength) } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof ZodError ? 400 : 500;
    return Response.json({ error: error instanceof ApiError ? error.message : status === 400 ? "Identificador inválido" : "No se pudo descargar el documento" }, { status, headers: privateHeaders });
  }
}
