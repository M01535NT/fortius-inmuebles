import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

// PUB-02 (RP-95, DEC-40): alta de un inmueble compartido con su inmobiliaria y su autorización escrita.
const { push, upload } = vi.hoisted(() => ({ push: vi.fn(), upload: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/admin/store", async original => ({ ...await original<typeof import("@/lib/admin/store")>(), uploadFile: upload }));
import { PropertyForm } from "@/components/admin/property-form";
import { clearAdminCache } from "@/lib/admin/store";
import { knownAllies, sharedCommissionEstimate, sharedPublicationBlockers } from "@/lib/admin/shared-property";
import type { AdminProperty } from "@/lib/domain/records";
import { propiedades } from "../fixtures/propiedades";

let writes: Array<{ data: Record<string, unknown> }>;
beforeEach(() => {
  clearAdminCache(); push.mockClear(); writes = [];
  upload.mockResolvedValue({ bucket: "fortius-inmuebles-private", path: "u-1/autorizacion.pdf", url: "", name: "carta.pdf" });
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PUT") { const body = JSON.parse(String(init.body)); writes.push(body); return Response.json({ record: { id: body.data.slug, data: body.data, version: 1, createdAt: "2026-11-12", updatedAt: "2026-11-12" } }); }
    return Response.json({ records: [] });
  }));
  window.history.pushState({}, "", "/admin/propiedades/nueva?origen=compartido");
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.pushState({}, "", "/"); });

const shared = (extra: Partial<AdminProperty> = {}) => ({ ...propiedades[0], origen: "compartido", precio: { modalidad: "publico", monto: 3000000, moneda: "MXN" },
  aliado: { inmobiliaria: "Aliada de Ensayo", contacto: "Contacto de ensayo", porcentaje: 2.5 }, ...extra }) as AdminProperty;

it("la comisión es una estimación sobre el precio publicado y las inmobiliarias se recuerdan", () => {
  expect(sharedCommissionEstimate(shared())).toEqual({ monto: 75000, moneda: "MXN" });
  expect(sharedCommissionEstimate(shared({ precio: { modalidad: "consulta" } }))).toBeNull();
  expect(sharedCommissionEstimate({ ...propiedades[0] } as AdminProperty)).toBeNull();
  expect(knownAllies([shared(), shared({ slug: "otra", aliado: { inmobiliaria: "aliada de ensayo" } }), { ...propiedades[0] } as AdminProperty]))
    .toEqual([{ inmobiliaria: "Aliada de Ensayo", contacto: "Contacto de ensayo", porcentaje: 2.5 }]);
  expect(sharedPublicationBlockers({ inmobiliaria: "Aliada de Ensayo" })).toHaveLength(3);
  expect(sharedPublicationBlockers({ inmobiliaria: "Aliada de Ensayo", autorizacion: { path: "u/a.pdf", fecha: "2026-11-12", firmante: "Gerente" } })).toEqual([]);
});

it("desde Herramientas el alta llega como compartido y guarda la inmobiliaria con su autorización", async () => {
  render(<PropertyForm />);
  expect((screen.getByLabelText("¿De quién es el inmueble?") as HTMLSelectElement).value).toBe("compartido");
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Casa compartida" } });
  fireEvent.change(screen.getByLabelText("Zona"), { target: { value: "Centro" } });
  fireEvent.change(screen.getByLabelText("Referencia (nunca dirección exacta)"), { target: { value: "Cerca del parque" } });
  fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Descripción" } });
  fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2500000" } });
  fireEvent.change(screen.getByLabelText("Inmobiliaria que lo comparte"), { target: { value: "Aliada de Ensayo" } });
  fireEvent.change(screen.getByLabelText("Comisión para Fortius (% del precio)"), { target: { value: "2.5" } });
  fireEvent.change(screen.getByLabelText("Archivo de la autorización"), { target: { files: [new File(["x"], "carta.pdf", { type: "application/pdf" })] } });
  await screen.findByText("carta.pdf");
  expect(upload).toHaveBeenCalledWith(expect.any(File), "private");
  fireEvent.change(screen.getByLabelText("Fecha de la autorización"), { target: { value: "2026-11-12" } });
  fireEvent.change(screen.getByLabelText("Quién la firmó o envió"), { target: { value: "Gerente de ensayo" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear inmueble" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0].data).toMatchObject({ origen: "compartido", publicada: false, aliado: { inmobiliaria: "Aliada de Ensayo", porcentaje: 2.5,
    autorizacion: { path: "u-1/autorizacion.pdf", nombre: "carta.pdf", fecha: "2026-11-12", firmante: "Gerente de ensayo" } } });
});

it("un inmueble propio no lleva datos de inmobiliaria", async () => {
  window.history.pushState({}, "", "/admin/propiedades/nueva");
  render(<PropertyForm />);
  expect((screen.getByLabelText("¿De quién es el inmueble?") as HTMLSelectElement).value).toBe("propio");
  expect(screen.queryByLabelText("Inmobiliaria que lo comparte")).toBeNull();
  fireEvent.change(screen.getByLabelText("¿De quién es el inmueble?"), { target: { value: "compartido" } });
  expect(screen.getByLabelText("Inmobiliaria que lo comparte")).toBeTruthy();
});
