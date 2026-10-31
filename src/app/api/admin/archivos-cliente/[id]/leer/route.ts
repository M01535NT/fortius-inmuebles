import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { leerArchivoConIa } from "@/lib/backend/expediente-lectura";
import { apiResponse, assertSameOrigin } from "@/lib/backend/http";
import { extractor } from "@/lib/ia/proveedor";

export const runtime = "nodejs";
export const maxDuration = 300;
type Context = { params: Promise<{ id: string }> };

/** Lee un documento del cliente con IA y deja sus datos como propuestas del expediente. */
export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    return { lectura: await leerArchivoConIa(client, createServerClient(undefined, true), user.id, id, extractor()) };
  });
}
