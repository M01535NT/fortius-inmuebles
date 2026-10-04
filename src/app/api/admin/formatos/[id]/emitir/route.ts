import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError } from "@/lib/backend/http";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import { MAX_ASSET_BYTES, type FormatoPdfAsset } from "@/lib/formatos/assets";
import { isLevantamiento } from "@/lib/formatos/levantamiento";
import { valorAssetIds } from "@/lib/formatos/valor";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    const result = await client.from("mnt_formato_drafts").select("id,expediente_id,formato_id,data,version").eq("id", id).maybeSingle();
    if (result.error) databaseError(result.error);
    if (!result.data) throw new ApiError(404, "Documento no encontrado");
    const draft = result.data;
    const definition = formatoById(draft.formato_id);
    if (!definition.readyForEmission) throw new ApiError(409, "Formato pendiente de cotejo con el original");
    const parent = await client.from("mnt_expedientes").select("id,folio").eq("id", draft.expediente_id).maybeSingle();
    if (parent.error) databaseError(parent.error);
    if (!parent.data) throw new ApiError(404, "Expediente no encontrado");
    if (!draft.data || typeof draft.data !== "object" || Array.isArray(draft.data)) throw new ApiError(400, "Datos del documento inválidos");
    const values: Record<string, unknown> = { ...(draft.data as Record<string, unknown>), folio: parent.data.folio };
    const missing = validateFormato(draft.formato_id, values);
    if (missing.length) throw new ApiError(409, `Faltan datos: ${missing.join(", ")}`);
    const privileged = createServerClient(undefined, true);
    const assets: FormatoPdfAsset[] = [];
    if (isLevantamiento(draft.formato_id) || draft.formato_id === "07") {
      const assetIds = z.array(z.uuid()).min(2).max(10).parse(draft.formato_id === "07" ? valorAssetIds(values) : [values.fotoPrincipalId, values.croquisId]);
      const images = await client.from("mnt_formato_assets").select("id,kind,caption,source,observed_on,mime,sha256,path").eq("draft_id", id).in("id", assetIds);
      if (images.error) databaseError(images.error);
      if (images.data?.length !== assetIds.length || !assetIds.every((assetId) => images.data.some((image) => image.id === assetId && image.kind === (assetId === values.croquisId ? "croquis" : "foto")))) throw new ApiError(409, "Selecciona las fotografías y el croquis del propio borrador");
      if (draft.formato_id === "07" && images.data.some((image) => image.kind === "foto" && (!image.observed_on || image.observed_on > String(values.fechaEmision)))) throw new ApiError(409, "Las fotografías de la opinión deben tener fecha anterior o igual a la emisión");
      for (const image of images.data) {
        const file = await privileged.storage.from("mnt-expedientes").download(image.path);
        if (file.error || !file.data) throw new ApiError(503, "Una imagen del borrador no está disponible");
        const bytes = Buffer.from(await file.data.arrayBuffer());
        if (bytes.length > MAX_ASSET_BYTES || createHash("sha256").update(bytes).digest("hex") !== image.sha256) throw new ApiError(503, "Una imagen no superó la verificación de integridad");
        assets.push({ ...image, bytes });
      }
    }
    const emission = assets.length ? await prepareFormatoEmission(draft.formato_id, values, assets) : await prepareFormatoEmission(draft.formato_id, values);
    const emissionId = randomUUID();
    const path = `${draft.expediente_id}/${emissionId}.pdf`;
    const upload = await privileged.storage.from("mnt-expedientes").upload(path, Buffer.from(emission.bytes), { contentType: "application/pdf", upsert: false });
    if (upload.error) databaseError(upload.error);
    const saved = await privileged.from("mnt_formato_emissions").insert({
      id: emissionId, draft_id: id, draft_version: draft.version,
      snapshot: { ...values, formatoId: draft.formato_id, source: definition.source, ...(assets.length ? { imagenes: assets.map((image) => ({ id: image.id, kind: image.kind, caption: image.caption, source: image.source, observed_on: image.observed_on, mime: image.mime, sha256: image.sha256 })) } : {}) },
      sha256: emission.sha256, path, created_by: user.id,
    }).select("id,draft_id,draft_version,sha256,created_by,created_at").single();
    if (saved.error) {
      await privileged.storage.from("mnt-expedientes").remove([path]);
      databaseError(saved.error);
    }
    return { emision: saved.data };
  }, 201);
}
