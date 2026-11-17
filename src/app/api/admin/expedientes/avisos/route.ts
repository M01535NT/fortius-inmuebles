import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, databaseError } from "@/lib/backend/http";

const DAYS = 7, LIMIT = 30;

/**
  FLX-03 B (DEC-55): los avisos recientes de los asuntos («Se guardó sin: …», «Pasó a … sin: …»)
  para mostrarlos en Hoy. La base solo deja ver los asuntos a los que la persona tiene acceso.
*/
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
    const activity = await client.from("fortius_inmuebles_expediente_actividad")
      .select("id,expediente_id,descripcion,created_at")
      .eq("tipo", "aviso").gte("created_at", since).order("created_at", { ascending: false }).limit(LIMIT);
    if (activity.error) databaseError(activity.error);
    const ids = [...new Set((activity.data ?? []).map(row => row.expediente_id as string))];
    if (!ids.length) return { avisos: [] };
    const operations = await client.from("fortius_inmuebles_expedientes")
      .select("id,folio,cliente_id,asesor_id").in("id", ids).is("deleted_at", null).neq("etapa", "cerrado");
    if (operations.error) databaseError(operations.error);
    const byId = new Map((operations.data ?? []).map(op => [op.id as string, op]));
    const avisos = (activity.data ?? []).flatMap(row => {
      const op = byId.get(row.expediente_id as string);
      return op ? [{ id: row.id, expedienteId: op.id, folio: op.folio, clienteId: op.cliente_id, asesorId: op.asesor_id, texto: row.descripcion, at: row.created_at }] : [];
    });
    return { avisos };
  });
}
