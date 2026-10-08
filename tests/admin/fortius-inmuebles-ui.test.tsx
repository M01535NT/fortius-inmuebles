import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

import ContactoPage from "@/app/contacto/page";
import InventarioPage from "@/app/inventario/page";
import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { ClosingCostsCalculator } from "@/components/tools/closing-costs-calculator";
import { InventoryExplorer } from "@/components/property/inventory-explorer";
import { MortgageCalculator } from "@/components/property/mortgage-calculator";
import { PropertyInterestForm } from "@/components/property/property-interest-form";
import { PropertyMobileCta } from "@/components/property/property-mobile-cta";
import type { Property } from "@/data/propiedades";

vi.mock("@/components/magicui/number-ticker", () => ({
  NumberTicker: ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => (
    <span>{prefix}{Math.round(value)}{suffix}</span>
  ),
}));
vi.mock("@/components/magicui/blur-fade", () => ({ BlurFade: ({ children }: React.PropsWithChildren) => children }));
vi.mock("@/components/property/property-card", () => ({ PropertyCard: ({ property }: { property: Property }) => <article>{property.titulo}</article> }));
vi.mock("@/lib/inventario", () => ({ getPropiedades: async () => [] }));
vi.mock("@/lib/gsap", () => ({
  EASE_OUT: "none",
  prefersReducedMotion: () => true,
  useGSAP: () => {},
  gsap: { timeline: () => ({ set() { return this; }, to() { return this; }, from() { return this; } }) },
}));

afterEach(() => {
  cleanup();
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
  expect(screen.getByText(/Comisión de intermediación \(pendiente%\)/)).toBeTruthy();
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

test("inventory price operations use one selected currency and persist it in the URL", async () => {
  window.history.replaceState(null, "", "/inventario");
  render(<InventoryExplorer propiedades={properties} />);
  fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "precio-asc" } });
  await waitFor(() => expect(window.location.search).toContain("moneda=MXN"));
  expect(screen.getByText("Casa MXN")).toBeTruthy();
  expect(screen.queryByText("Casa USD")).toBeNull();
  fireEvent.change(screen.getByLabelText("Moneda"), { target: { value: "USD" } });
  await waitFor(() => expect(window.location.search).toContain("moneda=USD"));
  expect(screen.getByText("Casa USD")).toBeTruthy();
  expect(screen.queryByText("Casa MXN")).toBeNull();
});

test("legacy price URLs default to MXN and explicit all currency remains available", async () => {
  window.history.replaceState(null, "", "/inventario?min=100000");
  render(<InventoryExplorer propiedades={properties} />);
  await waitFor(() => expect((screen.getByLabelText("Moneda") as HTMLSelectElement).value).toBe("MXN"));
  fireEvent.change(screen.getByLabelText("Moneda"), { target: { value: "todas" } });
  fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "recientes" } });
  expect(screen.getByText("Casa MXN")).toBeTruthy();
  expect(screen.getByText("Casa USD")).toBeTruthy();
});

test("visit CTA targets the current property form and records visit intent", async () => {
  window.history.replaceState(null, "", "/inventario/casa-prueba?intencion=visita#interes");
  const cta = renderToStaticMarkup(<PropertyMobileCta />);
  expect(cta).toContain('href="#interes"');
  expect(cta).toContain("Consultar este inmueble");
  expect(cta).not.toContain("Agendar visita");
  render(<PropertyInterestForm slug="casa-prueba" codigo="C-1" titulo="Casa prueba" />);
  expect(await screen.findByDisplayValue("visita")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Solicitar visita" })).toBeTruthy();
});

test("inventory and contact routes expose one page H1", async () => {
  const inventory = renderToStaticMarkup(await InventarioPage());
  const contact = renderToStaticMarkup(<ContactoPage />);
  expect((inventory.match(/<h1/g) ?? [])).toHaveLength(1);
  expect((contact.match(/<h1/g) ?? [])).toHaveLength(1);
});

test("fullscreen menu traps Tab, closes with Escape and restores prior focus", async () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const onClose = vi.fn();
  const view = render(<FullscreenMenu open onClose={onClose} />);
  const close = screen.getByRole("button", { name: "Cerrar menú" });
  const links = screen.getAllByRole("link");
  await waitFor(() => expect(document.activeElement).toBe(close));
  links.at(-1)!.focus();
  fireEvent.keyDown(window, { key: "Tab" });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledOnce();
  view.rerender(<FullscreenMenu open={false} onClose={onClose} />);
  expect(document.activeElement).toBe(trigger);
  trigger.remove();
});
