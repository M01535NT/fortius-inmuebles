import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { permisoDeBandeja } from "@/lib/backend/bandeja";
import { apiResponse, assertSameOrigin } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** Ticket de carga y URL de vista nuevos para seguir con un archivo de la Bandeja después de recargar. */
export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    return await permisoDeBandeja(client, createServerClient(undefined, true), user.id, id);
  });
}
