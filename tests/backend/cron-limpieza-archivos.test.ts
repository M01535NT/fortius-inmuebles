import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { privileged, purge } = vi.hoisted(() => ({ privileged: vi.fn(() => ({ servicio: true })), purge: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ createServerClient: privileged }));
vi.mock("@/lib/backend/public-file-cleanup", () => ({ purgeRetiredPublicFiles: purge }));
import { readFile } from "node:fs/promises";
import { GET } from "@/app/api/cron/limpieza-archivos/route";

// Tarea diaria de Vercel que borra lo retirado hace más de 30 días (titular, 13/11/2026).
const secret = "clave-de-ensayo-1234567890";
const call = (authorization?: string) => GET(new Request("https://panel.test/api/cron/limpieza-archivos", { headers: authorization ? { authorization } : {} }));
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CRON_SECRET", secret); vi.spyOn(console, "info").mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it("sin la clave configurada no hace nada", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await call(`Bearer ${secret}`)).status).toBe(503);
  expect(purge).not.toHaveBeenCalled();
});

it("rechaza a quien no trae la clave correcta", async () => {
  expect((await call()).status).toBe(401);
  expect((await call("Bearer otra-clave-cualquiera-123")).status).toBe(401);
  expect(purge).not.toHaveBeenCalled();
});

it("con la clave de Vercel limpia por tandas hasta terminar", async () => {
  purge.mockResolvedValueOnce({ purged: 100, restored: 0 }).mockResolvedValueOnce({ purged: 7, restored: 1 });
  const response = await call(`Bearer ${secret}`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, purged: 107, restored: 1 });
  expect(purge).toHaveBeenCalledTimes(2);
});

it("vercel.json programa la tarea una vez al día", async () => {
  const config = JSON.parse(await readFile(new URL("../../vercel.json", import.meta.url), "utf8"));
  expect(config.crons).toEqual([{ path: "/api/cron/limpieza-archivos", schedule: "30 10 * * *" }]);
});
