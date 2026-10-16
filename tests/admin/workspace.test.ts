import { expect, test } from "vitest";
import {
  duplicateContacts,
  filterInventory,
} from "@/lib/admin/workspace";
import type { Property } from "@/data/propiedades";

test("duplicate detection ignores blank contacts and normalizes Mexican phones", () => {
  const rows = [
    { id: "1", telefono: "+52 664 123 4567", email: " Uno@ejemplo.mx " },
    { id: "2", telefono: "6641234567" },
    { id: "3", telefono: "", email: "" },
  ];
  expect(duplicateContacts(rows[0], rows).map((x) => x.id)).toEqual(["2"]);
  expect(duplicateContacts(rows[2], rows)).toEqual([]);
});
test("inventory combines text, advisor, operation and publication filters", () => {
  const rows = [
    {
      slug: "a",
      titulo: "Casa Olivo",
      codigo: "F-1",
      zona: "Tijuana",
      asesorId: "a",
      operacion: "venta",
      estado: "disponible",
      publicada: true,
    },
    {
      slug: "b",
      titulo: "Local",
      codigo: "F-2",
      zona: "Centro",
      asesorId: "b",
      operacion: "renta",
      estado: "disponible",
      publicada: false,
    },
  ] as Property[];
  expect(
    filterInventory(rows, {
      q: "tijuána",
      advisor: "a",
      operation: "venta",
      publication: "publicada",
      status: "",
    }).map((p) => p.slug),
  ).toEqual(["a"]);
  expect(
    filterInventory(rows, {
      q: "",
      advisor: "",
      operation: "",
      publication: "borrador",
      status: "",
    }).map((p) => p.slug),
  ).toEqual(["b"]);
});
