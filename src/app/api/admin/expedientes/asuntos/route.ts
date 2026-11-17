import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

/*
  Lo del asunto que la lista del panel nuevo suma a los expedientes (PN-02): título libre, tipo y estado.
  Ruta aditiva; la base decide qué se ve (RLS). Si las columnas aún no existen (PN-02 sin aplicar), `disponible` es false.
  En los dos casos manda el título que quedó como nota «Título: …» (el respaldo de antes de PN-02), la más reciente de cada asunto.

  Estado del asunto: la pantalla lo sigue guardando en la etapa y el flujo (como antes de PN-02). Esta ruta lo copia a
  `estado_asunto` y `resultado` (migración 20261116090200) leyendo la fila: GET dice qué asuntos están desfasados y POST
  los pone al día. Es una copia de lo que ya dice la fila, así que no sube la versión (no invalida lo que otro tiene abierto).
*/
const faltaEnLaBase = (e: { code?: string }) => ["42703", "42P01", "PGRST204", "PGRST205"].includes(e.code ?? "");
const PREFIJO = "Título: ";

type Fila = { id: string; titulo: string | null; tipo_asunto: string | null; estado_asunto: string | null; resultado: string | null; etapa: string; flujo: { estado?: string } | null };

/** Estado que corresponde a la etapa y el flujo: cierre por etapa = se logró; descartada = no se dio; pausada = en espera. */
function estadoDe(f: Pick<Fila, "etapa" | "flujo">): { estado_asunto: "activo" | "en_espera" | "cerrado"; resultado: "se_logro" | "no_se_dio" | null } {
  if (f.etapa === "cerrado") return { estado_asunto: "cerrado", resultado: "se_logro" };
  if (f.flujo?.estado === "descartada") return { estado_asunto: "cerrado", resultado: "no_se_dio" };
  if (f.flujo?.estado === "pausada" || f.flujo?.estado === "regularizacion") return { estado_asunto: "en_espera", resultado: null };
  return { estado_asunto: "activo", resultado: null };
}
const desfasada = (f: Fila) => { const d = estadoDe(f); return d.estado_asunto !== f.estado_asunto || d.resultado !== f.resultado; };

export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const columnas = await client.from("fortius_inmuebles_expedientes").select("id,titulo,tipo_asunto,estado_asunto,resultado,etapa,flujo").is("deleted_at", null).limit(5000);
    let disponible = true;
    const extras: Record<string, { titulo: string | null; tipo_asunto: string | null }> = {};
    const desfasados: string[] = [];
    if (columnas.error) {
      if (!faltaEnLaBase(columnas.error)) databaseError(columnas.error);
      disponible = false;
    } else {
      for (const r of (columnas.data ?? []) as Fila[]) {
        extras[r.id] = { titulo: r.titulo, tipo_asunto: r.tipo_asunto };
        if (desfasada(r)) desfasados.push(r.id);
      }
    }
    const notas = await client.from("fortius_inmuebles_expediente_actividad").select("expediente_id,descripcion,created_at")
      .eq("tipo", "nota").like("descripcion", `${PREFIJO}%`).order("created_at", { ascending: false }).limit(2000);
    if (notas.error) databaseError(notas.error);
    const titulosNota: Record<string, string> = {};
    for (const n of (notas.data ?? []) as { expediente_id: string; descripcion: string }[]) {
      const t = n.descripcion.slice(PREFIJO.length).trim().slice(0, 160);
      if (t && !(n.expediente_id in titulosNota)) titulosNota[n.expediente_id] = t;
    }
    return { disponible, extras, titulosNota, desfasados };
  });
}

const sincronizar = z.object({ ids: z.array(z.uuid()).min(1).max(500) }).strict();

/** Copia el estado de la etapa y el flujo a `estado_asunto` y `resultado` en los asuntos pedidos que estén desfasados. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client } = await requireStaff();
    const { ids } = sincronizar.parse(await readJson(request));
    const { data, error } = await client.from("fortius_inmuebles_expedientes").select("id,titulo,tipo_asunto,estado_asunto,resultado,etapa,flujo")
      .in("id", [...new Set(ids)]).is("deleted_at", null);
    if (error) {
      if (faltaEnLaBase(error)) return { disponible: false, cambiados: 0 };
      databaseError(error);
    }
    let cambiados = 0;
    for (const f of ((data ?? []) as Fila[]).filter(desfasada)) {
      const d = estadoDe(f);
      // Solo si la fila sigue como se leyó: si alguien la cambió entre tanto, la siguiente lectura la vuelve a revisar.
      const r = await client.from("fortius_inmuebles_expedientes").update(d).eq("id", f.id).eq("etapa", f.etapa).select("id").maybeSingle();
      if (r.error) databaseError(r.error);
      if (r.data) cambiados += 1;
    }
    return { disponible: true, cambiados };
  });
}
