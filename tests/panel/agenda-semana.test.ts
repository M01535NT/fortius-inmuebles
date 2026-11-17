import { expect, test } from "vitest";

import { tareasDeLaSemana, tareasPorFecha, textoSemana } from "@/lib/panel/datos/agenda-semana";
import type { Task } from "@/lib/tasks";

test("PN-04 agenda: dice qué semana se ve", () => {
  expect(textoSemana(new Date(2026, 10, 16))).toBe("16 al 22 de noviembre");
  expect(textoSemana(new Date(2026, 10, 30))).toBe("30 de noviembre al 6 de diciembre");
  expect(textoSemana(new Date(2026, 11, 28))).toBe("28 de diciembre de 2026 al 3 de enero de 2027");
});

test("PN-04 agenda: tareas abiertas con fecha dentro de la semana", () => {
  const t = (id: string, vence: string | undefined, estado: Task["estado"] = "pendiente", expedienteId?: string) =>
    ({ id, titulo: `T ${id}`, estado, ...(vence ? { vence } : {}), ...(expedienteId ? { expedienteId } : {}) }) as unknown as Task;
  const lista = tareasDeLaSemana([
    t("a", "2026-11-18", "pendiente", "e1"),
    t("b", "2026-11-16T09:00:00.000Z"),
    t("c", "2026-11-23"),
    t("d", "2026-11-17", "completada"),
    t("e", undefined),
    t("f", "2026-11-15"),
  ], new Date(2026, 10, 16), new Date(2026, 10, 17));
  expect(lista.map((x) => x.id)).toEqual(["b", "a"]);
  expect(lista[0]).toMatchObject({ fecha: "2026-11-16", vencida: true });
  expect(lista[1]).toMatchObject({ vencida: false, expedienteId: "e1" });
  expect(tareasPorFecha(lista).get("2026-11-18")?.length).toBe(1);
});
