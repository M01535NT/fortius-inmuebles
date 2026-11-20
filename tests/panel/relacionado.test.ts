import { expect, test } from "vitest";

import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { mismoTelefono, personaDeConsulta, relacionadoCita, relacionadoInmueble, relacionadoPersona } from "@/lib/panel/datos/relacionado";

const cli = (o: Partial<Cliente>): Cliente => ({ id: "c1", nombre: "Ana Ruiz", telefono: "664 123 4567", tipo: "comprador", notas: "", creadoEl: "", actualizadoEl: "", ...o });
const lead = (o: Partial<Lead>): Lead => ({ id: "l1", nombre: "Ana", telefono: "+52 (664) 123-4567", origen: "contacto", estado: "nuevo", creadoEl: "", notas: [], ...o });
const ev = (o: Partial<Evento>): Evento => ({ id: "e1", titulo: "Visita", fecha: "2026-11-20", tipo: "visita", ...o });
const casa = { slug: "casa-1", codigo: "FORTIUS-000001", titulo: "Casa en Playas" } as Property;

test("PN-03 relacionado: el teléfono se compara por sus últimos 10 dígitos", () => {
  expect(mismoTelefono("+52 (664) 123-4567", "6641234567")).toBe(true);
  expect(mismoTelefono("123", "123")).toBe(false);
});

test("PN-03 relacionado: la persona enlaza su inmueble, sus próximas citas y su consulta", () => {
  const g = relacionadoPersona(cli({ leadId: "l1", propiedadSlug: "casa-1" }), {
    leads: [lead({})], inmuebles: [casa], hoy: "2026-11-16",
    eventos: [ev({ clienteId: "c1" }), ev({ id: "vieja", clienteId: "c1", fecha: "2026-11-01" })],
  });
  expect(g.map((x) => x.titulo)).toEqual(["Inmueble que le interesa", "Próximas citas", "Consultas"]);
  expect(g[0].enlaces[0].href).toBe("/admin/inmuebles?ver=FORTIUS-000001");
  expect(g[1].enlaces.map((e) => e.id)).toEqual(["e1"]);
  expect(g[2].enlaces[0].href).toBe("/admin/consultas?ver=l1");
});

test("PN-03 relacionado: el inmueble muestra quién pregunta y sus visitas; la consulta encuentra a la persona por teléfono", () => {
  const g = relacionadoInmueble(casa, { leads: [lead({ propiedadSlug: "casa-1" })], eventos: [ev({ propiedadSlug: "casa-1" })], hoy: "2026-11-16" });
  expect(g.map((x) => x.enlaces.length)).toEqual([1, 1]);
  expect(personaDeConsulta(lead({}), [cli({})])).toMatchObject({ porTelefono: true });
  expect(personaDeConsulta(lead({ clienteId: "c1", telefono: "" }), [cli({})])).toMatchObject({ porTelefono: false });
  const cita = relacionadoCita({ clienteId: "c1", propiedadSlug: "casa-1" }, { clientes: [cli({})], leads: [], inmuebles: [casa] });
  expect(cita.map((x) => x.titulo)).toEqual(["Con quién", "Dónde"]);
});
