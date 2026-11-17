import { expect, test } from "vitest";

import type { Evento } from "@/lib/domain/records";
import { citasDelDia, faltaPara, siguienteCita } from "@/lib/panel/datos/agenda";

const ev = (o: Partial<Evento>): Evento => ({ id: "e1", titulo: "Visita", fecha: "2026-11-16", tipo: "visita", ...o });

test("Hoy: la cita que sigue es la primera con hora que todavía no termina (sugerencia 14)", () => {
  const eventos = [ev({ id: "a", hora: "09:00" }), ev({ id: "b", hora: "11:00", tipo: "llamada" }), ev({ id: "c", hora: "16:00" }), ev({ id: "d" })];
  const citas = citasDelDia(eventos, "2026-11-16");
  const tipos = Object.fromEntries(eventos.map((e) => [e.id, e.tipo]));
  expect(siguienteCita(citas, tipos, 9 * 60 + 30)?.id).toBe("a"); // la visita de 9:00 dura hasta las 10:00
  expect(siguienteCita(citas, tipos, 11 * 60 + 20)?.id).toBe("c"); // la llamada de 11:00 terminó a las 11:15
  expect(siguienteCita(citas, tipos, 18 * 60)).toBeNull();
});

test("Hoy: cuánto falta para la cita", () => {
  expect(faltaPara("10:30", 10 * 60 + 5)).toBe("en 25 min");
  expect(faltaPara("13:00", 10 * 60)).toBe("en 3 h");
  expect(faltaPara("12:15", 10 * 60)).toBe("en 2 h 15 min");
  expect(faltaPara("09:00", 9 * 60 + 10)).toBe("ahora");
});
