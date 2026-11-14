import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const role = vi.hoisted(() => ({ director: false }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: () => [] };
});
vi.mock("@/lib/admin/staff-scope", () => ({ useIsDirector: () => role.director }));

import { RequirementRow } from "@/components/admin/operation/requirements";
import type { OperationWorkflow } from "@/lib/formatos/operation-workflow";

afterEach(cleanup);

/* M-06 (titular, 14/11/2026): una renta sin depósito ni garantía la aprueba el director. */
const flow = (requisitos: Record<string, unknown> = {}) => ({ version: 1, ruta: "arrendador", estado: "activa", motivo: "", requisitos } as unknown as OperationWorkflow);
const row = (f: OperationWorkflow) => {
  render(<RequirementRow requirement="garantias_renta" earlier={false} flow={f} today="2026-11-13" locked={false} busy={false} onQuick={() => undefined} onSheet={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: /^Más estados de/ }));
};
const noAplica = () => screen.queryByRole("radio", { name: /No aplica/ });

test("el asesor no puede marcar «No aplica» en depósito y garantías", () => {
  role.director = false;
  row(flow());
  expect(screen.getAllByRole("radio").length).toBeGreaterThan(0);
  expect(noAplica()).toBeNull();
});

test("el director sí, y la marca que ya existe se conserva para el asesor", () => {
  role.director = true;
  row(flow());
  expect(noAplica()).not.toBeNull();
  cleanup();
  role.director = false;
  row(flow({ garantias_renta: { estado: "no_aplica", soporte: "Sin depósito por acuerdo del director" } }));
  expect(noAplica()).not.toBeNull();
});
