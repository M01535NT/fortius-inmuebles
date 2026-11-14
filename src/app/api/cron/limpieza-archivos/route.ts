import { createHash, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@/lib/backend/auth";
import { purgeRetiredPublicFiles } from "@/lib/backend/public-file-cleanup";

/*
  Tarea diaria de Vercel (vercel.json, «crons»; titular, 13/11/2026): borra para siempre lo que se retiró
  del almacenamiento público hace más de 30 días y regresa a público lo que volvió a usarse.
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
    return Response.json({ ok: true, ...total });
  } catch {
    return Response.json({ error: "No se pudo limpiar" }, { status: 503 });
  }
}
