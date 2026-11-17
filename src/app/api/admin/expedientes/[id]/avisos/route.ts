import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, databaseError } from "@/lib/backend/http";
import { defaultRoute } from "@/lib/admin/operation-view";
import { initialBlockers, loadInitialStatus } from "@/lib/formatos/operation-gates";
import { isOwnerRoute, operationWorkflowSchema } from "@/lib/formatos/operation-workflow";
import { PROMESA_REVISION } from "@/lib/formatos/promesa";

/*
  Avisos del asunto que necesitan leer sus documentos (DEC-61, 16/11/2026: lo que antes frenaba ahora avisa).
  - Arranque del propietario: checklist, entrevista inicial 02 y levantamiento 04 (los mismos textos que calcula
    operation-gates). Solo en ventas y rentas del propietario que no son inventario heredado.
  - Legales: revisión jurídica de la promesa 15 antes de firmar y aviso de privacidad 01 al cliente que compra o renta.
  Solo lectura; la sesión ve lo que su rol le deja ver (RLS).
*/

type Aviso = { clave: string; texto: string; legal?: true; documento?: { formato: string; id?: string } };
type Draft = { id: string; formato_id: string; version: number; data: Record<string, unknown> | null; updated_at: string };

const vacio = (v: unknown) => v == null || (typeof v === "string" && !v.trim());

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const exp = await client.from("fortius_inmuebles_expedientes").select("id,operacion,etapa,flujo").eq("id", id).is("deleted_at", null).maybeSingle();
    if (exp.error) databaseError(exp.error);
    if (!exp.data) throw new ApiError(404, "Expediente no encontrado");
    const parsed = operationWorkflowSchema.safeParse(exp.data.flujo);
    const flujo = parsed.success ? parsed.data : null;
    const ruta = flujo?.ruta ?? defaultRoute(exp.data.operacion);
    if (flujo && flujo.estado !== "activa") return { avisos: [] };

    const drafts = await client.from("fortius_inmuebles_formato_drafts").select("id,formato_id,version,data,updated_at").eq("expediente_id", id);
    if (drafts.error) databaseError(drafts.error);
    const lista = (drafts.data ?? []) as Draft[];
    const ultimo = (match: (f: string) => boolean) => lista.filter((d) => match(d.formato_id)).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    const avisos: Aviso[] = [];

    // Arranque del propietario (antes, candado al salir de captación).
    if (["venta", "renta"].includes(exp.data.operacion) && isOwnerRoute(ruta) && !flujo?.heredado) {
      const faltan = initialBlockers(await loadInitialStatus(client, id));
      const d02 = ultimo((f) => f === "02"), d04 = ultimo((f) => f.startsWith("04"));
      for (const texto of faltan) {
        if (texto.includes("(02)")) avisos.push({ clave: "entrevista", texto: d02 ? "La entrevista inicial (02) no tiene su PDF al día" : "Falta la entrevista inicial (02)", documento: { formato: "02", id: d02?.id } });
        else if (texto.includes("(04)")) avisos.push({ clave: "levantamiento", texto: d04 ? "El levantamiento (04) no tiene su PDF al día" : "Falta el levantamiento (04)", documento: { formato: "04", id: d04?.id } });
        else avisos.push({ clave: "checklist", texto: "Faltan documentos del checklist del propietario" });
      }
    }

    // Revisión jurídica de la promesa (15) antes de firmar.
    const d15 = ultimo((f) => f === "15");
    if (d15 && PROMESA_REVISION.some((k) => vacio(d15.data?.[k])))
      avisos.push({ clave: "revision15", texto: "La promesa de compraventa (15) aún no tiene la revisión del abogado antes de firmar", legal: true, documento: { formato: "15", id: d15.id } });

    // Aviso de privacidad (01) para quien compra o renta (al propietario se le entrega con la entrevista 02).
    if (!isOwnerRoute(ruta) && ruta !== "inversion") {
      const r = flujo?.requisitos?.privacidad?.estado;
      const d01 = ultimo((f) => f === "01");
      let emitido = false;
      if (d01) {
        const em = await client.from("fortius_inmuebles_formato_emissions").select("id").eq("draft_id", d01.id).limit(1);
        if (em.error) databaseError(em.error);
        emitido = (em.data ?? []).length > 0;
      }
      if (!emitido && r !== "recibido" && r !== "revisado" && r !== "no_aplica")
        avisos.push({ clave: "privacidad", texto: "Falta darle al cliente el aviso de privacidad (01)", legal: true, documento: { formato: "01", id: d01?.id } });
    }
    return { avisos };
  });
}
