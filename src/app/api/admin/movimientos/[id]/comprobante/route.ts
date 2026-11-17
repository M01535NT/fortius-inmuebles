import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { urlDeComprobante } from "@/lib/backend/movimientos";
import { apiResponse } from "@/lib/backend/http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

/** URL firmada de 5 minutos para ver el comprobante privado; antes, la base confirma que la sesión ve el movimiento. */
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    return urlDeComprobante(client, createServerClient(undefined, true), id);
  });
}
