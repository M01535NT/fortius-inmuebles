import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/admin/store", async original => ({ ...await original<typeof import("@/lib/admin/store")>(), useSession: () => ({ id: "u2", email: "asesor@example.test", role: "editor", name: "Asesor de ensayo" }) }));
import { clearAdminCache } from "@/lib/admin/store";
import { EncargoDecisionCard } from "@/components/admin/operation/encargo-decision";
import type { OperationRecord } from "@/lib/admin/operation-view";

beforeEach(() => {
  clearAdminCache();
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ records: [] })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const op = {
  id: "51000000-0000-4000-8000-000000000094", folio: "EXP-ENSAYO-094", version: 3, operacion: "venta", etapa: "comercializacion",
  cliente_id: "c1", asesor_id: "a1", propiedad_slug: "casa",
  flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, resolucion: { tipo: "aceptada", fecha: "2026-10-09", motivo: "Encargo aceptado de ensayo", siguienteAccion: "Firmar", fechaSiguiente: "2026-10-12" } },
} as unknown as OperationRecord;

/*
  BUG-C94 (decisión del titular, 13/11/2026: el asesor puede pausar o rechazar un encargo ya
  aceptado): encargo-decision.tsx:53 bloquea todo el formulario al asesor cuando la decisión vigente
  es «Aceptada» o «Aceptada con condiciones», porque el borrador empieza igual que la vigente. El
  texto de la línea 57 le dice que sí puede registrar si se pausa, se rechaza o se refiere, y el
  servidor solo pide director para aceptar (20261112180000_excepcion_autorizada.sql:80).
*/
test("el asesor puede pasar un encargo aceptado a «Pausada» y guardarlo", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(<EncargoDecisionCard op={op} today="2026-11-13" disabled={false} onSave={onSave} onDirtyChange={() => {}} />);
  const decision = screen.getByRole("combobox", { name: /Decisión/ }) as HTMLSelectElement;
  expect(decision.disabled, "el selector de la decisión está bloqueado al asesor").toBe(false);
  fireEvent.change(decision, { target: { value: "pausada" } });
  fireEvent.change(screen.getByLabelText(/Motivo y alcance/), { target: { value: "El propietario pidió esperar" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].flujo.resolucion.tipo).toBe("pausada");
});

test("el asesor también puede registrar «Rechazada» sobre un encargo aceptado", () => {
  render(<EncargoDecisionCard op={op} today="2026-11-13" disabled={false} onSave={vi.fn()} onDirtyChange={() => {}} />);
  const rechazada = screen.getByRole("option", { name: "Rechazada" }) as HTMLOptionElement;
  const decision = screen.getByRole("combobox", { name: /Decisión/ }) as HTMLSelectElement;
  expect(decision.disabled || rechazada.disabled, "«Rechazada» no se puede elegir").toBe(false);
});
