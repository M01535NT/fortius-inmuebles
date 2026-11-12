import { expect, test } from "vitest";
import { estadoForStage, humanDay, leadStage, personTimeline } from "@/lib/admin/person-view";
import type { Task } from "@/lib/tasks";

const today = "2026-11-11";
const task = (over: Partial<Task>): Task => ({ id: "t", titulo: "Tarea", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], ...over });

test("DEC-46: seis estados guardados se muestran como tres etapas; «cerrado» se conserva como anterior", () => {
  expect((["nuevo", "contactado", "en-evaluacion", "activo", "descartado", "cerrado"] as const).map(leadStage)).toEqual(["nuevo", "seguimiento", "seguimiento", "seguimiento", "descartado", "cerrado"]);
  expect(leadStage(undefined)).toBe("nuevo");
  // «En seguimiento» no pisa el estado intermedio que la persona ya tenía.
  expect(estadoForStage("seguimiento", "en-evaluacion")).toBe("en-evaluacion");
  expect(estadoForStage("seguimiento", "nuevo")).toBe("contactado");
  expect(estadoForStage("descartado", "activo")).toBe("descartado");
  expect(estadoForStage("nuevo", "contactado")).toBe("nuevo");
});

test("la línea de tiempo separa lo que viene de lo que ya pasó y escribe las fechas con palabras", () => {
  const { upcoming, past } = personTimeline({ today,
    notes: [{ id: "n1", texto: "Pidió llamar por la tarde", fecha: "2026-11-09T18:00:00Z" }],
    events: [
      { id: "e1", titulo: "Visita a la casa", fecha: today, hora: "11:00", tipo: "visita" },
      { id: "e0", titulo: "Llamada inicial", fecha: "2026-11-03", tipo: "llamada" },
    ],
    tasks: [task({ id: "late", titulo: "Mandar opciones", vence: "2026-11-08" }), task({ id: "done", titulo: "Pedir datos", estado: "completada", vence: "2026-11-05", completadoEl: "2026-11-05T20:00:00Z" }), task({ id: "free", titulo: "Sin fecha" })],
    records: [{ id: "llegada", text: "Llegó: Sitio web", at: "2026-11-01T10:00:00Z" }, { id: "contacto", text: "Primer contacto" }],
  });
  expect(upcoming.map(item => [item.kind, item.text, item.when, !!item.late])).toEqual([
    ["Tarea", "Mandar opciones", "Vencido · 8 nov", true], ["Visita", "Visita a la casa", "Hoy · 11:00", false], ["Tarea", "Sin fecha", "Sin fecha", false],
  ]);
  expect(past.map(item => [item.kind, item.text, item.when])).toEqual([
    ["Nota", "Pidió llamar por la tarde", "9 nov 2026"], ["Tarea", "Pedir datos", "5 nov 2026"], ["Cita", "Llamada inicial", "3 nov 2026"], ["Registro", "Llegó: Sitio web", "1 nov 2026"],
  ]);
  expect(past.find(item => item.text === "Pedir datos")?.done).toBe(true);
  expect(humanDay("2026-10-04")).toBe("4 oct 2026");
  expect(humanDay(undefined)).toBe("");
});
