import { describe, expect, it } from "vitest";
import { firstDaySteps } from "@/lib/admin/first-day";
import { HELP_SECTIONS, hasHelp, helpHref } from "@/lib/admin/help";
import { TOUR_SCREENS } from "@/lib/admin/tour";

/* COR-26: «Tu primer día» y «¿Cómo se hace esto?». */
describe("tu primer día", () => {
  it("cada paso se marca con lo que el asesor ya tiene suyo", () => {
    const none = firstDaySteps({ mine: "ana", leads: [{ asesorId: "luis" }], events: [], operations: [] });
    expect(none.map(s => s.done)).toEqual([false, false, false]);
    const some = firstDaySteps({ mine: "ana", leads: [{ asesorId: "ana" }], events: [{ asesorId: "ana" }], operations: [] });
    expect(some.map(s => s.done)).toEqual([true, true, false]);
    expect(firstDaySteps({ mine: "ana", leads: [], events: [{ asesorId: "ana" }], operations: [{ asesor_id: "ana" }] }).every(s => s.done)).toBe(true);
  });
  it("N24: antes van la foto y el WhatsApp, y se marcan con lo que ya tiene", () => {
    const pasos = firstDaySteps({ mine: "ana", leads: [], events: [], operations: [], perfil: { foto: true, whatsapp: false } });
    expect(pasos.map(s => s.id)).toEqual(["foto", "whatsapp", "llamada", "entrevista", "operacion"]);
    expect(pasos.slice(0, 2).map(s => s.done)).toEqual([true, false]);
    expect(pasos[0].href).toBe("/admin/perfil");
  });
});

describe("¿cómo se hace esto?", () => {
  it("cada pantalla de la guía tiene su sección del manual", () => {
    for (const screen of TOUR_SCREENS) expect(hasHelp(screen.id), screen.id).toBe(true);
    expect(helpHref("operacion")).toBe("/admin/ayuda#operacion");
    expect(new Set(HELP_SECTIONS.map(s => s.id)).size).toBe(HELP_SECTIONS.length);
    expect(HELP_SECTIONS.every(s => s.tasks.length > 0 && s.tasks.every(t => t.steps.length > 0))).toBe(true);
  });
});
