import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

import RootLayout, { generateMetadata } from "@/app/layout";
import { GET as health } from "@/app/api/health/route";
import { POST as publicLead } from "@/app/api/public/leads/route";
import { PublicLeadForm } from "@/components/forms/public-lead-form";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { proxy } from "@/proxy";

const { requestHeaders, rpc } = vi.hoisted(() => ({ requestHeaders: new Headers(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/font/google", () => ({ Archivo: () => ({ variable: "archivo" }), IBM_Plex_Mono: () => ({ variable: "plex" }) }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin", useRouter: () => ({ push() {} }) }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), connection: async () => {} }));
vi.mock("@/lib/backend/auth", () => ({ createServerClient: () => ({ rpc }) }));
vi.mock("@/components/home/site-nav", () => ({ SiteNav: () => <nav>public nav</nav> }));
vi.mock("@/components/home/site-footer", () => ({ SiteFooter: () => <footer>public footer</footer> }));
vi.mock("@/components/home/public-experience", () => ({ PublicExperience: ({ children }: React.PropsWithChildren) => children }));

afterEach(() => {
  cleanup();
  requestHeaders.delete("x-fortius-inmuebles-pathname");
  requestHeaders.delete("x-nonce");
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  rpc.mockReset();
});

test("proxy overwrites spoofed path headers, emits a fresh nonce CSP and hardening headers", () => {
  const request = new NextRequest("https://mnt.test/admin", { headers: { "x-fortius-inmuebles-pathname": "/spoofed", "x-nonce": "spoofed" } });
  const response = proxy(request);
  const csp = response.headers.get("content-security-policy") ?? "";
  expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(csp).not.toContain("spoofed");
  expect(response.headers.get("x-middleware-request-x-fortius-inmuebles-pathname")).toBe("/admin");
  expect(response.headers.get("x-frame-options")).toBe("DENY");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
});

test("admin root layout and metadata never query the public backend", async () => {
  requestHeaders.set("x-fortius-inmuebles-pathname", "/admin/inmuebles");
  requestHeaders.set("x-nonce", "nonce-test");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("public backend must not run"); }));
  const html = renderToStaticMarkup(await RootLayout({ children: <main>Admin</main> }));
  expect(fetch).not.toHaveBeenCalled();
  expect(html).toContain("Admin");
  expect(html).not.toContain("public nav");
  expect(html).toContain('nonce="nonce-test"');
  await generateMetadata();
  expect(fetch).not.toHaveBeenCalled();
});

test("public shell degrades on backend failure without swallowing inventory failures", async () => {
  requestHeaders.set("x-fortius-inmuebles-pathname", "/contacto");
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("secret backend detail"); }));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const html = renderToStaticMarkup(await RootLayout({ children: <main>Contacto</main> }));
  expect(html).toContain("public nav");
  expect(log).toHaveBeenCalledWith("[public-shell] Configuración pública no disponible.");
  expect(JSON.stringify(log.mock.calls)).not.toContain("secret backend detail");
  log.mockRestore();
  const { getPublicProperties } = await import("@/lib/backend/public");
  await expect(getPublicProperties()).rejects.toThrow();
});

test("public lead forms are disabled by default in SSR and hydration with a clear message", () => {
  const submit = vi.fn();
  const html = renderToStaticMarkup(<PublicLeadForm onSubmit={submit}><button>Enviar</button></PublicLeadForm>);
  expect(html).toContain("Recepción de solicitudes no disponible");
  render(<PublicLeadForm onSubmit={submit}><button>Enviar</button></PublicLeadForm>);
  expect(screen.getByRole("button", { name: "Enviar" }).matches(":disabled")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
  expect(submit).not.toHaveBeenCalled();
});

test("enabled provider hydrates the form and points native fallback at the gated endpoint", () => {
  render(<PublicFeaturesProvider publicLeadsEnabled><PublicLeadForm><button>Enviar</button></PublicLeadForm></PublicFeaturesProvider>);
  expect(screen.getByRole("button", { name: "Enviar" }).matches(":disabled")).toBe(false);
  expect(screen.getByRole("button", { name: "Enviar" }).closest("form")?.action).toContain("/api/public/leads");
});

test("public lead endpoint is disabled unless explicitly enabled", async () => {
  vi.stubEnv("FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED", "false");
  const request = new Request("https://mnt.test/api/public/leads", { method: "POST", headers: { origin: "https://mnt.test", "content-type": "application/json" }, body: "{}" });
  const response = await publicLead(request);
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "La recepción de solicitudes no está disponible en este momento." });
  expect(rpc).not.toHaveBeenCalled();
});

test("public lead endpoint writes only when explicitly enabled", async () => {
  vi.stubEnv("FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED", "true");
  rpc.mockResolvedValueOnce({ data: "lead-id", error: null });
  const response = await publicLead(new Request("https://mnt.test/api/public/leads", {
    method: "POST",
    headers: { origin: "https://mnt.test", "content-type": "application/json" },
    body: JSON.stringify({ website: "", nombre: "Persona", telefono: "6641234567", origen: "contacto" }),
  }));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ id: "lead-id" });
  expect(rpc).toHaveBeenCalledWith("fortius_inmuebles_capture_lead", expect.objectContaining({ p_data: expect.objectContaining({ nombre: "Persona" }) }));
});

test("health returns only generic database availability", async () => {
  rpc.mockResolvedValueOnce({ data: [], error: null });
  let response = await health();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  rpc.mockResolvedValueOnce({ data: null, error: { message: "secret db detail" } });
  response = await health();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable" });
});
