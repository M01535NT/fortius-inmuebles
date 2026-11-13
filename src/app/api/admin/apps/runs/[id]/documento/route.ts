import { createHash } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, databaseError } from "@/lib/backend/http";
import { findRun } from "@/lib/apps/repository";
import { adjuntosDe, DOCUMENTOS_APP, documentoIndependienteInput, FOLIO_INDEPENDIENTE } from "@/lib/apps/documentos";
import { emiteIncompleto, formatoById, validateFormato } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { MAX_ASSET_BYTES, type FormatoPdfAsset } from "@/lib/formatos/assets";
import { valorAssetIds } from "@/lib/formatos/valor";
import { isLevantamiento } from "@/lib/formatos/levantamiento";

/*
  PDF de un documento suelto: se genera con la versión guardada del trabajo y se entrega al
  momento. No se archiva ni deja emisión, porque no pertenece a una operación. Con
  «incompleto=1» sale aunque falten datos, marcado al pie (RP-77), salvo el aviso de privacidad
  (01) y la promesa (15), que conservan sus reglas.
*/

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let response: Response | undefined;
  const failure = await apiResponse(async () => {
    const { client } = await requireStaff();
    const run = await findRun(client, (await params).id);
    const query = new URL(request.url).searchParams;
    const version = z.coerce.number().int().positive().parse(query.get("version"));
    if (run.slug !== DOCUMENTOS_APP) throw new ApiError(400, "Este trabajo no es un documento");
    if (run.version !== version) throw new ApiError(409, "El documento cambió; guarda o recarga antes de generar el PDF");
    const parsed = documentoIndependienteInput.safeParse(run.input);
    if (!parsed.success) throw new ApiError(400, "Revisa la captura del documento");
    const { formatoId, data } = parsed.data, adjuntos = adjuntosDe(data);
    const definition = formatoById(formatoId);
    if (!definition.readyForEmission) throw new ApiError(409, "El PDF de este formato sigue bloqueado; descarga el Word");
    const values = { ...data, folio: FOLIO_INDEPENDIENTE };
    const missing = validateFormato(formatoId, values);
    const incompleto = missing.length > 0 && query.get("incompleto") === "1" && emiteIncompleto(formatoId);
    if (missing.length && !incompleto) throw new ApiError(409, `Faltan datos: ${missing.join(", ")}`);

    const assets: FormatoPdfAsset[] = [];
    // Imágenes elegidas: las del reporte fotográfico (07) o la foto principal y el croquis (levantamientos).
    const ids = formatoId === "07" ? valorAssetIds(values) : isLevantamiento(formatoId) ? [data.fotoPrincipalId, data.croquisId].filter((v): v is string => typeof v === "string" && z.uuid().safeParse(v).success) : [];
    if (ids.length) {
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
    try { bytes = await createFormatoPdf(formatoId, values, assets, incompleto ? { incompleto: true } : {}); }
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
