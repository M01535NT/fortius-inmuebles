import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteNav } from "@/components/home/site-nav";

vi.hoisted(() => { window.matchMedia = (query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }); });
vi.mock("next/navigation", () => ({ usePathname: () => "/contacto" }));
vi.mock("@/lib/use-reduced-motion-safe", () => ({ useReducedMotionSafe: () => true }));
const settings = { nombreComercial: "Firma actualizada", telefono: "+52 664 123 4567", whatsapp: "+52 664 765 4321", email: "publico@example.com", horario: "Lunes a viernes", facebook: "", instagram: "", videoInstitucionalUrl: "" };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("footer uses public settings and hides unconfigured contact channels", () => {
  const html = renderToStaticMarkup(<SiteFooter settings={settings} />);
  expect(html).toContain('aria-label="Fortius, inicio"');
  expect(html).toContain('href="tel:+526641234567"');
  expect(html).toContain('href="https://wa.me/526647654321?text=');
  for (const route of ["residencial", "comercial", "industrial"]) {
    expect(html).toContain(`href="/inventario?segmento=${route}"`);
  }
  const placeholders = renderToStaticMarkup(<SiteFooter settings={{ ...settings, telefono: "+52 664 000 0000", whatsapp: "https://wa.me/526640000000" }} />);
  expect(placeholders).not.toContain("WhatsApp: por confirmar");
  expect(placeholders).not.toContain("Teléfono: por confirmar");
  expect(placeholders).not.toContain('href="tel:');
  expect(placeholders).not.toContain('href="https://wa.me/');
});
test("public navigation does not expose a panel shortcut", () => {
  const { container } = render(<SiteNav />);
  expect(container.querySelector('a[href="/admin-anterior"]')).toBeNull();
});
