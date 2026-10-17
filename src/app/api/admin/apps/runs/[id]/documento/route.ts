import { createHash } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, databaseError } from "@/lib/backend/http";
import { findRun } from "@/lib/apps/repository";
import { adjuntosDe, DOCUMENTOS_APP, documentoIndependienteInput, FOLIO_INDEPENDIENTE } from "@/lib/apps/documentos";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { MAX_ASSET_BYTES, type FormatoPdfAsset } from "@/lib/formatos/assets";
import { valorAssetIds } from "@/lib/formatos/valor";

/*
  PDF de un documento sin expediente: se genera con la versión guardada del trabajo y se
  entrega al momento. No se archiva ni deja emisión, porque no pertenece a una operación.
*/

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let response: Response | undefined;
  const failure = await apiResponse(async () => {
    const { client } = await requireStaff();
    const run = await findRun(client, (await params).id);
    const version = z.coerce.number().int().positive().parse(new URL(request.url).searchParams.get("version"));
    if (run.slug !== DOCUMENTOS_APP) throw new ApiError(400, "Este trabajo no es un documento");
    if (run.version !== version) throw new ApiError(409, "El documento cambió; guarda o recarga antes de generar el PDF");
    const parsed = documentoIndependienteInput.safeParse(run.input);
    if (!parsed.success) throw new ApiError(400, "Revisa la captura del documento");
    const { formatoId, data } = parsed.data, adjuntos = adjuntosDe(data);
    const definition = formatoById(formatoId);
    if (!definition.readyForEmission) throw new ApiError(409, "El PDF de este formato sigue bloqueado; descarga el Word");
    const values = { ...data, folio: FOLIO_INDEPENDIENTE };
    const missing = validateFormato(formatoId, values);
    if (missing.length) throw new ApiError(409, `Faltan datos: ${missing.join(", ")}`);

    const assets: FormatoPdfAsset[] = [];
    if (formatoId === "07") {
      const ids = valorAssetIds(values);
      const rows = await client.from("fortius_inmuebles_app_files").select("id,path,mime,sha256,expediente_id").in("id", ids);
      if (rows.error) databaseError(rows.error);
      const privileged = createServerClient(undefined, true);
      for (const id of ids) {
        const row = rows.data?.find(item => item.id === id), meta = adjuntos.find(item => item.id === id);
        // Una imagen elegida que ya no está en el documento se omite: el PDF sale igual.
        if (!row || !meta || row.expediente_id !== null || !["image/jpeg", "image/png"].includes(row.mime)) continue;
        const file = await privileged.storage.from("fortius-inmuebles-private").download(row.path);
        if (file.error || !file.data) throw new ApiError(503, "Una imagen del documento no está disponible");
        const bytes = new Uint8Array(await file.data.arrayBuffer());
        if (bytes.length > MAX_ASSET_BYTES || createHash("sha256").update(bytes).digest("hex") !== row.sha256) throw new ApiError(503, "Una imagen no superó la verificación de integridad");
        assets.push({ id, kind: meta.kind, caption: meta.caption, source: meta.source, observed_on: meta.observed_on, mime: row.mime as FormatoPdfAsset["mime"], sha256: row.sha256, bytes });
      }
    }
    let bytes: Uint8Array;
    try { bytes = await createFormatoPdf(formatoId, values, assets); }
    catch (error) { throw new ApiError(409, error instanceof Error ? error.message : "No se pudo preparar el PDF"); }
    response = new Response(Buffer.from(bytes), { headers: {
      ...privateHeaders, "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Fortius-${formatoId}.pdf"`,
      "Content-Length": String(bytes.byteLength),
    } });
    return {};
  });
  return response ?? failure;
}
