import { expect, test } from "vitest";

import { ordenarInmuebles, ordenarPersonas, type FilaInmueble, type FilaPersona } from "@/lib/panel/datos/vistas";

const inm = (codigo: string, titulo: string, precioNum: number | null) => ({ codigo, titulo, precioNum }) as FilaInmueble;
const per = (nombre: string, creadoEl: string) => ({ id: nombre, nombre, creadoEl }) as FilaPersona;

test("Filtrar y ordenar: inmuebles por precio con los «a consulta» al final, por nombre y por folio", () => {
  const filas = [inm("FORTIUS-000003", "Casa B", 3_000_000), inm("FORTIUS-000001", "Terreno", null), inm("FORTIUS-000002", "Casa A", 1_500_000)];
  expect(ordenarInmuebles(filas, "precio_mayor").map((f) => f.titulo)).toEqual(["Casa B", "Casa A", "Terreno"]);
  expect(ordenarInmuebles(filas, "precio_menor").map((f) => f.titulo)).toEqual(["Casa A", "Casa B", "Terreno"]);
  expect(ordenarInmuebles(filas, "nombre").map((f) => f.titulo)).toEqual(["Casa A", "Casa B", "Terreno"]);
  expect(ordenarInmuebles(filas, "folio").map((f) => f.codigo)).toEqual(["FORTIUS-000001", "FORTIUS-000002", "FORTIUS-000003"]);
});

test("Filtrar y ordenar: personas por nombre o las más recientes primero", () => {
  const filas = [per("Zoe", "2026-11-10"), per("Ana", "2026-11-01"), per("Luis", "2026-11-15")];
  expect(ordenarPersonas(filas, "nombre").map((f) => f.nombre)).toEqual(["Ana", "Luis", "Zoe"]);
  expect(ordenarPersonas(filas, "recientes").map((f) => f.nombre)).toEqual(["Luis", "Zoe", "Ana"]);
});
