import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ContactsScreen } from "@/components/admin/contacts/contacts";
import { clearAdminCache, db, type Lead } from "@/lib/admin/store";
import { LeadProfileEditor } from "@/components/admin/lead-profile-editor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/admin/contactos" }));
let writes: Record<string, unknown>[] = [];
beforeEach(() => {
  clearAdminCache(); writes = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)); writes.push(body);
      return Response.json({ record: { id: body.data.id, data: body.data, version: 1, createdAt: "2026-09-23", updatedAt: "2026-09-23" } });
    }
    return Response.json({ records: [] });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearAdminCache(); });
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } });
function openCapture() {
  render(<ContactsScreen />);
  fireEvent.click(screen.getAllByRole("button", { name: "Agregar contacto" })[0]);
  change("Nombre", "Persona de prueba"); change("Teléfono", "6641234567");
}
test("manual lead stores email and a structured search independently of a property", async () => {
  openCapture();
  change("Correo electrónico", "prueba@example.invalid");
  change("Operación", "comprar"); change("Uso del inmueble", "industrial");
  change("Tipo de inmueble", "terreno"); change("Zonas de interés", "Otay");
  change("Presupuesto mínimo", "100000"); change("Presupuesto máximo", "250000"); change("Moneda", "USD");
  change("Forma de pago", "mixto"); change("Origen de ingresos", "estados-unidos");
  change("Tipo de crédito", "bancario"); change("Estado del crédito", "en-tramite");
  fireEvent.click(screen.getByRole("button", { name: "Guardar prospecto" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ version: null, data: { email: "prueba@example.invalid", zona: "Otay", tipoPropiedad: "terreno", perfil: { operacion: "comprar", uso: "industrial", presupuestoMin: 100000, presupuestoMax: 250000, moneda: "USD", formaPago: "mixto", origenIngresos: "estados-unidos", tipoCredito: "bancario", estadoCredito: "en-tramite" } } });
});
test("invalid budget prevents a write and preserves the draft", async () => {
  openCapture(); change("Presupuesto mínimo", "500"); change("Presupuesto máximo", "100"); change("Moneda", "MXN");
  fireEvent.click(screen.getByRole("button", { name: "Guardar prospecto" }));
  expect((await screen.findByRole("alert")).textContent).toMatch(/mínimo|máximo/i);
  expect(writes).toHaveLength(0);
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Persona de prueba");
});

test("operation changes the capture fields and saves an owner's asking price", async () => {
  openCapture();
  change("Operación", "vender");
  expect(screen.queryByLabelText("Presupuesto máximo")).toBeNull();
  expect(screen.queryByLabelText("Forma de pago")).toBeNull();
  expect(screen.getByLabelText("Precio de venta esperado")).toBeTruthy();
  change("Tipo de inmueble", "casa");
  change("Ubicación del inmueble", "Hipódromo");
  change("Superficie construida (m²)", "180");
  change("Precio de venta esperado", "3500000");
  change("Moneda", "MXN");
  fireEvent.click(screen.getByRole("button", { name: "Guardar prospecto" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ data: { zona: "Hipódromo", perfil: { operacion: "vender", superficieConstruccion: 180, precioObjetivo: 3500000, moneda: "MXN" } } });
});

test("renting asks for monthly budget without purchase credit fields", () => {
  openCapture();
  change("Operación", "rentar");
  expect(screen.getByLabelText("Renta mensual máxima")).toBeTruthy();
  expect(screen.getByLabelText("Origen de ingresos")).toBeTruthy();
  expect(screen.queryByLabelText("Tipo de crédito")).toBeNull();
  change("Operación", "arrendar");
  expect(screen.getByLabelText("Renta mensual esperada")).toBeTruthy();
  expect(screen.queryByLabelText("Origen de ingresos")).toBeNull();
});

test("switching from purchase to sale removes incompatible answers on save", async () => {
  openCapture();
  change("Operación", "comprar");
  change("Presupuesto máximo", "2000000");
  change("Moneda", "MXN");
  change("Forma de pago", "credito");
  change("Tipo de crédito", "bancario");
  change("Operación", "vender");
  change("Precio de venta esperado", "2500000");
  change("Moneda", "MXN");
  fireEvent.click(screen.getByRole("button", { name: "Guardar prospecto" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ data: { perfil: { operacion: "vender", precioObjetivo: 2500000 } } });
  expect((writes[0].data as Lead).perfil).not.toHaveProperty("presupuestoMax");
  expect((writes[0].data as Lead).perfil).not.toHaveProperty("tipoCredito");
});

test("editing contact details preserves hidden legacy qualification when intent is unchanged", async () => {
  const existing: Lead = { id: "legacy", nombre: "Anterior", telefono: "6641234567", origen: "manual", estado: "nuevo", creadoEl: "2026-09-22", notas: [], perfil: { operacion: "vender", presupuestoMax: 2500000, moneda: "MXN" } };
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)); writes.push(body);
      return Response.json({ record: { id: body.data.id, data: body.data, version: 2, createdAt: "2026-09-22", updatedAt: "2026-09-23" } });
    }
    return Response.json({ records: url.endsWith("/leads") ? [{ id: existing.id, data: existing, version: 1, createdAt: "2026-09-22", updatedAt: "2026-09-22" }] : [] });
  }));
  await db.leads.load();
  render(<LeadProfileEditor lead={db.leads.list()[0]} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar ficha" }));
  change("Nombre", "Actualizado");
  fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ data: { nombre: "Actualizado", perfil: { presupuestoMax: 2500000 } } });
});

test("editing keeps unknown fields, original history and version; failed save retains edits", async () => {
  const existing: Lead = { id: "lead-existing", nombre: "Original", telefono: "6641234567", email: "old@example.invalid", origen: "contacto", estado: "contactado", creadoEl: "2026-09-22", notas: [{ id: "n1", texto: "No perder", fecha: "2026-09-22" }], perfil: { origenIngresos: "estados-unidos", futureField: "keep" } };
  let reject = true;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body)); writes.push(body);
      if (reject) return Response.json({ error: "Conflicto: recarga antes de guardar" }, { status: 409 });
      return Response.json({ record: { id: body.data.id, data: body.data, version: 8, createdAt: "2026-09-22", updatedAt: "2026-09-23" } });
    }
    return Response.json({ records: url.endsWith("/leads") ? [{ id: existing.id, data: existing, version: 7, createdAt: "2026-09-22", updatedAt: "2026-09-22" }] : [] });
  }));
  await db.leads.load();
  render(<LeadProfileEditor lead={db.leads.list()[0]} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar ficha" }));
  change("Correo electrónico", "nuevo@example.invalid");
  change("Presupuesto máximo", "0"); change("Moneda", "USD"); change("Operación", "rentar");
  fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Conflicto");
  expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).value).toBe("nuevo@example.invalid");
  expect(writes[0]).toMatchObject({ version: 7, data: { id: existing.id, origen: "contacto", notas: existing.notas, perfil: { presupuestoMax: 0, futureField: "keep", origenIngresos: "estados-unidos" } } });
  reject = false;
  fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Guardar ficha" })).toBeNull());
  expect(db.leads.list()[0].email).toBe("nuevo@example.invalid");
});
