import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredRecord } from "./contracts";
import { parseCollection, parseDelete, parseRecord, parseWrite } from "./validation";
import { databaseError, readAllPages } from "./http";

type DatabaseClient = Pick<SupabaseClient, "from" | "rpc">;

export async function listRecords(client: DatabaseClient, collection: string): Promise<StoredRecord[]> {
  const name = parseCollection(collection);
  const rows = await readAllPages((from, to) => client.from("fortius_inmuebles_records").select("id,data,version,created_at,updated_at")
    .eq("collection", name).order("created_at", { ascending: false }).order("id").range(from, to));
  return rows.map(row => ({ id: row.id, data: row.data, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at }));
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
