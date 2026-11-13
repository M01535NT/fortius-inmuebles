import { expect, test } from "vitest";
import { humanDate, humanDateTime, overdueText } from "@/lib/utils";

/* SIM-01 (C03, RP-53): una sola fecha humana para todo el panel; nunca «2026-10-17» en pantalla. */
const today = "2026-11-12"; // jueves

test("dice Hoy, Mañana, Ayer y el día de la semana que viene", () => {
  expect(humanDate("2026-11-12", today)).toBe("Hoy");
  expect(humanDate("2026-11-13", today)).toBe("Mañana");
  expect(humanDate("2026-11-11", today)).toBe("Ayer");
  expect(humanDate("2026-11-16", today)).toBe("Lun 16");
  expect(humanDate("2026-11-30", today)).toBe("30 nov");
  expect(humanDate("2026-10-03", today)).toBe("3 oct");
  expect(humanDate("2025-10-03", today)).toBe("3 oct 2025");
  expect(humanDate("2026-11-12T23:00:00.000Z", today)).toBe("Hoy");
  expect(humanDate(undefined, today)).toBe("");
  expect(humanDate("sin fecha", today)).toBe("");
});

test("un instante lleva la hora local y lo vencido dice cuánto", () => {
  const at = new Date(2026, 10, 12, 9, 5).toISOString();
  expect(humanDateTime(at, today)).toBe("Hoy · 09:05");
  expect(humanDateTime("no es fecha", today)).toBe("");
  expect(overdueText("2026-11-12", today)).toBe("Vence hoy");
  expect(overdueText("2026-11-11", today)).toBe("Vencida ayer");
  expect(overdueText("2026-11-09", today)).toBe("Vencida hace 3 días");
  expect(overdueText("2026-11-13", today)).toBe("");
});
