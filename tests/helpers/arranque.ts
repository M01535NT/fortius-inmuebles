import { createHash, randomUUID } from "node:crypto";

/** Lo mínimo de PGlite (o de cualquier cliente SQL) que necesita el helper. */
type Sql = { query: (sql: string, params?: unknown[]) => Promise<unknown> };
const rows = <T>(result: unknown) => (result as { rows: T[] }).rows;

/**
  Candado de arranque (SEG-M2, migración 20261113124000): una venta o renta del propietario no sale de
  captación sin la entrevista inicial (02) y el levantamiento (04) emitidos en su versión vigente y el
  checklist de documentos completo. Las pruebas que recorren el flujo más allá de captación llaman a
  este helper antes de avanzar; el candado mismo se prueba aparte.

  Prepara, como dueño de la base: un borrador 02 y uno 04B del expediente, una emisión de la versión
  vigente de cada uno y la tarea `checklist-<expediente>` con sus pasos hechos y los mismos vínculos
  del expediente. Si el checklist ya existe no lo toca, para no ocultar lo que la prueba haya preparado.
  Se puede llamar dentro o fuera de `asUser`: al terminar restaura el rol y el usuario de la sesión.
  `responsable` es quien emite y escribe la tarea (el asesor del expediente o el director).
*/
export async function cumplirArranque(db: Sql, expedienteId: string, responsable: string): Promise<void> {
  const [session] = rows<{ role: string; sub: string }>(await db.query("select current_user::text as role, coalesce(current_setting('request.jwt.claim.sub',true),'') as sub"));
  await db.query("reset role");
  try {
    for (const formato of ["02", "04B"]) {
      const draftId = randomUUID();
      await db.query(
        "insert into public.fortius_inmuebles_formato_drafts(id,expediente_id,formato_id,data,version) values ($1,$2,$3,'{}'::jsonb,1)",
        [draftId, expedienteId, formato],
      );
      await db.query(
        "insert into public.fortius_inmuebles_formato_emissions(draft_id,draft_version,snapshot,sha256,path,created_by) values ($1,1,'{}'::jsonb,$2,$3,$4)",
        [draftId, createHash("sha256").update(`${expedienteId}:${formato}`).digest("hex"), `${expedienteId}/${randomUUID()}.pdf`, responsable],
      );
    }
    // La tarea lleva los vínculos del expediente y se escribe a nombre del responsable: el disparador
    // de registros rechaza vínculos incongruentes y a quien no tiene acceso al expediente.
    const [links] = rows<{ cliente_id: string | null; asesor_id: string | null; propiedad_slug: string | null }>(await db.query("select cliente_id, asesor_id, propiedad_slug from public.fortius_inmuebles_expedientes where id=$1", [expedienteId]));
    const checklist = {
      id: `checklist-${expedienteId}`,
      titulo: "Reunir los documentos del propietario",
      descripcion: "",
      categoria: "documentacion",
      estado: "completada",
      prioridad: "normal",
      expedienteId,
      ...(links?.cliente_id ? { clienteId: links.cliente_id } : {}),
      ...(links?.asesor_id ? { asesorId: links.asesor_id } : {}),
      ...(links?.propiedad_slug ? { propiedadSlug: links.propiedad_slug } : {}),
      pasos: [{ id: "D01", texto: "D01 · Escritura (ficticia de ensayo)", hecho: true }],
    };
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [responsable]);
    await db.query(
      "insert into public.fortius_inmuebles_records(collection,id,data) values ('tareas',$1,$2::jsonb) on conflict do nothing",
      [checklist.id, JSON.stringify(checklist)],
    );
  } finally {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [session?.sub ?? ""]);
    if (session?.role === "anon" || session?.role === "authenticated") await db.query(`set role ${session.role}`);
  }
}
