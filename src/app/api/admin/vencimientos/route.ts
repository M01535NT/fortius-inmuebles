import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, databaseError, readAllPages } from "@/lib/backend/http";

/*
  Fechas del contrato de intermediación (09) de cada operación para los avisos de Hoy
  (titular, 29/10/2026): fin del encargo y vigencia de la licencia estatal. Devuelve solo
  esas fechas, del borrador más reciente de cada operación, y si su versión actual ya
  tiene PDF emitido; nunca el cuerpo del documento. El cliente del usuario conserva la
  RLS de operaciones y documentos.
*/

type Row = { id: string; expediente_id: string; version: number; inicio: string | null; fin: string | null; modalidad: string | null; licenciaEstado: string | null; licenciaNumero: string | null; licenciaVigencia: string | null; expediente: { folio: string } | { folio: string }[] };
const day = (value: string | null) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const rows = await readAllPages<Row>((from, to) => client.from("fortius_inmuebles_formato_drafts")
      .select("id,expediente_id,version,inicio:data->>inicio,fin:data->>fin,modalidad:data->>modalidad,licenciaEstado:data->>licenciaEstado,licenciaNumero:data->>licenciaNumero,licenciaVigencia:data->>licenciaVigencia,expediente:fortius_inmuebles_expedientes!inner(folio,deleted_at)")
      .eq("formato_id", "09").is("expediente.deleted_at", null)
      .order("updated_at", { ascending: false }).order("id", { ascending: false }).range(from, to));
    // La lista llega del más reciente al más antiguo: el primero de cada operación es el vigente.
    const latest = new Map<string, Row>();
    for (const row of rows) if (!latest.has(row.expediente_id)) latest.set(row.expediente_id, row);
    const drafts = [...latest.values()];
    const emitted = new Set<string>();
    for (let i = 0; i < drafts.length; i += 100) {
      const chunk = drafts.slice(i, i + 100);
      const { data, error } = await client.from("fortius_inmuebles_formato_emissions").select("draft_id,draft_version").in("draft_id", chunk.map(d => d.id));
      if (error) databaseError(error);
      for (const e of data ?? []) emitted.add(`${e.draft_id}:${e.draft_version}`);
    }
    return {
      contratos: drafts.map(row => {
        const parent = Array.isArray(row.expediente) ? row.expediente[0] : row.expediente;
        if (typeof parent?.folio !== "string") throw new ApiError(503, "No se pudo consultar el contexto de los contratos");
        return {
          expedienteId: row.expediente_id, folio: parent.folio, emitido: emitted.has(`${row.id}:${row.version}`),
          inicio: day(row.inicio), fin: day(row.fin), exclusiva: row.modalidad === "exclusiva",
          licencia: row.licenciaEstado === "vigente" ? { numero: row.licenciaNumero?.trim().slice(0, 80) || undefined, vigencia: day(row.licenciaVigencia) } : undefined,
        };
      }),
    };
  });
}
