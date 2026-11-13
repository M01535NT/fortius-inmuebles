import { expect, test, vi } from "vitest";
import { moverOferta } from "@/components/admin/operation/offer-link";
import { offerOwner } from "@/lib/admin/lead-offers";
import type { Lead } from "@/lib/admin/store";

// C-22: mover una oferta 14 de un interesado a otro no la deja sin dueño ni con dos.
const offer = { documentoId: "doc-14", expedienteId: "op-1", fecha: "2026-11-10" };
const base = (id: string, ofertas: Lead["ofertas"] = []): Lead => ({ id, nombre: `Interesado ${id}`, telefono: "", origen: "manual", estado: "contactado", creadoEl: "2026-11-01", notas: [], ofertas } as unknown as Lead);

function store(leads: Lead[], fallaEn?: number) {
  const state = new Map(leads.map(l => [l.id, l]));
  let calls = 0;
  const put = vi.fn(async (lead: Lead) => { calls += 1; if (calls === fallaEn) throw new Error("Sin conexión"); state.set(lead.id, lead); return lead; });
  return { put, version: () => 1, all: () => [...state.values()] };
}

test("liga al nuevo interesado y la quita del anterior", async () => {
  const leads = [base("a", [offer]), base("b")];
  const s = store(leads);
  await moverOferta(leads, offer, "b", s.put, s.version);
  expect(offerOwner(s.all(), "doc-14")?.id).toBe("b");
  expect(s.all().filter(l => l.ofertas?.some(o => o.documentoId === "doc-14"))).toHaveLength(1);
});

test("si falla quitarla al anterior, deshace el nuevo y conserva al dueño original", async () => {
  const leads = [base("a", [offer]), base("b")];
  const s = store(leads, 2);
  await expect(moverOferta(leads, offer, "b", s.put, s.version)).rejects.toThrow("Sin conexión");
  expect(s.all().filter(l => l.ofertas?.some(o => o.documentoId === "doc-14")).map(l => l.id)).toEqual(["a"]);
});

test("si falla ligarla al nuevo, el anterior la conserva", async () => {
  const leads = [base("a", [offer]), base("b")];
  const s = store(leads, 1);
  await expect(moverOferta(leads, offer, "b", s.put, s.version)).rejects.toThrow("Sin conexión");
  expect(offerOwner(s.all(), "doc-14")?.id).toBe("a");
  expect(s.put).toHaveBeenCalledTimes(1);
});

test("un interesado que ya no existe no quita la oferta a nadie", async () => {
  const leads = [base("a", [offer])];
  const s = store(leads);
  await expect(moverOferta(leads, offer, "x", s.put, s.version)).rejects.toThrow(/ya no está disponible/);
  expect(s.put).not.toHaveBeenCalled();
});
