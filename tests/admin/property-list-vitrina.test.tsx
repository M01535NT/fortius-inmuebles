import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/admin-anterior/propiedades", useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/admin/workspace/use-person-status", () => ({ usePersonStatus: () => ({ ofClient: () => undefined, ofLead: () => undefined, ofProperty: () => undefined }) }));
const guardados = vi.hoisted(() => vi.fn(async (item: unknown, version?: number) => (void version, item)));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  const casa = { slug: "casa-chapultepec", titulo: "Casa en Chapultepec", codigo: "FORTIUS-000209", operacion: "venta", tipo: "casa", estado: "disponible", publicada: false, zona: "Chapultepec",
    precio: { modalidad: "publico", monto: 4200000, moneda: "MXN" }, galeria: [{ src: "/f.jpg", alt: "" }], ficha: { construccionM2: 180 } };
  const depa = { ...casa, slug: "depa-rio", titulo: "Departamento en Zona Río", codigo: "FORTIUS-000210", galeria: [] };
  const data = new Map<unknown, unknown[]>([[actual.db.propiedades, [casa, depa]]]);
  return { ...actual, useCollection: (col: unknown) => data.get(col) ?? [], upsertPropiedad: guardados };
});
import { PropertyList } from "@/components/admin/properties/property-list";
import { db } from "@/lib/admin/store";

/* LV-10f · Inmuebles: arriba lo que pide algo hoy; el precio se cambia en la misma fila, con su versión y con Deshacer. */
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); guardados.mockClear(); });

function servidor() {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ records: [], expedientes: [] })));
  vi.spyOn(db.propiedades, "version").mockReturnValue(7);
}

it("la vitrina dice qué pide cada inmueble y lleva a resolverlo", () => {
  servidor();
  render(<PropertyList />);
  const vitrina = within(screen.getByRole("region", { name: /Piden algo hoy/ }));
  expect(vitrina.getByText("Le falta fotos")).toBeTruthy();
  expect(vitrina.getByRole("link", { name: "Completar: Departamento en Zona Río" }).getAttribute("href")).toBe("/admin-anterior/propiedades/depa-rio/editar");
  expect(vitrina.queryByText("Casa en Chapultepec")).toBeNull();
});

it("el precio se cambia en la fila, se guarda con su versión y se puede deshacer", async () => {
  servidor();
  render(<PropertyList />);
  fireEvent.click(screen.getByRole("button", { name: /Cambiar el precio de Casa en Chapultepec/ }));
  const campo = screen.getByLabelText("Precio de Casa en Chapultepec en MXN");
  fireEvent.change(campo, { target: { value: "4,350.50" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByText("Escribe el precio en números, sin centavos.")).toBeTruthy();
  expect(guardados).not.toHaveBeenCalled();

  fireEvent.change(campo, { target: { value: "$4,350,000" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(1));
  expect(guardados.mock.calls[0][0]).toMatchObject({ slug: "casa-chapultepec", precio: { modalidad: "publico", monto: 4350000 } });
  expect(guardados.mock.calls[0][1]).toBe(7);

  expect(await screen.findByText(/Nuevo precio de «Casa en Chapultepec»/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
  await waitFor(() => expect(guardados).toHaveBeenCalledTimes(2));
  expect(guardados.mock.calls[1][0]).toMatchObject({ precio: { monto: 4200000 } });
});

it("Escape cierra la edición del precio sin guardar", () => {
  servidor();
  render(<PropertyList />);
  fireEvent.click(screen.getByRole("button", { name: /Cambiar el precio de Casa en Chapultepec/ }));
  fireEvent.keyDown(screen.getByLabelText("Precio de Casa en Chapultepec en MXN"), { key: "Escape" });
  expect(screen.queryByLabelText("Precio de Casa en Chapultepec en MXN")).toBeNull();
  expect(guardados).not.toHaveBeenCalled();
});

it("J y K se mueven entre los inmuebles y cada uno se abre en su ficha rápida", async () => {
  servidor();
  render(<PropertyList />);
  const casa = screen.getByRole("button", { name: "Abrir Casa en Chapultepec" }), depa = screen.getByRole("button", { name: "Abrir Departamento en Zona Río" });
  casa.focus();
  fireEvent.keyDown(casa, { key: "j" });
  expect(document.activeElement).toBe(depa);
  fireEvent.keyDown(depa, { key: "k" });
  expect(document.activeElement).toBe(casa);
  fireEvent.click(depa);
  const ficha = within(await screen.findByRole("dialog", { name: "Departamento en Zona Río" }));
  expect(ficha.getByRole("link", { name: "Subir fotos" }).getAttribute("href")).toBe("/admin-anterior/propiedades/depa-rio/editar");
  expect(ficha.getByRole("link", { name: "Completar: Departamento en Zona Río" })).toBeTruthy();
});
