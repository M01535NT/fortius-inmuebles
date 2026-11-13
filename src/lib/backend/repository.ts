import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredRecord } from "./contracts";
import { parseCollection, parseDelete, parseRecord, parseWrite, projectTeamProperty } from "./validation";
import { databaseError, readAllPages } from "./http";

type DatabaseClient = Pick<SupabaseClient, "from" | "rpc">;

export async function listRecords(client: DatabaseClient, collection: string): Promise<StoredRecord[]> {
  const name = parseCollection(collection);
  const rows = await readAllPages((from, to) => client.from("fortius_inmuebles_records").select("id,data,version,created_at,updated_at")
    .eq("collection", name).order("created_at", { ascending: false }).order("id").range(from, to));
  return rows.map(toRecord);
}

type Row = { id: string; data: unknown; version: number; created_at: string; updated_at: string };
const toRecord = (row: Row): StoredRecord => ({ id: row.id, data: row.data as StoredRecord["data"], version: row.version, createdAt: row.created_at, updatedAt: row.updated_at });
/** La función todavía no existe en esta base (migración de A1 sin aplicar). */
const missingFunction = (error: { code?: string }) => error.code === "PGRST202" || error.code === "42883";

/**
  Lo que el panel recibe de una colección según quién pregunta: el director todo; un asesor, de los
  inmuebles de otros asesores solo lo público (COR-23, DEC-43). Las demás colecciones ya las acota la base.

  A1 (auditoría de seguridad, 13/11/2026): la base deja de mostrar a un asesor los inmuebles ajenos
  por lectura directa; los recibe ya recortados por `fortius_inmuebles_team_properties()` (sus
  propios inmuebles, completos; los ajenos, sin seguimiento privado). Aquí se recorta otra vez, por
  si acaso. Mientras la migración no esté aplicada se usa la lectura de antes.
*/
export async function listRecordsFor(client: DatabaseClient, collection: string, role: string): Promise<StoredRecord[]> {
  if (role === "admin" || parseCollection(collection) !== "propiedades") return listRecords(client, collection);
  const { data: mine, error } = await client.rpc("fortius_inmuebles_current_asesor_id");
  if (error) databaseError(error);
  const team = await teamProperties(client);
  const records = team ?? await listRecords(client, collection);
  return records.map(record => {
    const data = record.data as Record<string, unknown>;
    return mine && data.asesorId === mine ? record : { ...record, data: projectTeamProperty(data) };
  });
}

async function teamProperties(client: DatabaseClient): Promise<StoredRecord[] | null> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.rpc("fortius_inmuebles_team_properties").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) { if (offset === 0 && missingFunction(error)) return null; databaseError(error); }
    const page = (data ?? []) as Row[];
    rows.push(...page);
    if (page.length < 500) return rows.map(toRecord);
  }
}

export async function putRecord(client: Pick<SupabaseClient, "rpc">, collection: string, id: string, input: unknown): Promise<StoredRecord> {
  const name = parseCollection(collection);
  const { data: value, version } = parseWrite(input);
  const record = parseRecord(name, id, value);
  const { data, error } = await client.rpc("fortius_inmuebles_put_record", { p_collection: name, p_id: id, p_data: record, p_version: version });
  if (error) databaseError(error);
  return data as StoredRecord;
}

export async function deleteRecord(client: Pick<SupabaseClient, "rpc">, collection: string, id: string, input: unknown): Promise<void> {
  const name = parseCollection(collection);
  const { version } = parseDelete(input);
  const { error } = await client.rpc("fortius_inmuebles_delete_record", { p_collection: name, p_id: id, p_version: version });
  if (error) databaseError(error);
}
