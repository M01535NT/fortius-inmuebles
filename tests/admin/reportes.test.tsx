import * as React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ReportesPage from "@/app/admin-anterior/reportes/page";
import { clearAdminCache } from "@/lib/admin/store";

vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useSession: () => ({ id: "admin", email: "admin@example.test", role: "admin" }) };
});

afterEach(() => { cleanup(); clearAdminCache(); vi.unstubAllGlobals(); });

test("shows saved commercial counts and expediente stages", async () => {
  clearAdminCache();
  vi.stubGlobal("fetch", async (url: string) => {
    if (url === "/api/admin/expedientes") return Response.json({ expedientes: [{ id: "e1", etapa: "negociacion", asesor_id: "a1" }] });
    const key = url.split("/").pop();
    const records: Record<string, unknown[]> = {
      asesores: [{ id: "a1", nombre: "Asesor 1", cargo: "", iniciales: "A1", activo: true }],
      leads: [{ id: "l1", nombre: "Persona", telefono: "6641234567", origen: "manual", estado: "activo", asesorId: "a1", creadoEl: "2026-10-01", notas: [] }],
      clientes: [], propiedades: [], tareas: [],
    };
    return Response.json({ records: (records[key ?? ""] ?? []).map(data => ({ id: (data as {id:string}).id, data, version: 1, createdAt: "2026-10-01", updatedAt: "2026-10-01" })) });
  });
  render(<ReportesPage />);
  expect(await screen.findByRole("heading", { name: "Reportes comerciales" })).toBeTruthy();
  const stages = screen.getByRole("heading", { name: "Asuntos por etapa" }).closest("section")!;
  // LV-10 (bloque g): la gráfica lleva la cifra escrita y su lectura completa para lectores de pantalla.
  const chart = within(stages).getByText(/Asuntos abiertos por etapa/);
  expect(chart.textContent).toContain("Visitas y ofertas, 1");
  // SIM-04 (C12): el mismo nombre que en Operaciones, no el antiguo «Negociación».
  expect(within(stages).queryByText("Negociación")).toBeNull();
  expect(chart.textContent).not.toContain("Negociación");
  expect(screen.getByText(/Cuenta todos los prospectos registrados/)).toBeTruthy();
});
