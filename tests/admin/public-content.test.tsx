import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Hero } from "@/components/home/hero";
import { Relato } from "@/components/home/relato";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteNav } from "@/components/home/site-nav";
import { ContactForm } from "@/components/sections/contact-form";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";

vi.hoisted(() => { window.matchMedia = (query: string) => ({ matches: false, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }); });
vi.mock("next/navigation", () => ({ usePathname: () => "/contacto" }));
vi.mock("@/lib/use-reduced-motion-safe", () => ({ useReducedMotionSafe: () => true }));
const content = { heroTitulo: "Título del panel\nSegunda línea", heroSubtitulo: "Subtítulo publicado", manifiestoTitulo: "Proceso actualizado.\nCon seguimiento.", manifiestoTexto: "Texto actualizado", seoTitle: "SEO", seoDescription: "Descripción" };
const settings = { nombreComercial: "Firma actualizada", telefono: "+52 664 123 4567", whatsapp: "+52 664 765 4321", email: "publico@example.com", horario: "Lunes a viernes", facebook: "", instagram: "", videoInstitucionalUrl: "" };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("the existing hero and manifesto render panel copy without replacing their structure", () => {
  const hero = renderToStaticMarkup(<Hero content={content} />);
  const relato = renderToStaticMarkup(<Relato content={content} />);
  expect(hero).toContain("Título del panel");
  expect(hero).toContain("Subtítulo publicado");
  expect(relato).toContain("Proceso actualizado.");
  expect(relato).toContain("Texto actualizado");
});
test("legacy defaults receive the regional copy and keep intentional manifesto line breaks", () => {
  const original = {
    ...content,
    heroTitulo: "Vende tu propiedad\nen Tijuana.",
    heroSubtitulo: "Proponemos el precio de venta, revisamos los documentos y coordinamos la publicación y las visitas. Analizamos contigo las ofertas.",
    manifiestoTitulo: "No prometemos resultados. Documentamos el proceso.",
  };
  const hero = renderToStaticMarkup(<Hero content={original} />);
  const relato = renderToStaticMarkup(<Relato content={original} />);
  expect(hero).toContain('Inmobiliaria para');
  expect(hero).toContain('En Fortius te ayudamos a comparar propiedades');
  expect(relato).toMatch(/<span class="[^"]*\bblock\b[^"]*">el precio de venta\.<\/span>/);
});
test("footer uses public settings and hides unconfigured contact channels", () => {
  const html = renderToStaticMarkup(<SiteFooter settings={settings} />);
  expect(html).toContain('aria-label="Fortius Inmuebles"');
  expect(html).toContain('href="tel:+526641234567"');
  expect(html).toContain('href="https://wa.me/526647654321"');
  for (const route of ["residencial", "comercial", "industrial"]) {
    expect(html).toContain(`href="/${route}"`);
  }
  const placeholders = renderToStaticMarkup(<SiteFooter settings={{ ...settings, telefono: "+52 664 000 0000", whatsapp: "https://wa.me/526640000000" }} />);
  expect(placeholders).not.toContain("WhatsApp: por confirmar");
  expect(placeholders).not.toContain("Teléfono: por confirmar");
  expect(placeholders).not.toContain('href="tel:');
  expect(placeholders).not.toContain('href="https://wa.me/');
});
test("public navigation does not expose a panel shortcut", () => {
  const { container } = render(<SiteNav settings={settings} />);
  expect(container.querySelector('a[href="/admin"]')).toBeNull();
});
test("contact form retains input on rejected remote write and confirms acknowledged persistence", async () => {
  let persisted = false;
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "No se guardó" }, { status: 503 })));
  render(<PublicFeaturesProvider publicLeadsEnabled><ContactForm /></PublicFeaturesProvider>);
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Nombre público" } });
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: "6641234567" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
  await screen.findByRole("alert");
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Nombre público");
  expect(persisted).toBe(false);
  vi.mocked(fetch).mockImplementation(async () => { persisted = true; return Response.json({ id: "acknowledged" }); });
  fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
  await screen.findByText(/Recibimos/);
  expect(persisted).toBe(true);
});
