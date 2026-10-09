import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acceptAuthCallback, changePassword, loginWithPassword, logoutSession, requireStaff, requestRecovery } from "@/lib/backend/auth";
import { PATCH as profileRoute } from "@/app/api/auth/profile/route";
import { GET as photoRoute } from "@/app/api/auth/profile/photo/route";
import { GET as sessionRoute } from "@/app/api/auth/session/route";
import { GET as listRoute } from "@/app/api/admin/collections/[collection]/route";
import { PUT as putRoute } from "@/app/api/admin/collections/[collection]/[id]/route";
import { POST as leadRoute } from "@/app/api/leads/route";
import { POST as uploadRoute, GET as fileRoute } from "@/app/api/admin/files/route";

const state = vi.hoisted(() => ({ cookies: new Map<string, { value: string; options?: Record<string, unknown> }>(), active: true, member: true, validPassword: true, authServiceFailure: false, password: "", recoveryFailure: false, leadFailure: false, fileMissing: false }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => state.cookies.get(name), set: (name: string, value: string, options: Record<string, unknown>) => { state.cookies.set(name, { value, options }); } }) }));
const user = { id: "10000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email: "staff@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-09-02T12:00:00Z" };
const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test-signature`;
const session = { access_token: token, refresh_token: "test-refresh-token", expires_in: 3600, token_type: "bearer", user };

beforeEach(() => {
  user.user_metadata = {};
  state.cookies.clear(); state.active = true; state.member = true; state.validPassword = true; state.password = ""; state.recoveryFailure = false; state.leadFailure = false;
  state.authServiceFailure = false;
  state.fileMissing = false;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fortius-inmuebles-test.supabase.co"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test_key");
  vi.stubEnv("FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED", "true");
  vi.stubEnv("FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED", "true");
  // Only the external Auth/PostgREST boundary is replaced. Supabase-js and our
  // session, membership, cookies and password code execute unchanged.
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init.headers);
    if (url.pathname === "/auth/v1/token") {
      if (state.authServiceFailure) return Response.json({ error_code: "unexpected_failure", msg: "Internal authentication failure" }, { status: 400 });
      return state.validPassword ? Response.json(session) : Response.json({ error_code: "invalid_credentials", msg: "Invalid login credentials" }, { status: 400 });
    }
    if (url.pathname === "/auth/v1/verify") return Response.json(session);
    if (url.pathname === "/auth/v1/user") {
      if (headers.get("authorization") !== `Bearer ${token}`) return Response.json({ msg: "invalid JWT", error_code: "bad_jwt" }, { status: 401 });
      if (init.method === "PUT") { const body = JSON.parse(String(init.body)); state.password = body.password; if (body.data) user.user_metadata = body.data; }
      return Response.json(user);
    }
    if (url.pathname === "/rest/v1/fortius_inmuebles_staff") return Response.json(state.member ? [{ role: "admin", active: state.active }] : []);
    if (url.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
    if (url.pathname === "/auth/v1/recover") return state.recoveryFailure ? Response.json({ msg: "SMTP is unavailable", error_code: "unexpected_failure" }, { status: 500 }) : Response.json({});
    if (url.pathname === "/rest/v1/rpc/fortius_inmuebles_capture_lead") return state.leadFailure ? Response.json({ code: "PT429", message: "Limited" }, { status: 429 }) : Response.json("new-lead-id");
    if (url.pathname === "/rest/v1/fortius_inmuebles_records") return Response.json([]);
    if (url.pathname === "/rest/v1/fortius_inmuebles_file_uploads" && init.method === "POST") return new Response(null, { status: 201 });
    if (url.pathname.startsWith("/storage/v1/object/sign/")) return state.fileMissing
      ? Response.json({ statusCode: "404", error: "not_found", message: "Object not found" }, { status: 400 })
      : Response.json({ signedURL: "/object/sign/fortius-inmuebles-private/signed?token=temporary" });
    if (url.pathname.startsWith("/storage/v1/object/")) return Response.json({ Key: url.pathname });
    throw new Error(`Unexpected external request: ${url.pathname}`);
  });
});

describe("HTTP API contracts", () => {
  it("no confunde un archivo inexistente o ajeno con una caída del servidor ni devuelve URL", async () => {
    await loginWithPassword({ email: user.email, password: "a long password" }); state.fileMissing = true;
    const response = await fileRoute(new Request("https://mnt.test/api/admin/files?bucket=fortius-inmuebles-private&path=own/missing.pdf"));
    expect(response.status).toBe(404);
    expect(await response.json()).not.toHaveProperty("url");
  });
  const req = (path: string, method: string, body?: unknown) => new Request(`https://mnt.test${path}`, { method, headers: { origin: "https://mnt.test", "content-type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  it("returns 401/403 from real handlers and rejects invalid collection/payload with 400", async () => {
    expect((await sessionRoute()).status).toBe(401);
    const context = { params: Promise.resolve({ collection: "notas", id: "n1" }) };
    expect((await putRoute(req("/api/admin/collections/notas/n1", "PUT", { data: {}, version: null }), context)).status).toBe(401);
    await loginWithPassword({ email: user.email, password: "a long password" });
    state.active = false;
    expect((await listRoute(req("/api/admin/collections/leads", "GET"), { params: Promise.resolve({ collection: "leads" }) })).status).toBe(403);
    state.active = true;
    expect((await listRoute(req("/api/admin/collections/staff", "GET"), { params: Promise.resolve({ collection: "staff" }) })).status).toBe(400);
    expect((await putRoute(req("/api/admin/collections/notas/n1", "PUT", { data: {} }), context)).status).toBe(400);
    const list = await listRoute(req("/api/admin/collections/leads", "GET"), { params: Promise.resolve({ collection: "leads" }) });
    expect(list.headers.get("cache-control")).toContain("private, no-store");
    expect(await list.json()).toEqual({ records: [] });
  });
  it("public lead endpoint exposes only persisted id and does not acknowledge a failed write", async () => {
    const input = { nombre: "Persona", telefono: "6641234567", origen: "contacto" };
    const saved = await leadRoute(req("/api/leads", "POST", input));
    expect(saved.status).toBe(201);
    expect(await saved.json()).toEqual({ id: "new-lead-id" });
    state.leadFailure = true;
    const failed = await leadRoute(req("/api/leads", "POST", input));
    expect(failed.status).toBe(429);
    expect(await failed.json()).not.toHaveProperty("id");
  });
  it("honeypot rejection never reaches persistence or returns a success id", async () => {
    const persist = vi.fn(async () => Response.json("must-not-persist"));
    vi.stubGlobal("fetch", persist);
    const response = await leadRoute(req("/api/leads", "POST", { nombre: "Bot", telefono: "6641234567", origen: "contacto", website: "https://bot.invalid" }));
    expect(response.status).toBe(400);
    expect(await response.json()).not.toHaveProperty("id");
    expect(persist).not.toHaveBeenCalled();
  });
  it("defaults uploads to private and returns stable paths; signing always needs staff", async () => {
    await loginWithPassword({ email: user.email, password: "a long password" });
    const form = new FormData(); form.set("file", new File(["%PDF-1.7\nhello"], "test.pdf", { type: "application/pdf" }));
    const uploaded = await uploadRoute(new Request("https://mnt.test/api/admin/files", { method: "POST", headers: { origin: "https://mnt.test" }, body: form }));
    expect(uploaded.status).toBe(201);
    const file = await uploaded.json();
    expect(file.bucket).toBe("fortius-inmuebles-private");
    expect(file.path).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+\.pdf$/);
    expect(file.url).not.toContain("token=");
    const signed = await fileRoute(new Request(`https://mnt.test${file.url}`));
    expect(signed.status).toBe(200);
    expect(await signed.json()).toMatchObject({ expiresIn: 60 });
    await logoutSession();
    expect((await fileRoute(new Request(`https://mnt.test${file.url}`))).status).toBe(401);
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("real session behavior against the external transport boundary", () => {
  it("reports authentication service failures without claiming the password is incorrect", async () => {
    state.authServiceFailure = true;
    await expect(loginWithPassword({ email: user.email, password: "a long password" })).rejects.toMatchObject({ status: 503 });
    expect(state.cookies.size).toBe(0);
  });
  it("rejects invalid credentials and never creates session cookies", async () => {
    state.validPassword = false;
    await expect(loginWithPassword({ email: user.email, password: "wrong" })).rejects.toMatchObject({ status: 401 });
    expect(state.cookies.size).toBe(0);
  });
  it("requires live membership before setting HttpOnly cookies", async () => {
    state.member = false;
    await expect(loginWithPassword({ email: user.email, password: "a long password" })).rejects.toMatchObject({ status: 403 });
    expect(state.cookies.size).toBe(0);
    state.member = true;
    expect((await loginWithPassword({ email: user.email, password: "a long password" })).user.role).toBe("admin");
    expect(state.cookies.get("fortius-inmuebles-access-token")).toMatchObject({ value: token, options: { httpOnly: true, sameSite: "lax", path: "/" } });
    state.active = false;
    await expect(requireStaff()).rejects.toMatchObject({ status: 403 });
  });
  it("refreshes a session with no access cookie and rejects an anonymous request", async () => {
    await expect(requireStaff()).rejects.toMatchObject({ status: 401 });
    state.cookies.set("fortius-inmuebles-refresh-token", { value: "test-refresh-token" });
    expect((await requireStaff()).user.id).toBe(user.id);
    expect(state.cookies.get("fortius-inmuebles-access-token")?.value).toBe(token);
  });
  it("accepts invite/recovery only, rechecks membership, and updates password with the authorized token", async () => {
    await expect(acceptAuthCallback({ type: "signup", access_token: token, refresh_token: session.refresh_token })).rejects.toThrow();
    await acceptAuthCallback({ type: "invite", access_token: token, refresh_token: session.refresh_token });
    await expect(changePassword({ password: "short" })).rejects.toThrow();
    await expect(changePassword({ password: "new strong password" })).resolves.toEqual({ ok: true });
    expect(state.password).toBe("new strong password");
  });
  it("clears both cookies on logout so the next request is unauthenticated", async () => {
    await loginWithPassword({ email: user.email, password: "a long password" });
    await logoutSession();
    expect(state.cookies.get("fortius-inmuebles-access-token")).toMatchObject({ value: "", options: { maxAge: 0 } });
    expect(state.cookies.get("fortius-inmuebles-refresh-token")).toMatchObject({ value: "", options: { maxAge: 0 } });
    await expect(requireStaff()).rejects.toMatchObject({ status: 401 });
  });
  it("recovery is non-enumerating but never claims delivery when the provider rejects", async () => {
    expect(await requestRecovery({ email: "unknown@example.com" }, "https://mnt.test/admin")).toEqual({ ok: true });
    expect(state.cookies.size).toBe(0);
    state.recoveryFailure = true;
    await expect(requestRecovery({ email: user.email }, "https://mnt.test/admin")).rejects.toMatchObject({ status: 503 });
  });
});

it("profile persists a compact private avatar reference and cannot change permissions", async () => {
  const request = (body: unknown, origin = "https://mnt.test") => new Request("https://mnt.test/api/auth/profile", {method:"PATCH", headers:{origin,"content-type":"application/json"}, body:JSON.stringify(body)});
  expect((await profileRoute(request({name:"Asesor",avatar:""}))).status).toBe(401);
  await loginWithPassword({email:user.email,password:"a long password"});
  expect((await profileRoute(request({name:"Asesor",avatar:"",role:"admin"}))).status).toBe(400);
  expect((await profileRoute(request({name:"Asesor",avatar:""},"https://other.test"))).status).toBe(403);
  const original = fetch;
  const paths: string[] = [];
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if(url.pathname.startsWith("/storage/v1/object/")) {
      paths.push(url.pathname);
      if(init?.method === "POST") return Response.json({Key:"avatar.jpg"});
      return new Response(new Uint8Array([255,216,255,224]), {headers:{"content-type":"image/jpeg"}});
    }
    return original(input, init);
  });
  const avatar = "data:image/jpeg;base64," + Buffer.from([255,216,255,224,...Array(8000).fill(0)]).toString("base64");
  expect((await profileRoute(request({name:"Asesor actualizado",avatar}))).status).toBe(200);
  expect(JSON.stringify(user.user_metadata).length).toBeLessThan(250);
  const sessionResponse = await sessionRoute();
  expect((await sessionResponse.json()).user).toMatchObject({name:"Asesor actualizado",avatar:expect.stringMatching(/^\/api\/auth\/profile\/photo/),role:"admin"});
  const photo = await photoRoute();
  expect(photo.headers.get("content-type")).toBe("image/jpeg");
  expect((await photo.arrayBuffer()).byteLength).toBe(4);
  expect(paths.every(path => path.includes("profiles/"+user.id+"/avatar.jpg"))).toBe(true);
  state.cookies.clear();
  expect((await photoRoute()).status).toBe(401);
});
