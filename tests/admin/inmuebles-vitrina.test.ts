import { expect, test } from "vitest";
import type { AdminProperty } from "@/lib/admin/store";
import { faltantes, montoDe, pidenAlgoHoy } from "@/lib/admin/inmuebles-vitrina";

/* LV-10f: la vitrina de Inmuebles muestra lo que pide algo hoy, una vez por inmueble y lo más urgente primero. */
const toDay = (instant: string) => instant.slice(0, 10);
const casa = (over: Partial<AdminProperty>) => ({
  slug: "casa", titulo: "Casa", estado: "disponible", publicada: false,
  galeria: [{ src: "/f.jpg" }], ficha: { construccionM2: 120 }, precio: { modalidad: "monto", monto: 1 },
  ...over,
}) as unknown as AdminProperty;

test("lo que le falta para promoverse sale de fotos, medidas y precio", () => {
  expect(faltantes(casa({}))).toEqual([]);
  expect(faltantes(casa({ galeria: [], ficha: {}, precio: { modalidad: "consulta" } } as Partial<AdminProperty>))).toEqual(["fotos", "medidas", "precio"]);
});

test("llaves atrasadas van primero; lo vendido no aparece; cada inmueble una sola vez", () => {
  const atrasada = casa({ slug: "b", titulo: "Bosque", galeria: [], llaves: { prestamos: [{ id: "k1", persona: "Iliana", salida: "2026-11-10T10:00:00Z", regresoPrevisto: "2026-11-12" }] } } as Partial<AdminProperty>);
  const sinFotos = casa({ slug: "a", titulo: "Álamos", galeria: [] });
  const vendida = casa({ slug: "v", titulo: "Vendida", estado: "vendida", galeria: [] } as Partial<AdminProperty>);
  const lista = pidenAlgoHoy([sinFotos, vendida, atrasada, casa({ slug: "ok", titulo: "Completa" })], [], "2026-11-14", toDay);
  expect(lista.map(p => [p.property.slug, p.tono, p.accion])).toEqual([["b", "alert", "Ver las llaves"], ["a", "warn", "Completar"]]);
  expect(lista[0]).toMatchObject({ motivo: "Las llaves siguen con Iliana", href: "/admin/propiedades/b/seguimiento" });
  expect(lista[1]).toMatchObject({ motivo: "Le falta fotos", href: "/admin/propiedades/a/editar" });
});

test("el precio escrito en la fila acepta pesos con o sin formato y rechaza centavos o cero", () => {
  expect(montoDe("$4,200,000")).toBe(4200000);
  expect(montoDe("4 200 000 MXN")).toBe(4200000);
  expect(montoDe("3500000")).toBe(3500000);
  expect(montoDe("0")).toBeNull();
  expect(montoDe("1500.50")).toBeNull();
  expect(montoDe("")).toBeNull();
  expect(montoDe("abc")).toBeNull();
});
