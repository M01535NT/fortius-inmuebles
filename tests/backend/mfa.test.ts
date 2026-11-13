import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmTotpEnrollment, loginWithPassword, mfaStatus, startTotpEnrollment, verifyMfaLogin } from "@/lib/backend/auth";
import { GET as sessionRoute } from "@/app/api/auth/session/route";

// AUT-01: verificación en dos pasos del director. Solo se sustituye la frontera con Supabase Auth.
const state = vi.hoisted(() => ({
  cookies: new Map<string, { value: string; options?: Record<string, unknown> }>(),
  factors: [] as { id: string; factor_type: string; status: string; created_at: string; updated_at: string; friendly_name?: string }[],
  role: "admin", goodCode: "123456", verifyCalls: [] as string[], unenrolled: [] as string[], passwordAt: 0,
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => state.cookies.get(name), set: (name: string, value: string, options: Record<string, unknown>) => { state.cookies.set(name, { value, options }); } }) }));

const FACTOR = "20000000-0000-4000-8000-000000000001";
const SECOND = "20000000-0000-4000-8000-000000000002";
const NEW_FACTOR = "20000000-0000-4000-8000-000000000003";
const user = { id: "10000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "director@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-09-02T12:00:00Z" };
const jwt = (aal: "aal1" | "aal2", at = Math.floor(Date.now() / 1000)) => `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, aal, amr: [{ method: "password", timestamp: at }, ...(aal === "aal2" ? [{ method: "totp", timestamp: at }] : [])] })).toString("base64url")}.test-signature`;
const verified = (id: string) => ({ id, factor_type: "totp", status: "verified", created_at: "2026-11-13T12:00:00Z", updated_at: "2026-11-13T12:00:00Z" });
let aal1 = ""; let aal2 = "";
const session = (access_token: string) => ({ access_token, refresh_token: `refresh-${access_token.slice(-20)}`, expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user: { ...user, factors: state.factors } });
const access = () => state.cookies.get("fortius-inmuebles-access-token")?.value;
const claims = (token = access()) => JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));

beforeEach(() => {
  state.cookies.clear(); state.factors = [verified(FACTOR)]; state.role = "admin"; state.verifyCalls = []; state.unenrolled = [];
  state.passwordAt = Math.floor(Date.now() / 1000);
  aal1 = jwt("aal1", state.passwordAt); aal2 = jwt("aal2", state.passwordAt);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-test.supabase.co"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init.headers);
    const method = init.method ?? "GET";
    if (url.pathname === "/auth/v1/token") return Response.json(session(aal1));
    if (url.pathname === "/auth/v1/user") {
      const bearer = headers.get("authorization")?.replace("Bearer ", "");
      if (bearer !== aal1 && bearer !== aal2) return Response.json({ msg: "invalid JWT", error_code: "bad_jwt" }, { status: 401 });
      return Response.json({ ...user, factors: state.factors });
    }
    const factor = url.pathname.match(/^\/auth\/v1\/factors\/([^/]+)(?:\/(challenge|verify))?$/);
    if (factor?.[2] === "challenge") return Response.json({ id: "30000000-0000-4000-8000-000000000001", type: "totp", expires_at: Math.floor(Date.now() / 1000) + 300 });
    if (factor?.[2] === "verify") {
      state.verifyCalls.push(factor[1]);
      const { code } = JSON.parse(String(init.body));
      if (code !== state.goodCode || (factor[1] === SECOND)) return Response.json({ error_code: "mfa_verification_failed", msg: "Invalid TOTP code entered" }, { status: 422 });
      state.factors = state.factors.map(item => item.id === factor[1] ? { ...item, status: "verified" } : item);
      return Response.json(session(aal2));
    }
    if (factor && method === "DELETE") { state.unenrolled.push(factor[1]); state.factors = state.factors.filter(item => item.id !== factor[1]); return Response.json({ id: factor[1] }); }
    if (url.pathname === "/auth/v1/factors" && method === "POST") {
      state.factors = [...state.factors, { ...verified(NEW_FACTOR), status: "unverified" }];
      return Response.json({ id: NEW_FACTOR, type: "totp", friendly_name: "Dispositivo", totp: { qr_code: "data:image/svg+xml;utf-8,<svg xmlns='http://www.w3.org/2000/svg'><path d='M0 0h1'/></svg>", secret: "JBSWY3DPEHPK3PXP", uri: "otpauth://totp/x" } });
    }
    if (url.pathname === "/rest/v1/fortius_inmuebles_staff") return Response.json([{ role: state.role, active: true }]);
    if (url.pathname === "/rest/v1/rpc/fortius_inmuebles_auth_attempt") return Response.json(1);
    throw new Error(`Unexpected external request: ${method} ${url.pathname}`);
  });
});

