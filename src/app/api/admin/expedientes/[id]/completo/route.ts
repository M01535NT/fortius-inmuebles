import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z, ZodError } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { ApiError, databaseError } from "@/lib/backend/http";
import { loadLetterhead } from "@/lib/letterhead-server";
import { armarExpedientePdf, armarExpedienteZip, elegirEmisiones, MAX_DOCUMENTOS_EXPEDIENTE, nombreArchivo, type EntradaConArchivo } from "@/lib/formatos/expediente-completo";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

/*
  FCH-06: el expediente en un PDF (portada, índice y emisiones en orden) o en un ZIP con los PDF
  originales. El permiso se comprueba en el servidor: expediente, borradores y emisiones se leen
  con la sesión del usuario, así que RLS solo deja ver los del administrador o del asesor asignado.
  El cliente privilegiado se usa únicamente para bajar de Storage los archivos ya autorizados, y
  cada uno se coteja con su SHA-256 antes de entregarlo.
*/
export async function GET(request: Request, context: Context) {
  try {
    const id = z.uuid().parse((await context.params).id);
    const formato = z.enum(["pdf", "zip"]).parse(new URL(request.url).searchParams.get("formato") ?? "pdf");
    const { client } = await requireStaff();
    const parent = await client.from("fortius_inmuebles_expedientes").select("id,folio").eq("id", id).is("deleted_at", null).maybeSingle();
    if (parent.error) databaseError(parent.error);
    if (!parent.data) throw new ApiError(404, "Expediente no encontrado");
    const drafts = await client.from("fortius_inmuebles_formato_drafts").select("id,formato_id,version,created_at").eq("expediente_id", id);
    if (drafts.error) databaseError(drafts.error);
    const ids = (drafts.data ?? []).map(draft => draft.id);
    const emissions = ids.length ? await client.from("fortius_inmuebles_formato_emissions").select("id,draft_id,draft_version,sha256,path,created_at,incompleto:snapshot->datosFaltantes").in("draft_id", ids) : { data: [], error: null };
    if (emissions.error) databaseError(emissions.error);
    const entradas = elegirEmisiones(drafts.data ?? [], emissions.data ?? []);
    if (!entradas.length) throw new ApiError(409, "Este expediente todavía no tiene documentos emitidos");
    if (entradas.length > MAX_DOCUMENTOS_EXPEDIENTE) throw new ApiError(413, "El expediente tiene demasiados documentos para reunirlos en un archivo");

    const privileged = createServerClient(undefined, true);
    const conArchivo: EntradaConArchivo[] = [];
    for (const entrada of entradas) {
      const file = await privileged.storage.from("fortius-inmuebles-expedientes").download(entrada.emision.path);
      if (file.error || !file.data) throw new ApiError(503, `El PDF del formato ${entrada.formatoId} no está disponible`);
      const bytes = new Uint8Array(await file.data.arrayBuffer());
      if (createHash("sha256").update(bytes).digest("hex") !== entrada.emision.sha256) throw new ApiError(503, `El PDF del formato ${entrada.formatoId} no superó la verificación de integridad`);
      conArchivo.push({ ...entrada, bytes });
    }

    const generado = new Date().toISOString(), folio = parent.data.folio as string;
    const base = `Fortius-Expediente-${nombreArchivo(folio)}`;
    if (formato === "zip") {
      const bytes = await armarExpedienteZip({ folio, generado, entradas: conArchivo });
      return new Response(Buffer.from(bytes), { headers: { ...privateHeaders, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${base}.zip"`, "Content-Length": String(bytes.byteLength) } });
    }
    const [regular, bold, membrete] = await Promise.all([
      readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")),
      readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf")),
      loadLetterhead(),
    ]);
    const bytes = await armarExpedientePdf({ folio, generado, entradas: conArchivo, fuentes: { regular, bold }, membrete });
    return new Response(Buffer.from(bytes), { headers: { ...privateHeaders, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${base}.pdf"`, "Content-Length": String(bytes.byteLength) } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof ZodError ? 400 : 500;
    return Response.json({ error: error instanceof ApiError ? error.message : status === 400 ? "Solicitud inválida" : "No se pudo reunir el expediente" }, { status, headers: privateHeaders });
  }
}
