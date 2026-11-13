import { expect, it } from "vitest";
import { parseRecord } from "@/lib/backend/validation";

// COR-18: la ficha del interesado guarda sus ofertas 14 solo con identificadores válidos.
const lead = { id: "l1", nombre: "Interesado de ensayo", telefono: "6640000000", origen: "manual", estado: "contactado", creadoEl: "2026-11-01", notas: [] };
it("acepta la oferta ligada y rechaza una referencia inventada", () => {
  const ok = { documentoId: "70000000-0000-4000-8000-000000000014", expedienteId: "70000000-0000-4000-8000-000000000001", fecha: "2026-11-10", propiedadSlug: "casa" };
  expect(parseRecord("leads", "l1", { ...lead, ofertas: [ok] })).toMatchObject({ ofertas: [ok] });
  expect(() => parseRecord("leads", "l1", { ...lead, ofertas: [{ ...ok, documentoId: "../otro" }] })).toThrow();
  expect(() => parseRecord("leads", "l1", { ...lead, ofertas: [{ ...ok, monto: 1 }] })).toThrow();
});
