import { createServerClient } from "@/lib/backend/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { error } = await createServerClient().rpc("fortius_inmuebles_public_records", {
      p_collection: "config",
    });
    if (error) throw new Error("database unavailable");
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
