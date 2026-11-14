vi.mock("@/components/admin/workspace/confirm", () => ({ confirmAction: vi.fn().mockResolvedValue(true) }));
import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PropertyForm } from "@/components/admin/property-form";
import { clearAdminCache } from "@/lib/admin/store";
import type { Property } from "@/data/propiedades";
import { propiedades } from "../fixtures/propiedades";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
let writes: Array<{ data: Record<string, unknown> }>;
beforeEach(() => {
  clearAdminCache();
  sessionStorage.clear();
  writes = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const body = JSON.parse(String(init.body));
      writes.push(body);
      return Response.json({ record: { id: body.data.slug, data: body.data, version: 2, createdAt: "2026-11-01", updatedAt: "2026-11-13" } });
    }
    return Response.json({ records: [] });
  }));
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });

const base: Property = { ...propiedades[0], precio: { modalidad: "publico", monto: 1500000, moneda: "MXN" } };

/*
  BUG-C55: «Recuperar copia» escribe `el.value` directo en el DOM; los campos que React controla (el
  monto, entre otros) vuelven a su valor en el siguiente render. El asesor ve «Copia recuperada» y
  guarda el precio anterior.
*/
test("recuperar la copia temporal conserva el monto que se había cambiado", async () => {
  const first = render(<PropertyForm initial={base} />);
  fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "2000000" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar copia temporal" }));
  first.unmount();
  render(<PropertyForm initial={base} />);
  fireEvent.click(screen.getByRole("button", { name: "Recuperar copia" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect((writes[0].data.precio as { monto: number }).monto).toBe(2000000);
});

/*
  BUG-C56: la copia temporal se descarta al leerla si el inmueble está «En evaluación» (el estado de
  todo inmueble nuevo): property-workbench.tsx acepta solo disponible/apartada/vendida/rentada. Tampoco
  sirve «Conservar copia y recargar» tras un 409.
*/
test("un inmueble en evaluación también ofrece recuperar su copia temporal", () => {
  const enEvaluacion: Property = { ...base, estado: "evaluacion", publicada: false, publicadaEl: "" };
  const first = render(<PropertyForm initial={enEvaluacion} />);
  fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Casa en captación de ensayo" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar copia temporal" }));
  first.unmount();
  render(<PropertyForm initial={enEvaluacion} />);
  expect(screen.queryByRole("button", { name: "Recuperar copia" })).not.toBeNull();
});

/*
  BUG-C57: con «Precio público», un monto vacío se guarda como 0 (`Number(v("monto") || 0)`) y, al
  publicarse, el sitio muestra «$0 MXN». Ni el formulario ni el servidor lo detienen.
*/
test("un precio público sin monto no se guarda como $0", async () => {
  render(<PropertyForm initial={base} />);
  fireEvent.change(screen.getByLabelText("Monto"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(writes.find(w => (w.data.precio as { modalidad: string; monto?: number }).modalidad === "publico" && (w.data.precio as { monto?: number }).monto === 0)).toBeUndefined();
});

/*
  BUG-C58: Terreno y Construcción son `type="number"` sin `step`: el navegador exige enteros y bloquea
  160.5 m² con un mensaje genérico, aunque el servidor acepta decimales (superficie de escritura).
*/
test("terreno y construcción aceptan decimales", () => {
  render(<PropertyForm initial={base} />);
  for (const label of [/Terreno \(m²\)/, /Construcción \(m²\)/]) {
    const input = screen.getByLabelText(label) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "160.5" } });
    expect(input.validity.stepMismatch).toBe(false);
  }
});
