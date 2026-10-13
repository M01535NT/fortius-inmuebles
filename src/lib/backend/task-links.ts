import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError } from "./http";

export async function taskExpedienteLinksReady(client: Pick<SupabaseClient, "from">): Promise<boolean> {
  // The column and all guards are installed in one transaction. Query no rows.
  const { error } = await client.from("fortius_inmuebles_records").select("task_expediente_id").limit(0);
  if (error?.code === "42703" || error?.code === "PGRST204") return false;
  if (error) databaseError(error);
  return true;
}