describe("verificación en dos pasos (AUT-01)", () => {
  it("la contraseña sola no abre el panel a quien tiene la app registrada", async () => {
    expect(await loginWithPassword({ email: user.email, password: "a long password" })).toEqual({ mfaRequired: true });
    expect(claims().aal).toBe("aal1");
    const response = await sessionRoute();
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ mfa: "required" });
  });

  it("el código correcto sube la sesión y uno equivocado no", async () => {
    await loginWithPassword({ email: user.email, password: "a long password" });
    await expect(verifyMfaLogin({ code: "000000" })).rejects.toMatchObject({ status: 400, details: { mfa: "required" } });
    expect(claims().aal).toBe("aal1");
    await expect(verifyMfaLogin({ code: "12a456" })).rejects.toThrow();
    expect((await verifyMfaLogin({ code: "123456" })).user.role).toBe("admin");
    expect(claims().aal).toBe("aal2");
    expect((await sessionRoute()).status).toBe(200);
  });

  it("con dos dispositivos vale el código de cualquiera", async () => {
    state.factors = [verified(SECOND), verified(FACTOR)];
    await loginWithPassword({ email: user.email, password: "a long password" });
    expect((await verifyMfaLogin({ code: "123456" })).user.role).toBe("admin");
    expect(state.verifyCalls).toEqual([SECOND, FACTOR]);
  });

  it("sin la app registrada todo sigue igual", async () => {
    state.factors = [{ ...verified(FACTOR), status: "unverified" }];
    expect(await loginWithPassword({ email: user.email, password: "a long password" })).toMatchObject({ user: { role: "admin" } });
  });

  it("el alta es del director, con acceso reciente, y entrega el QR como imagen", async () => {
    state.factors = [];
    await loginWithPassword({ email: user.email, password: "a long password" });
    expect(await mfaStatus()).toEqual({ available: true, devices: [] });
    const started = await startTotpEnrollment();
    expect(started).toMatchObject({ factorId: NEW_FACTOR, secret: "JBSWY3DPEHPK3PXP" });
    expect(started.qr.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(Buffer.from(started.qr.split(",")[1], "base64").toString("utf8")).toContain("<svg");
    await expect(confirmTotpEnrollment({ factorId: NEW_FACTOR, code: "999999" })).rejects.toMatchObject({ status: 400 });
    expect(await confirmTotpEnrollment({ factorId: NEW_FACTOR, code: "123456" })).toEqual({ ok: true });
    expect(claims().aal).toBe("aal2");
    expect((await mfaStatus()).devices).toHaveLength(1);
  });

  it("un alta a medias se descarta y no se pasa de dos dispositivos", async () => {
    state.factors = [];
    await loginWithPassword({ email: user.email, password: "a long password" });
    await startTotpEnrollment();
    await startTotpEnrollment();
    expect(state.unenrolled).toEqual([NEW_FACTOR]);
    state.factors = [verified(FACTOR), verified(SECOND)];
    state.cookies.set("fortius-inmuebles-access-token", { value: aal2 });
    await expect(startTotpEnrollment()).rejects.toMatchObject({ status: 409 });
  });

  it("un asesor no puede activarla todavía y una sesión vieja debe volver a entrar", async () => {
    state.factors = []; state.role = "editor";
    await loginWithPassword({ email: user.email, password: "a long password" });
    await expect(startTotpEnrollment()).rejects.toMatchObject({ status: 403 });
    expect(await mfaStatus()).toEqual({ available: false, devices: [] });
    state.role = "admin";
    aal1 = jwt("aal1", Math.floor(Date.now() / 1000) - 3600);
    state.cookies.set("fortius-inmuebles-access-token", { value: aal1 });
    await expect(startTotpEnrollment()).rejects.toMatchObject({ status: 401, details: { reauth: true } });
  });
});
