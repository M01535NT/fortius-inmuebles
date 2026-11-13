import { confirmAction } from "@/components/admin/workspace/confirm";
vi.mock("@/components/admin/workspace/confirm", () => {
  const confirmAction = vi.fn().mockResolvedValue(true);
  // Las confirmaciones de borrado pasan por la misma ventana simulada.
  return { confirmAction, confirmDelete: (cosa: string, mensaje: string) => confirmAction(mensaje, { title: `Eliminar ${cosa}` }) };
});
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ContactsScreen } from "@/components/admin/contacts/contacts";
import PropiedadesPage from "@/app/admin/propiedades/page";
import { clearAdminCache, db, type Lead } from "@/lib/admin/store";
import { propiedades } from "../fixtures/propiedades";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/admin/contactos" }));

const lead: Lead = {
  id: "lead-movil",
  nombre: "Cliente con nombre y apellidos extensos para revisar la lista desde el teléfono",
  telefono: "664 123 4567",
  estado: "nuevo",
  origen: "manual",
  asesorId: "asesor-01",
  creadoEl: "2026-09-22T18:00:00.000Z",
  notas: [],
};
const property = {
  ...propiedades[0],
  titulo: "Residencia con un título extenso que debe conservarse completo dentro de su tarjeta móvil",
  destacada: false,
  publicada: true,
};
let rejectWrites = false;
let writes: { url: string; method: string; version: number | null }[] = [];

beforeEach(() => {
  clearAdminCache();
  push.mockReset();
  writes = [];
  rejectWrites = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT" || init?.method === "DELETE") {
      const body = JSON.parse(String(init.body));
      writes.push({ url, method: init.method, version: body.version });
      if (rejectWrites) return Response.json({ error: "No se guardó" }, { status: 503 });
      if (init.method === "DELETE") return Response.json({ ok: true });
      return Response.json({ record: {
        id: body.data.id ?? body.data.slug, data: body.data,
        version: (body.version ?? 0) + 1,
        createdAt: "2026-09-22", updatedAt: "2026-09-22",
      } });
    }
    const data = url.endsWith("/leads") ? [lead] : url.endsWith("/propiedades") ? [property] : [
      { id: "asesor-01", nombre: "Asesora de prueba", cargo: "Asesora", iniciales: "AP", activo: true },
    ];
    return Response.json({ records: data.map((item) => ({
      id: "id" in item ? item.id : item.slug, data: item, version: 7,
      createdAt: "2026-09-22", updatedAt: "2026-09-22",
    })) });
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});




test("mobile contact rows show what the person wants and the next step; search and status filter work", async () => {
  render(<ContactsScreen />);
  const list = await screen.findByRole("list", { name: "Contactos" });
  const link = within(list).getByRole("link", { name: new RegExp(lead.nombre) });
  expect(link.getAttribute("href")).toBe(`/admin/leads/${lead.id}`);
  // C40: hueco vacío en lugar de relleno.
  for (const filler of ["Por preguntar", "Zona por definir", "Sin siguiente paso", "Sin fecha"]) expect(link.textContent).not.toContain(filler);
  fireEvent.change(screen.getAllByRole("searchbox", { name: "Buscar nombre o teléfono" })[0], { target: { value: "sin coincidencia" } });
  expect(screen.getByText("Nadie coincide con la búsqueda")).toBeTruthy();
  fireEvent.change(screen.getAllByRole("searchbox", { name: "Buscar nombre o teléfono" })[0], { target: { value: "123 45" } });
  expect(within(screen.getByRole("list", { name: "Contactos" })).getByRole("link", { name: new RegExp(lead.nombre) })).toBeTruthy();
  fireEvent.click(within(screen.getByRole("group", { name: "Mostrar personas" })).getByRole("button", { name: /^En seguimiento/ }));
  expect(screen.getByText("Nadie coincide con la búsqueda")).toBeTruthy();
  expect(writes).toHaveLength(0);
});

test("mobile property rows expose full details and preserve versioned changes and errors", async () => {
  render(<PropiedadesPage />);
  const list = await screen.findByRole("list", { name: "Inmuebles" });
  fireEvent.click(within(list).getByLabelText(`Opciones de ${property.titulo}`));
  expect(within(list).getByRole("link", { name: new RegExp(`^Venta.*${property.titulo}`) }).getAttribute("href")).toBe(`/admin/propiedades/${property.slug}/editar`);
  expect(within(list).getAllByText("Publicado").length).toBeGreaterThan(0);
  expect(within(list).getByText(/12,850,000 MXN/)).toBeTruthy();
  expect(within(list).getByText("Asesora de prueba")).toBeTruthy();
  fireEvent.change(within(list).getByRole("combobox", { name: `Estado de ${property.titulo}` }), { target: { value: "apartada" } });
  await waitFor(() => expect(db.propiedades.list()[0].estado).toBe("apartada"));
  expect(writes[0].version).toBe(7);
  rejectWrites = true;
  fireEvent.click(within(list).getByRole("button", { name: /Marcar destacada/ }));
  expect((await within(list).findByRole("alert")).textContent).toContain("No se guardó");
  expect(db.propiedades.list()[0].destacada).toBe(false);
  rejectWrites = false;
  fireEvent.click(within(list).getByRole("button", { name: /Marcar destacada/ }));
  await waitFor(() => expect(db.propiedades.list()[0].destacada).toBe(true));
  expect(writes.at(-1)?.version).toBe(8);
});

test("mobile property deletion requires confirmation and retains the row when the server fails", async () => {
  render(<PropiedadesPage />);
  const list = await screen.findByRole("list", { name: "Inmuebles" });
  const confirm = vi.mocked(confirmAction).mockResolvedValue(false);
  const remove = within(list).getByRole("button", { name: `Eliminar ${property.titulo}` });
  fireEvent.click(remove);
  await waitFor(() => expect(remove.getAttribute("aria-busy")).toBe("false"));
  expect(writes).toHaveLength(0);
  confirm.mockResolvedValue(true);
  rejectWrites = true;
  fireEvent.click(remove);
  await within(list).findByRole("alert");
  expect(db.propiedades.list()).toHaveLength(1);
  rejectWrites = false;
  fireEvent.click(remove);
  await screen.findByText("Todavía no hay inmuebles");
  expect(writes.at(-1)).toEqual({ url: `/api/admin/collections/propiedades/${property.slug}`, method: "DELETE", version: 7 });
});

test("SIM-17: «Agregar contacto» abre el asistente único y no hay captura aparte", async () => {
  render(<ContactsScreen />);
  for (const link of screen.getAllByRole("link", { name: "Agregar contacto" })) expect(link.getAttribute("href")).toBe("/admin/operaciones/nueva");
  expect(screen.queryByRole("button", { name: "Busca comprar o rentar" })).toBeNull();
  expect(screen.queryByRole("textbox", { name: "Nombre" })).toBeNull();
  await screen.findByRole("list", { name: "Contactos" });
});

test("C59: en el celular los inmuebles van en filas y «Ver en tarjetas» cambia la vista", async () => {
  render(<PropiedadesPage />);
  const list = await screen.findByRole("list", { name: "Inmuebles" });
  expect(list.getAttribute("data-view")).toBe("filas");
  fireEvent.click(screen.getByRole("button", { name: "Ver en tarjetas" }));
  expect(list.getAttribute("data-view")).toBe("tarjetas");
  fireEvent.click(screen.getByRole("button", { name: "Ver en filas" }));
  expect(list.getAttribute("data-view")).toBe("filas");
});
