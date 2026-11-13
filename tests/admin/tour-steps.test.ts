import { expect, test } from "vitest";
import { TOUR_SCREENS, helpPending, markSeen, opensAlone, readSeen, tourFor } from "@/lib/admin/tour";

test("DEC-47: solo Hoy abre su guía sola; en las demás, «Ayuda» lleva un punto hasta verla", () => {
  expect(TOUR_SCREENS.filter(screen => opensAlone(screen.id)).map(screen => screen.id)).toEqual(["hoy"]);
  expect(helpPending("/admin", [])).toBe(false);
  expect(helpPending("/admin/operaciones/nueva", [])).toBe(true);
  expect(helpPending("/admin/operaciones/nueva", ["nueva"])).toBe(false);
  expect(helpPending("/admin/configuracion", [])).toBe(false);
});

test("cada pantalla principal tiene su guía y las demás no", () => {
  expect(tourFor("/admin")?.id).toBe("hoy");
  expect(tourFor("/admin/operaciones")?.id).toBe("operaciones");
  expect(tourFor("/admin/operaciones/51000000-0000-4000-8000-000000000001")?.id).toBe("operacion");
  expect(tourFor("/admin/operaciones/nueva")?.id).toBe("nueva");
  expect(tourFor("/admin/leads/lead-1")?.id).toBe("contactos");
  expect(tourFor("/admin/propiedades/casa/editar")?.id).toBe("inmuebles");
  expect(tourFor("/admin/agenda")?.id).toBe("agenda");
  expect(tourFor("/admin/herramientas")?.id).toBe("herramientas");
  expect(tourFor("/admin/sistema")).toBeNull();
  expect(tourFor("/admin/configuracion")).toBeNull();
});

test("los pasos tienen título, texto y un destino único por pantalla", () => {
  for (const screen of TOUR_SCREENS) {
    expect(screen.steps.length).toBeGreaterThan(0);
    const targets = screen.steps.map(step => step.target);
    expect(new Set(targets).size).toBe(targets.length);
    for (const step of screen.steps) {
      expect(step.title.trim().length).toBeGreaterThan(2);
      expect(step.text.trim().length).toBeGreaterThan(20);
      expect(step.text).not.toMatch(/data-tour|localStorage|API/);
    }
  }
});

test("lo visto se guarda sin duplicar y sobrevive a un almacenamiento roto", () => {
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  markSeen(storage, "hoy"); markSeen(storage, "hoy"); markSeen(storage, "agenda");
  expect(readSeen(storage)).toEqual(["hoy", "agenda"]);
  const broken = { getItem: () => { throw new Error("sin acceso"); }, setItem: () => { throw new Error("sin acceso"); } };
  expect(readSeen(broken)).toEqual([]);
  expect(() => markSeen(broken, "hoy")).not.toThrow();
  expect(readSeen(null)).toEqual([]);
});
