import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { usoDelMes } from "@/lib/backend/expediente-lectura";
import { ApiError, apiResponse } from "@/lib/backend/http";
import { lecturaDisponible } from "@/lib/ia/proveedor";

export const runtime = "nodejs";

/*
  IA-02: gasto del mes de la lectura con IA y el tope vigente, para Configuración. Solo el
  director: suma las lecturas de todas las operaciones, también las que no le tocan a un asesor.
  Devuelve totales; nunca archivos, personas ni datos leídos.
*/
export async function GET() {
  return apiResponse(async () => {
    const { user } = await requireStaff();
    if (user.role !== "admin") throw new ApiError(403, "El gasto de la lectura con IA lo ve el director");
    return { uso: await usoDelMes(createServerClient(undefined, true), lecturaDisponible()) };
  });
}
