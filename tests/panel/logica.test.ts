import { expect, test } from "vitest";

import { filtrar, normalizar, type Entrada } from "@/lib/panel/buscar";
import { aTexto, deTexto, diaLargo, diasDelMes, diasDesde, horaTexto, moverHora, tituloMes } from "@/lib/panel/calendario";
import { aplicarOrden, avisoDeMovimiento, leerOrdenGuardado, moverElemento } from "@/lib/panel/ordenar";

test("PN-01 ordenar: mover un elemento da una lista nueva y no toca la original", () => {
  const base = ["a", "b", "c", "d"];
  expect(moverElemento(base, 3, 0)).toEqual(["d", "a", "b", "c"]);
  expect(moverElemento(base, 0, 2)).toEqual(["b", "c", "a", "d"]);
  expect(base).toEqual(["a", "b", "c", "d"]);
  expect(moverElemento(base, 1, 1)).toEqual(base);
  expect(moverElemento(base, -1, 2)).toEqual(base);
  expect(moverElemento(base, 1, 9)).toEqual(base);
});

test("PN-01 ordenar: un orden guardado ignora lo que ya no existe y deja lo nuevo al final", () => {
  const base = [{ s: "hoy" }, { s: "bandeja" }, { s: "dinero" }, { s: "equipo" }];
  const r = aplicarOrden(base, ["dinero", "ya-no-existe", "hoy", "dinero"], (x) => x.s);
  expect(r.map((x) => x.s)).toEqual(["dinero", "hoy", "bandeja", "equipo"]);
  expect(aplicarOrden(base, [], (x) => x.s)).toEqual(base);
});

test("PN-01 ordenar: lo guardado que no es una lista de textos se descarta sin romper", () => {
  expect(leerOrdenGuardado(null)).toEqual([]);
  expect(leerOrdenGuardado("")).toEqual([]);
  expect(leerOrdenGuardado("{no es json")).toEqual([]);
  expect(leerOrdenGuardado('{"a":1}')).toEqual([]);
  expect(leerOrdenGuardado('["a",3,"b"]')).toEqual(["a", "b"]);
  expect(avisoDeMovimiento("Dinero", 2, 12)).toBe("Dinero quedó en el lugar 2 de 12");
});

test("PN-01 calendario: noviembre 2026 empieza en domingo (seis huecos con la semana en lunes) y marca hoy y lo pasado", () => {
  const hoy = new Date(2026, 10, 15);
  const celdas = diasDelMes(2026, 10, hoy);
  expect(celdas.slice(0, 6).every((c) => c.fecha === null)).toBe(true);
  expect(celdas[6]).toMatchObject({ fecha: "2026-11-01", dia: 1, pasado: true });
  expect(celdas.filter((c) => c.fecha !== null)).toHaveLength(30);
  const dia15 = celdas.find((c) => c.fecha === "2026-11-15");
  expect(dia15).toMatchObject({ hoy: true, pasado: false });
  expect(celdas.find((c) => c.fecha === "2026-11-14")?.pasado).toBe(true);
  expect(celdas.find((c) => c.fecha === "2026-11-20")?.pasado).toBe(false);
});

test("PN-01 calendario: pasarse de mes ajusta el año; febrero bisiesto tiene 29 días", () => {
  expect(tituloMes(2026, 12)).toBe("enero 2027");
  expect(tituloMes(2026, -1)).toBe("diciembre 2025");
  expect(diasDelMes(2028, 1, new Date(2028, 0, 1)).filter((c) => c.fecha !== null)).toHaveLength(29);
  expect(diasDelMes(2027, 1, new Date(2027, 0, 1)).filter((c) => c.fecha !== null)).toHaveLength(28);
});

test("PN-01 calendario: fechas en texto, día con letra y días que faltan", () => {
  expect(aTexto(new Date(2026, 0, 5))).toBe("2026-01-05");
  expect(deTexto("2026-02-30")).toBeNull();
  expect(deTexto("hola")).toBeNull();
  expect(diaLargo("2026-11-20")).toBe("viernes 20 nov");
  expect(diasDesde(new Date(2026, 10, 15, 23, 59), "2026-11-20")).toBe(5);
  expect(diasDesde(new Date(2026, 10, 15), "2026-11-12")).toBe(-3);
  expect(diasDesde(new Date(2026, 10, 15), "mal")).toBeNull();
});

test("PN-01 calendario: la hora se mueve de 30 en 30 minutos entre 7:00 y 20:00", () => {
  expect(horaTexto(7 * 60)).toBe("7:00");
  expect(horaTexto(10 * 60 + 30)).toBe("10:30");
  expect(moverHora(10 * 60, 1)).toBe(10 * 60 + 30);
  expect(moverHora(7 * 60, -1)).toBe(7 * 60);
  expect(moverHora(20 * 60, 1)).toBe(20 * 60);
});

const ENTRADAS: Entrada[] = [
  { id: "a", titulo: "Agenda", grupo: "Ir a", claves: ["citas, visitas y vencimientos"] },
  { id: "b", titulo: "Cita nueva", grupo: "Crear", claves: ["visita", "agenda"] },
  { id: "c", titulo: "Dinero", grupo: "Ir a", claves: ["cobro", "comisión"] },
  { id: "d", titulo: "Movimiento de dinero", grupo: "Crear", claves: ["cobro"] },
];

test("PN-01 buscar: ignora mayúsculas y acentos, acepta varias palabras y ordena lo que empieza igual primero", () => {
  expect(normalizar("  Comisión ")).toBe("comision");
  expect(filtrar(ENTRADAS, "AGENDA").map((e) => e.id)).toEqual(["a", "b"]);
  expect(filtrar(ENTRADAS, "comision").map((e) => e.id)).toEqual(["c"]);
  expect(filtrar(ENTRADAS, "dinero").map((e) => e.id)).toEqual(["c", "d"]);
  expect(filtrar(ENTRADAS, "mov din").map((e) => e.id)).toEqual(["d"]);
  expect(filtrar(ENTRADAS, "xyz")).toEqual([]);
  expect(filtrar(ENTRADAS, "")).toHaveLength(4);
});
