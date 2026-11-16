import { expect, test } from "vitest";

import type { Evento } from "@/lib/domain/records";
import { citasDelDia, proximaFecha, semanaDesde, semanaEnLista, sumarDias } from "@/lib/panel/datos/agenda";

const HOY = new Date(2026, 10, 16); // lunes 16 nov 2026
const ev = (o: Partial<Evento>): Evento => ({ id: "e1", titulo: "Visita", fecha: "2026-11-16", tipo: "visita", ...o });

test("PN-04 agenda: la tira son 7 días desde hoy, con cuántas citas trae cada uno", () => {
  const tira = semanaDesde(HOY, [ev({}), ev({ id: "e2" }), ev({ id: "e3", fecha: "2026-11-18" }), ev({ id: "e4", fecha: "2026-11-30" })]);
  expect(tira).toHaveLength(7);
  expect(tira[0]).toMatchObject({ fecha: "2026-11-16", letra: "L", hoy: true, citas: 2 });
  expect(tira[2].citas).toBe(1);
  expect(tira.reduce((n, d) => n + d.citas, 0)).toBe(3);
});

test("PN-04 agenda: las citas van por hora y se avisa si dos se empalman", () => {
  const citas = citasDelDia([ev({ id: "a", hora: "16:00" }), ev({ id: "b", hora: "10:00" }), ev({ id: "c", hora: "16:00", tipo: "firma", titulo: "" }), ev({ id: "d" })], "2026-11-16");
  expect(citas.map((c) => c.id)).toEqual(["b", "a", "c", "d"]);
  expect(citas.filter((c) => c.empalme).map((c) => c.id)).toEqual(["a", "c"]);
  expect(citas.find((c) => c.id === "c")?.titulo).toBe("Firma");
});

test("PN-04 agenda: el empalme cuenta la duración y solo compara citas del mismo responsable", () => {
  const citas = citasDelDia([
    ev({ id: "v1", hora: "16:00", asesorId: "ana" }),
    ev({ id: "v2", hora: "16:30", asesorId: "ana" }),
    ev({ id: "v3", hora: "16:30", asesorId: "luis" }),
    ev({ id: "l1", hora: "17:00", tipo: "llamada", asesorId: "ana" }),
  ], "2026-11-16");
  expect(citas.filter((c) => c.empalme).map((c) => c.id).sort()).toEqual(["l1", "v1", "v2"]);
  expect(citas.find((c) => c.id === "v3")?.empalme).toBe(false);
});

test("PN-04 agenda: la lista nombra Hoy y Mañana y omite los días sin citas", () => {
  const lista = semanaEnLista([ev({}), ev({ id: "m", fecha: "2026-11-17" }), ev({ id: "j", fecha: "2026-11-19" })], HOY);
  expect(lista.map((d) => d.titulo)).toEqual(["Hoy", "Mañana", "jueves 19 nov"]);
});

test("PN-04 agenda: la semana se mueve con las flechas y sigue marcando hoy solo si cae dentro (AUD-03, A1)", () => {
  const hoy = new Date(2026, 10, 16);
  const siguiente = semanaDesde(sumarDias(hoy, 7), [], hoy);
  expect(siguiente[0].fecha).toBe("2026-11-23");
  expect(siguiente.some((d) => d.hoy)).toBe(false);
  expect(semanaDesde(hoy, [], hoy)[0].hoy).toBe(true);
});

test("PN-04 agenda: la próxima fecha con citas desde un día dado (AUD-03, A2)", () => {
  const ev = [{ fecha: "2026-12-03" }, { fecha: "2026-11-30" }, { fecha: "2026-11-10" }];
  expect(proximaFecha(ev, "2026-11-23")).toBe("2026-11-30");
  expect(proximaFecha(ev, "2026-12-04")).toBeNull();
});
