import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, databaseError } from "@/lib/backend/http";
import { findRun, mapRun } from "@/lib/apps/repository";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiResponse(async () => { const { client } = await requireStaff(); const { id } = await params; await findRun(client, id);
    const { data, error } = await client.from("fortius_inmuebles_app_run_versions").select("version,snapshot,recorded_at").eq("run_id", id).order("version", { ascending: false }).limit(50);
    if (error) databaseError(error); return { versions: (data ?? []).map(v => mapRun(v.snapshot)) };
  });
}
