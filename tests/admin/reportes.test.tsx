import * as React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ReportesPage from "@/app/admin/reportes/page";
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
  const stages = screen.getByRole("heading", { name: "Etapas de operación" }).closest("section")!;
  expect(within(stages).getByText("Negociación")).toBeTruthy();
  expect(within(stages).getByText("1")).toBeTruthy();
  expect(screen.getByText(/Conversión histórica = prospectos convertidos/)).toBeTruthy();
});
