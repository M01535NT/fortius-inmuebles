import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { crearMovimiento, listarMovimientos } from "@/lib/backend/movimientos";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Movimientos de Dinero que la sesión puede ver (PN-08). Sin la tabla, 503. */
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    return { movimientos: await listarMovimientos(client) };
  });
}

/** Anota un movimiento: comisión, gasto por reembolsar o apartado (con su comprobante, si viene el ticket). */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    return { movimiento: await crearMovimiento(client, createServerClient(undefined, true), user.id, await readJson(request, 8192)) };
  }, 201);
}
