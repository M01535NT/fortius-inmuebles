import { expect, it } from "vitest";
import { diaLocal, grupoDe } from "@/lib/admin/personas-vista";

/* LV-10e · Personas como agenda: a quién le toca hoy, esta semana, después o sin fecha. */
it("agrupa por la fecha del siguiente paso, con hora o sin ella", () => {
  const hoy = "2026-11-14";
  expect(grupoDe("2026-11-02", hoy)).toBe("toca");
  expect(grupoDe("2026-11-14 11:00", hoy)).toBe("toca");
  expect(grupoDe("2026-11-15", hoy)).toBe("semana");
  expect(grupoDe("2026-11-20 09:30", hoy)).toBe("semana");
  expect(grupoDe("2026-11-21", hoy)).toBe("despues");
  expect(grupoDe("9999", hoy)).toBe("sinFecha");
});

it("una marca de tiempo cuenta en el día de Tijuana", () => {
  expect(diaLocal("2026-11-15T05:00:00Z")).toBe("2026-11-14");
  expect(diaLocal("2026-11-15")).toBe("2026-11-15");
});
