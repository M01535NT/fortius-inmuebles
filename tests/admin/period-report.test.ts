import { expect, test } from "vitest";
import { compareCount, compareHours, periodMetrics, periodSummary, previousPeriod } from "@/lib/admin/period-report";
import type { Lead, Evento } from "@/lib/admin/store";
test("periods use Tijuana dates and only explicit first contacts enter response time", () => {
  const leads = [
    {
      id: "a",
      asesorId: "one",
      creadoEl: "2026-10-09T02:00:00Z",
      firstContactedAt: "2026-10-09T03:00:00Z",
    },
    {
      id: "b",
      asesorId: "one",
      creadoEl: "2026-10-08T16:00:00Z",
      estado: "contactado",
    },
    {
      id: "c",
      asesorId: "two",
      creadoEl: "2026-10-08T16:00:00Z",
      firstContactedAt: "2026-10-08T18:00:00Z",
    },
  ] as Lead[];
  const metrics = periodMetrics(leads, [], {
    from: "2026-10-08",
    to: "2026-10-08",
    advisor: "one",
  });
  expect(metrics.leads.map((l) => l.id)).toEqual(["a", "b"]);
  expect(metrics.responses).toHaveLength(1);
  expect(metrics.responseHours).toBe(1);
  expect(metrics.unmeasured).toBe(1);
});
test("visits are scheduled events and invalid or negative response intervals are excluded", () => {
  const leads = [
    {
      id: "a",
      creadoEl: "2026-10-08T10:00:00Z",
      firstContactedAt: "2026-10-07T10:00:00Z",
    },
  ] as Lead[];
  const events = [
    { id: "v", tipo: "visita", fecha: "2026-10-08", asesorId: "a" },
    { id: "call", tipo: "llamada", fecha: "2026-10-08" },
  ] as Evento[];
  expect(
    periodMetrics(leads, events, {
      from: "2026-10-08",
      to: "2026-10-08",
      advisor: "",
    }).responseHours,
  ).toBeNull();
  expect(
    periodMetrics(leads, events, {
      from: "2026-10-08",
      to: "2026-10-08",
      advisor: "",
    }).visits.map((e) => e.id),
  ).toEqual(["v"]);
});

test("SIM-11: el periodo anterior tiene el mismo largo y termina el día antes", () => {
  expect(previousPeriod("2026-11-01", "2026-11-12")).toEqual({ from: "2026-10-20", to: "2026-10-31" });
  expect(previousPeriod("2026-03-01", "2026-03-31")).toEqual({ from: "2026-01-29", to: "2026-02-28" });
  expect(previousPeriod("", "2026-11-12")).toBeNull();
  expect(previousPeriod("2026-11-12", "2026-11-01")).toBeNull();
});

test("SIM-11: los cuatro números y su comparación", () => {
  const leads = [
    { id: "a", creadoEl: "2026-11-02T18:00:00Z", firstContactedAt: "2026-11-02T20:00:00Z", estado: "activo" },
    { id: "b", creadoEl: "2026-11-03T18:00:00Z", estado: "nuevo" },
    { id: "c", creadoEl: "2026-10-25T18:00:00Z", estado: "nuevo" },
  ] as unknown as Lead[];
  const events = [{ id: "v", tipo: "visita", fecha: "2026-11-04", titulo: "Visita" }] as unknown as Evento[];
  const now = periodSummary(leads, events, { from: "2026-11-01", to: "2026-11-12", advisor: "" });
  expect(now).toEqual({ received: 2, attended: 1, responseHours: 2, visits: 1 });
  const before = periodSummary(leads, events, { from: "2026-10-20", to: "2026-10-31", advisor: "" });
  expect(compareCount(now.received, before.received)).toBe("1 más que el periodo anterior (1)");
  expect(compareCount(1, 1)).toBe("Igual que el periodo anterior");
  expect(compareCount(1, undefined)).toBe("Sin periodo anterior para comparar");
  expect(compareHours(2, null)).toBe("Sin medición en uno de los dos periodos");
  expect(compareHours(2, 3.5)).toBe("1.5 h más rápido que el periodo anterior (3.5 h)");
});
