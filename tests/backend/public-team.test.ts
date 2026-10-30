import { expect, test, vi } from "vitest";

test("sin secreto de servidor, el equipo publicado queda vacío", async () => {
  vi.resetModules();
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  const { getPublishedTeam } = await import("@/lib/backend/public-team");
  await expect(getPublishedTeam()).resolves.toEqual([]);
});
