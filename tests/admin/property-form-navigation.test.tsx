import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { PropertyForm } from "@/components/admin/property-form";
import { clearAdminCache } from "@/lib/admin/store";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let writes: Array<{ data: Record<string, unknown>; version: number | null }>;
let completeSave: (() => void) | undefined;
let delaySave: boolean;
let failSave: boolean;

beforeEach(() => {
  clearAdminCache();
  push.mockClear();
  writes = [];
  delaySave = false;
  failSave = false;
  completeSave = undefined;
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      writes.push(body);
      if (delaySave) await new Promise<void>((resolve) => { completeSave = resolve; });
      if (failSave) return Response.json({ error: "No se guardó" }, { status: 503 });
      return Response.json({ record: {
        id: body.data.slug, data: body.data, version: 1,
        createdAt: "2026-09-22", updatedAt: "2026-09-22",
      } });
    }
    return Response.json({ records: [] });
  }));
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
});

test("new property publication date uses Tijuana's day when UTC is already tomorrow", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-09-23T05:40:00Z"));
  render(<PropertyForm />);
  expect((screen.getByLabelText("Fecha de publicación") as HTMLInputElement).value).toBe("2026-09-22");
});

function chooseSection(name: string) {
  const select = screen.getByRole("combobox", { name: "Ir a sección" });
  const option = screen.getByRole("option", { name }) as HTMLOptionElement;
  fireEvent.change(select, { target: { value: option.value } });
}

test("section navigation focuses each destination and preserves unsaved property values", async () => {
  render(<PropertyForm />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Casa en revisión" } });
  fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2500000" } });

  for (const [option, heading] of [
    ["Precio", "Precio"],
    ["Ubicación", "Ubicación"],
    ["Descripción y ficha", "Descripción y ficha"],
    ["Multimedia", "Multimedia"],
    ["Documentos", "Documentos descargables (PDF)"],
    ["Datos básicos", "Datos básicos"],
  ]) {
    chooseSection(option);
    const destination = screen.getByRole("region", { name: heading });
    expect(document.activeElement).toBe(destination);
    expect(destination.scrollIntoView).toHaveBeenLastCalledWith({ block: "start" });
    expect(vi.mocked(destination.scrollIntoView).mock.contexts.at(-1)).toBe(destination);
  }

  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Casa en revisión");
  expect((screen.getByLabelText("Monto") as HTMLInputElement).value).toBe("2500000");
  expect(writes).toHaveLength(0);
  expect(push).not.toHaveBeenCalled();
  await waitFor(() => expect(fetch).toHaveBeenCalled());
});

test("navigation keeps native required fields active and saves only on explicit submission", async () => {
  render(<PropertyForm />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Casa en revisión" } });
  chooseSection("Documentos");
  fireEvent.click(screen.getByRole("button", { name: "Crear inmueble" }));
  expect(writes).toHaveLength(0);
  expect((screen.getByLabelText("Zona") as HTMLInputElement).validity.valueMissing).toBe(true);
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Casa en revisión");

  fireEvent.change(screen.getByLabelText("Zona"), { target: { value: "Centro" } });
  fireEvent.change(screen.getByLabelText("Referencia (nunca dirección exacta)"), { target: { value: "Cerca del parque" } });
  fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Descripción conservada" } });
  delaySave = true;
  fireEvent.click(screen.getByRole("button", { name: "Crear inmueble" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(screen.getByRole("combobox", { name: "Ir a sección" }).matches(":disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Crear inmueble" }).matches(":disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Cancelar" }).matches(":disabled")).toBe(true);
  expect(push).not.toHaveBeenCalled();
  expect(writes[0]).toMatchObject({ version: null, data: {
    slug: "casa-en-revision", titulo: "Casa en revisión", zona: "Centro",
    direccionAproximada: "Cerca del parque", descripcion: ["Descripción conservada"],
  } });
  completeSave!();
  await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/propiedades"));
});

test("a failed save retains the draft and restores navigation and cancel without another write", async () => {
  render(<PropertyForm />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Casa pendiente" } });
  fireEvent.change(screen.getByLabelText("Zona"), { target: { value: "Centro" } });
  fireEvent.change(screen.getByLabelText("Referencia (nunca dirección exacta)"), { target: { value: "Cerca del parque" } });
  fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "Borrador conservado" } });
  failSave = true;
  fireEvent.click(screen.getByRole("button", { name: "Crear inmueble" }));
  expect((await screen.findByRole("alert")).textContent).toBe("No se guardó");
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe("Casa pendiente");
  expect((screen.getByLabelText("Descripción") as HTMLTextAreaElement).value).toBe("Borrador conservado");
  expect(screen.getByRole("combobox", { name: "Ir a sección" }).matches(":disabled")).toBe(false);
  expect(push).not.toHaveBeenCalled();
  chooseSection("Multimedia");
  expect(document.activeElement).toBe(screen.getByRole("region", { name: "Multimedia" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(push).toHaveBeenCalledWith("/admin/propiedades");
  expect(writes).toHaveLength(1);
});
