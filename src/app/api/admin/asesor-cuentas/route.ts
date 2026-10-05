import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
const input = z.object({ userId: z.uuid(), asesorId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/) }).strict();

export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    if (user.role !== "admin") throw new ApiError(403, "Solo el administrador vincula cuentas");
    const privileged = createServerClient(undefined, true);
    const [staff, accounts, authUsers] = await Promise.all([
      privileged.from("fortius_inmuebles_staff").select("user_id,role,active").order("created_at"),
      client.from("fortius_inmuebles_adviser_accounts").select("user_id,asesor_id"),
      privileged.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (staff.error) databaseError(staff.error);
    if (accounts.error) databaseError(accounts.error);
    if (authUsers.error) throw new ApiError(503, "No se pudieron consultar las cuentas");
    const emails = new Map(authUsers.data.users.map((item) => [item.id, item.email ?? ""]));
    return { cuentas: (staff.data ?? []).map((item) => ({ ...item, email: emails.get(item.user_id) ?? "", asesor_id: (accounts.data ?? []).find((account) => account.user_id === item.user_id)?.asesor_id ?? null })) };
  });
}

export async function PUT(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    if (user.role !== "admin") throw new ApiError(403, "Solo el administrador vincula cuentas");
    const data = input.parse(await readJson(request, 4096));
    const privileged = createServerClient(undefined, true);
    const membership = await privileged.from("fortius_inmuebles_staff").select("role,active").eq("user_id", data.userId).maybeSingle();
    if (membership.error) databaseError(membership.error);
    if (!membership.data?.active || membership.data.role !== "editor") throw new ApiError(400, "La cuenta debe ser de un asesor editor activo");
    const result = await client.from("fortius_inmuebles_adviser_accounts").upsert({ user_id: data.userId, asesor_id: data.asesorId }, { onConflict: "user_id" }).select("user_id,asesor_id").single();
    if (result.error) databaseError(result.error);
    return { cuenta: result.data };
  });
}
