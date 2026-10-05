import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, databaseError } from "./http";

const leadId = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/);
const inputSchema = z.object({ version: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER) }).strict();

export async function convertLead(client: Pick<SupabaseClient, "rpc">, id: string, input: unknown) {
  const { version } = inputSchema.parse(input);
  const { data, error } = await client.rpc("mnt_convert_lead", { p_lead_id: leadId.parse(id), p_version: version });
  if (error?.code === "PT404") throw new ApiError(404, "Lead no encontrado");
  if (error) databaseError(error);
  return data;
}
