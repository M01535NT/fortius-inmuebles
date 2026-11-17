import { createHash, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@/lib/backend/auth";
import { limpiarBandejaVencida } from "@/lib/backend/bandeja";
import { purgeRetiredPublicFiles } from "@/lib/backend/public-file-cleanup";

/*
  Tarea diaria de Vercel (vercel.json, «crons»; titular, 13/11/2026): borra para siempre lo que se retiró
  del almacenamiento público hace más de 30 días y regresa a público lo que volvió a usarse. También descarta lo que
  lleva 30 días por confirmar en la Bandeja y saca su archivo de la carga temporal (DEC-54).
  Vercel la llama con «Authorization: Bearer <CRON_SECRET>». Sin CRON_SECRET en el servidor no hace nada.
*/
export const runtime = "nodejs";
const ROUNDS = 10; // hasta 1000 archivos por día; lo que falte sigue al día siguiente

const digest = (value: string) => createHash("sha256").update(value).digest();
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  return timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${secret}`));
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) return Response.json({ error: "Tarea no configurada" }, { status: 503 });
  if (!authorized(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const service = createServerClient(undefined, true);
    const total = { purged: 0, restored: 0 };
    for (let round = 0; round < ROUNDS; round++) {
      const { purged, restored } = await purgeRetiredPublicFiles(service);
      total.purged += purged; total.restored += restored;
      if (purged + restored < 100) break;
    }
    console.info(JSON.stringify({ event: "public_file_purge", ...total }));
    // La Bandeja va aparte: si falla, lo público ya quedó limpio y se reintenta al día siguiente.
    let bandeja = 0;
    try {
      for (let round = 0; round < ROUNDS; round++) {
        const n = await limpiarBandejaVencida(service);
        bandeja += n;
        if (n < 100) break;
      }
    } catch { console.info(JSON.stringify({ event: "bandeja_purge_failed" })); }
    console.info(JSON.stringify({ event: "bandeja_purge", descartados: bandeja }));
    return Response.json({ ok: true, ...total, bandeja });
  } catch {
    return Response.json({ error: "No se pudo limpiar" }, { status: 503 });
  }
}
