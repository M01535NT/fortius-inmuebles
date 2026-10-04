import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError } from "@/lib/backend/http";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";

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
    const values = { ...(draft.data as Record<string, unknown>), folio: parent.data.folio };
    const missing = validateFormato(draft.formato_id, values);
    if (missing.length) throw new ApiError(409, `Faltan datos: ${missing.join(", ")}`);
    const emission = await prepareFormatoEmission(draft.formato_id, values);
    const emissionId = randomUUID();
    const path = `${draft.expediente_id}/${emissionId}.pdf`;
    const privileged = createServerClient(undefined, true);
    const upload = await privileged.storage.from("mnt-expedientes").upload(path, Buffer.from(emission.bytes), { contentType: "application/pdf", upsert: false });
    if (upload.error) databaseError(upload.error);
    const saved = await privileged.from("mnt_formato_emissions").insert({
      id: emissionId, draft_id: id, draft_version: draft.version,
      snapshot: { ...values, formatoId: draft.formato_id, source: definition.source },
      sha256: emission.sha256, path, created_by: user.id,
    }).select("id,draft_id,draft_version,sha256,created_by,created_at").single();
    if (saved.error) {
      await privileged.storage.from("mnt-expedientes").remove([path]);
      databaseError(saved.error);
    }
    return { emision: saved.data };
  }, 201);
}
