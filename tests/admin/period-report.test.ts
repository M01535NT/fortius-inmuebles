import { expect, test } from "vitest";
import { periodMetrics } from "@/lib/admin/period-report";
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
