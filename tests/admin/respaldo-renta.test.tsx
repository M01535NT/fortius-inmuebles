import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: () => [], apiRequest: vi.fn(async () => ({ emisiones: [], adjuntos: [] })) };
});
vi.mock("@/lib/admin/staff-scope", () => ({ useIsDirector: () => true }));

import { ReviewSheet, type Evidence } from "@/components/admin/operation/requirements";

afterEach(cleanup);

/*
  BUG-C27: en la renta del propietario la intermediación se respalda con el 21 y el arrendatario con el 22
  (`requirementFormato`), pero el panel «Confirmar» sigue buscando el 09 y el 12. Como no los encuentra,
  deja elegido el primer documento de la operación (la entrevista 02) como respaldo, y en «Más detalles»
  dice «Formato relacionado: 09». El asesor confirmaría la intermediación con la entrevista sin notarlo.
*/
const evidence: Evidence = { reviewer: "Asesor de prueba", documents: [
  { id: "d02", formato_id: "02", version: 1 },
  { id: "d21", formato_id: "21", version: 1 },
  { id: "d22", formato_id: "22", version: 1 },
] };
const elegido = () => {
  const marcado = Array.from(document.querySelectorAll<HTMLInputElement>("input[name='respaldo']")).find(r => r.checked);
  return marcado?.closest("label")?.textContent ?? "";
};
const abrir = (requirement: "intermediacion" | "arrendatario") => render(<ReviewSheet requirement={requirement} route="arrendador" today="2026-11-13" evidence={evidence} onClose={() => undefined} onSave={async () => undefined} onAddDocument={() => undefined} />);

test("en la renta, la intermediación viene respaldada por el 21 y no por la entrevista", async () => {
  const { formatoById } = await import("@/lib/formatos/catalog");
  abrir("intermediacion");
  expect(elegido()).toContain(formatoById("21").title);
  expect(screen.getByText(/Formato relacionado: 21\./)).toBeTruthy();
});

test("en la renta, el arrendatario viene respaldado por su solicitud, el 22", async () => {
  const { formatoById } = await import("@/lib/formatos/catalog");
  abrir("arrendatario");
  expect(elegido()).toContain(formatoById("22").title);
  expect(screen.getByText(/Formato relacionado: 22\./)).toBeTruthy();
});
