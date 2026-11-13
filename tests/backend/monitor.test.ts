import { afterEach, expect, it, vi } from "vitest";
import { parseDsn, reportFailure, safeLabel } from "@/lib/backend/monitor";
import { apiResponse, ApiError } from "@/lib/backend/http";
import { onRequestError } from "@/instrumentation";

// OBS-01 / DEC-19: aviso de fallas a Sentry sin datos personales ni mensajes de error.
const dsn = "https://0123456789abcdef0123456789abcdef@o123.ingest.us.sentry.io/4507654321";
const okSend = () => vi.fn(async () => new Response(null, { status: 200 }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("lee el DSN y rechaza los que no son de Sentry o no usan https", () => {
  expect(parseDsn(dsn)).toEqual({ endpoint: "https://o123.ingest.us.sentry.io/api/4507654321/envelope/", key: "0123456789abcdef0123456789abcdef" });
  for (const bad of ["", "no es url", "http://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/1", "https://o1.ingest.sentry.io/1", "https://0123456789abcdef0123456789abcdef@o1.ingest.sentry.io/abc"])
    expect(parseDsn(bad), bad).toBeNull();
});

it("sin DSN no manda nada", async () => {
  const send = okSend();
  expect(await reportFailure({ kind: "api_failure", category: "unexpected", status: 500 }, {}, send)).toBe(false);
  expect(send).not.toHaveBeenCalled();
});

it("manda un evento mínimo con la ruta como plantilla y la versión publicada", async () => {
  const send = okSend();
  const env = { FORTIUS_SENTRY_DSN: dsn, VERCEL_ENV: "production", VERCEL_GIT_COMMIT_SHA: "ff2e09c1234567890" };
  expect(await reportFailure({ kind: "server_error", category: "TypeError", route: "/api/apps/shared/[token]", routeType: "route", method: "GET", digest: "123" }, env, send)).toBe(true);
  const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("https://o123.ingest.us.sentry.io/api/4507654321/envelope/");
  expect((init.headers as Record<string, string>)["x-sentry-auth"]).toContain("sentry_key=0123456789abcdef0123456789abcdef");
  const [header, item, event] = String(init.body).split("\n").map(line => JSON.parse(line));
  expect(item).toEqual({ type: "event" });
  expect(event.event_id).toBe(header.event_id);
  expect(event).toMatchObject({ level: "error", environment: "production", release: "ff2e09c12345", message: { formatted: "server_error TypeError /api/apps/shared/[token]" } });
  expect(event.tags).toEqual({ kind: "server_error", category: "TypeError", route: "/api/apps/shared/[token]", routeType: "route", method: "GET", digest: "123" });
  expect(Object.keys(event).sort()).toEqual(["environment", "event_id", "fingerprint", "level", "logger", "message", "platform", "release", "tags", "timestamp"]);
});

it("una falla del aviso no se propaga", async () => {
  const send = vi.fn(async () => { throw new Error("sin red"); });
  expect(await reportFailure({ kind: "api_failure", category: "unexpected" }, { FORTIUS_SENTRY_DSN: dsn }, send)).toBe(false);
});

it("las etiquetas no llevan espacios, comillas ni texto largo", () => {
  expect(safeLabel("a b\"c<script>")).toBe("a_b_c_script_");
  expect(safeLabel("x".repeat(300))).toHaveLength(120);
});

it("apiResponse avisa las fallas 5xx con su número de rastreo y sin el mensaje del error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("FORTIUS_SENTRY_DSN", dsn);
  const send = okSend();
  vi.stubGlobal("fetch", send);
  const response = await apiResponse(async () => { throw new Error("cliente@example.com token-secreto"); });
  expect(send).toHaveBeenCalledOnce();
  const body = String((send.mock.calls[0] as unknown as [string, RequestInit])[1].body);
  expect(body).toContain(response.headers.get("x-request-id"));
  expect(body).not.toMatch(/cliente|token-secreto|example/);
  await apiResponse(async () => { throw new ApiError(409, "El registro cambió"); });
  expect(send).toHaveBeenCalledOnce();
});

it("onRequestError manda la plantilla de la ruta, no la URL ni el mensaje", async () => {
  vi.stubEnv("FORTIUS_SENTRY_DSN", dsn);
  const send = okSend();
  vi.stubGlobal("fetch", send);
  const error = Object.assign(new Error("Pedro Pérez 6641234567"), { digest: "998877" });
  await onRequestError(error, { path: "/api/apps/shared/abc123secreto?x=1", method: "GET", headers: { cookie: "sb=secreto" } },
    { routerKind: "App Router", routePath: "/api/apps/shared/[token]", routeType: "route", renderSource: "server-rendering", revalidateReason: undefined });
  const body = String((send.mock.calls[0] as unknown as [string, RequestInit])[1].body);
  expect(body).toContain("/api/apps/shared/[token]");
  expect(body).toContain("998877");
  expect(body).not.toMatch(/abc123secreto|Pedro|6641234567|cookie|sb=/);
});
