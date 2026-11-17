import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import ContactoPage from "@/app/contacto/page";
import InventarioPage from "@/app/inventario/page";
import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyInterestForm } from "@/components/property/property-interest-form";
import type { Property } from "@/data/propiedades";
import { aplicarFiltros, filtrosDesdeParams, paramsDesdeFiltros } from "@/lib/inventario-busqueda";

vi.mock("@/lib/inventario", () => ({ getPropiedades: async () => [] }));
vi.mock("@/lib/gsap", () => ({
  EASE_OUT: "none",
  prefersReducedMotion: () => true,
  useGSAP: () => {},
  gsap: { timeline: () => ({ set() { return this; }, to() { return this; }, from() { return this; } }) },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

test("closing costs keeps zero commission and identifies a missing commission", () => {
  render(<ClosingCostsCalculator />);
  fireEvent.click(screen.getByRole("button", { name: "Voy a vender" }));
  const commission = screen.getByLabelText("Comisión pactada (%)") as HTMLInputElement;
  fireEvent.change(commission, { target: { value: "0" } });
  expect(commission.value).toBe("0");
  expect(screen.getByText(/Comisión de intermediación \(0%\)/)).toBeTruthy();
  fireEvent.change(commission, { target: { value: "" } });
  expect(commission.value).toBe("");
  expect(screen.getByText(/Comisión de intermediación \(porcentaje pendiente\)/)).toBeTruthy();
  expect(screen.getByText("Falta incorporar")).toBeTruthy();
  expect(screen.queryByText("Total estimado")).toBeNull();
});

test("mortgage keeps editable drafts and only calculates within the documented ranges", () => {
  render(<MortgageCalculator precio={3_000_000} moneda="MXN" precioEditable />);
  const price = screen.getByLabelText("Precio de la propiedad (MXN)") as HTMLInputElement;
  fireEvent.change(price, { target: { value: "" } });
  expect(price.value).toBe("");
  expect(screen.getByRole("alert").textContent).toMatch(/100,000/);
  expect(screen.queryByText("Mensualidad")).toBeNull();
  fireEvent.change(price, { target: { value: "250000" } });
  const rate = screen.getByLabelText("Tasa %") as HTMLInputElement;
  fireEvent.change(rate, { target: { value: "26" } });
  expect(rate.value).toBe("26");
  expect(screen.getByRole("alert").textContent).toMatch(/25%/);
  expect(screen.queryByText("Mensualidad")).toBeNull();
});

test("calculators reject prices above the backend numeric cap", () => {
  const view = render(<MortgageCalculator precio={3_000_000} moneda="MXN" precioEditable />);
  fireEvent.change(screen.getByLabelText(/Precio de la propiedad/), { target: { value: "1e308" } });
  expect(screen.getByRole("alert").textContent).toMatch(/10,000,000,000 MXN/);
  expect(screen.queryByText("Mensualidad")).toBeNull();

  view.unmount();
  render(<ClosingCostsCalculator />);
  fireEvent.change(screen.getByLabelText(/Precio de compra/), { target: { value: "1e308" } });
  expect(screen.getByRole("alert").textContent).toMatch(/10,000,000,000 MXN/);
  expect(screen.queryByText("Total estimado")).toBeNull();
});

const base: Omit<Property, "slug" | "titulo" | "precio" | "publicadaEl"> = {
  codigo: "T", tipo: "casa", operacion: "venta", zona: "Centro", direccionAproximada: "Centro",
  descripcion: [], ficha: {}, amenidades: [], galeria: [], asesorId: "a", creditoDisponible: true,
  puntosDeInteres: [], destacada: false, estado: "disponible", demo: false,
};
const properties: Property[] = [
  { ...base, slug: "mxn", titulo: "Casa MXN", precio: { modalidad: "publico", monto: 2_000_000, moneda: "MXN" }, publicadaEl: "2026-01-01" },
  { ...base, slug: "usd", titulo: "Casa USD", precio: { modalidad: "publico", monto: 300_000, moneda: "USD" }, publicadaEl: "2026-02-01" },
];

test("inventory price filters use one selected currency and keep it in the URL", () => {
  const usd = filtrosDesdeParams(new URLSearchParams("moneda=USD&orden=precio-asc"));
  expect(aplicarFiltros(properties, usd).map((p) => p.titulo)).toEqual(["Casa USD"]);
  expect(paramsDesdeFiltros(usd)).toContain("moneda=USD");
  const mxn = filtrosDesdeParams(new URLSearchParams("moneda=MXN"));
  expect(aplicarFiltros(properties, mxn).map((p) => p.titulo)).toEqual(["Casa MXN"]);
});

test("legacy price URLs default to MXN and explicit all currency remains available", () => {
  expect(filtrosDesdeParams(new URLSearchParams("min=100000")).moneda).toBe("MXN");
  const todas = filtrosDesdeParams(new URLSearchParams("moneda=todas"));
  expect(todas.moneda).toBe("todas");
  expect(aplicarFiltros(properties, todas).map((p) => p.titulo).sort()).toEqual(["Casa MXN", "Casa USD"]);
});

test("visit intent from the URL preselects «visita» in the property form", async () => {
  window.history.replaceState(null, "", "/inventario/casa-prueba?intencion=visita#interes");
  render(<PropertyInterestForm slug="casa-prueba" codigo="C-1" titulo="Casa prueba" />);
  expect(await screen.findByDisplayValue("visita")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Solicitar visita" })).toBeTruthy();
});

test("inventory and contact routes expose one page H1", async () => {
  const inventory = renderToStaticMarkup(await InventarioPage({ searchParams: Promise.resolve({}) }));
  const contact = renderToStaticMarkup(<ContactoPage />);
  expect((inventory.match(/<h1/g) ?? [])).toHaveLength(1);
  expect((contact.match(/<h1/g) ?? [])).toHaveLength(1);
});

test("side menu preserves all configured contact channels", () => {
  render(<PublicFeaturesProvider publicLeadsEnabled={false} settings={{
    nombreComercial: "Fortius", telefono: "", whatsapp: "+52 664 123 4567",
    email: "contacto@example.com", horario: "", facebook: "https://m.me/fortius.fixture",
    instagram: "", videoInstitucionalUrl: "",
  }}><FullscreenMenu open onClose={() => {}} /></PublicFeaturesProvider>);
  // Boceto 2: each channel reads as its visible text in the «Hablemos» column.
  expect(screen.getByRole("link", { name: /^WhatsApp/ }).getAttribute("href")).toMatch(/^https:\/\/wa.me\/526641234567/);
  expect(screen.getByRole("link", { name: "Messenger" }).getAttribute("href")).toBe("https://m.me/fortius.fixture");
  expect(screen.getByRole("link", { name: "contacto@example.com" }).getAttribute("href")).toMatch(/^mailto:contacto@example.com/);
});

test("fullscreen menu traps Tab, closes with Escape and restores prior focus", async () => {
  // JSDOM has no layout: model rendered rectangles for this focus test only.
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (this: HTMLElement) {
    return (this.hidden ? [] : [{ width: 1, height: 1 }]) as unknown as DOMRectList;
  });
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const onClose = vi.fn();
  const view = render(<FullscreenMenu open onClose={onClose} />);
  const close = screen.getByRole("button", { name: "Cerrar menú" });
  // The theme switch closes the «Hablemos» column, so the last stop may be a button.
  const last = [...screen.getByRole("dialog").querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].at(-1)!;
  await waitFor(() => expect(document.activeElement).toBe(close));
  last.focus();
  fireEvent.keyDown(window, { key: "Tab" });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledOnce();
  view.rerender(<FullscreenMenu open={false} onClose={onClose} />);
  expect(document.activeElement).toBe(trigger);
  trigger.remove();
});
