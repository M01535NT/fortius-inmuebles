import { describe, expect, it } from "vitest";
import { creditSummary, offerCandidates, offerOwner, withOffer, withoutOffer } from "@/lib/admin/lead-offers";
import { personTimeline } from "@/lib/admin/person-view";
import type { Lead } from "@/lib/domain/records";

/* COR-18: la oferta 14 ligada al interesado por su documento. */
const doc = "70000000-0000-4000-8000-000000000014", op = "70000000-0000-4000-8000-000000000001";
const lead = (id: string, extra: Partial<Lead> = {}): Lead => ({ id, nombre: `Interesado ${id}`, telefono: "6640000000", origen: "manual", estado: "contactado", creadoEl: "2026-11-01", notas: [], ...extra });

describe("ofertas del interesado", () => {
  it("una oferta tiene un solo dueño y se puede cambiar o quitar", () => {
    const a = withOffer(lead("a"), { documentoId: doc, expedienteId: op, fecha: "2026-11-10", propiedadSlug: "casa" });
    expect(offerOwner([lead("b"), a], doc)?.id).toBe("a");
    expect(withOffer(a, { documentoId: doc, expedienteId: op, fecha: "2026-11-11" }).ofertas).toHaveLength(1);
    expect(withoutOffer(a, doc).ofertas).toEqual([]);
  });
  it("propone a quien busca ese inmueble, a quien lo visitó y a la contraparte", () => {
    const leads = [lead("z", { propiedadSlug: "casa" }), lead("v"), lead("c"), lead("x", { propiedadSlug: "otra" })];
    expect(offerCandidates(leads, "casa", ["v"], "c").map(l => l.id)).toEqual(["c", "v", "z"]);
  });
  it("sale en su línea de tiempo y resume cómo paga", () => {
    const { past } = personTimeline({ events: [], tasks: [], today: "2026-11-12", offers: [{ id: doc, text: "Oferta por escrito (14) · Casa", at: "2026-11-10", href: `/admin/operaciones/${op}` }] });
    expect(past[0]).toMatchObject({ kind: "Oferta", href: `/admin/operaciones/${op}` });
    expect(creditSummary({ formaPago: "credito", tipoCredito: "infonavit", estadoCredito: "preautorizado" })).toBe("Crédito Infonavit · Preautorizado");
    expect(creditSummary({ formaPago: "contado" })).toBe("Contado");
    expect(creditSummary({})).toBeUndefined();
  });
});
