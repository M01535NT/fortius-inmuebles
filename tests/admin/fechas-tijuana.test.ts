import { expect, test } from "vitest";
import { addCalendarDays, calendarDayOf } from "@/lib/admin/operational-date";
import { shortDate } from "@/lib/admin/today";
import { recentOfferOf } from "@/lib/admin/operation-view";

/*
  Hallazgo de Calidad (sin prueba previa): las marcas de tiempo de la base vienen en UTC y se
  recortaban a fecha. Lo registrado de 16:00 a 23:59 en Tijuana se mostraba con el día siguiente
  («Desde el 14 nov» para algo del 13) y la oferta de hoy no contaba como «Hoy».
*/
test("una marca de tiempo se muestra con el día de Tijuana; una fecha sola no cambia", () => {
  expect(calendarDayOf("2026-11-14T01:30:00.000Z")).toBe("2026-11-13");
  expect(calendarDayOf("2026-07-14T06:30:00+00:00")).toBe("2026-07-13");
  expect(calendarDayOf("2026-11-13")).toBe("2026-11-13");
  expect(shortDate("2026-11-14T01:30:00.000Z")).toBe("13 nov");
  expect(shortDate("2026-11-14")).toBe("14 nov");
});

test("sumar días a una fecha de calendario no se corre por el huso horario", () => {
  expect(addCalendarDays("2026-11-13", 7)).toBe("2026-11-20");
  expect(addCalendarDays("2026-12-28", 7)).toBe("2027-01-04");
});

test("una oferta de hace tres días según Tijuana sigue siendo reciente", () => {
  const offers = [{ updatedAt: "2026-11-11T02:00:00.000Z", context: { expedienteId: "op" } }]; // 10 nov, 18:00 en Tijuana
  expect(recentOfferOf("op", offers, "2026-11-13")).toBeTruthy();
  expect(recentOfferOf("op", offers, "2026-11-14")).toBeUndefined();
});
