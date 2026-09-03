import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { completeUpload } from "@/lib/backend/files";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user } = await requireStaff();
    const { ticket } = z.object({ ticket: z.string().max(4096) }).strict().parse(await readJson(request, 8192));
    return completeUpload(createServerClient(undefined, true), user.id, ticket);
  }, 201);
}
