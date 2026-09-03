import { createHash } from "node:crypto";
import { createServerClient } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { parseLead } from "@/lib/backend/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const data = parseLead(await readJson(request, 16384));
    // Only trust the IP header overwritten by the deployment provider. Unknown
    // hosts share a conservative bucket instead of trusting spoofable headers.
    const address = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ?? "unknown" : "shared";
    const rateKey = createHash("sha256").update(address).digest("hex");
    const result = await createServerClient(undefined, true).rpc("cota_capture_lead", { p_data: data, p_rate_key: rateKey });
    if (result.error) databaseError(result.error);
    return { id: result.data as string };
  }, 201);
}
