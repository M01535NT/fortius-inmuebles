import * as React from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { PropertyFollowup } from "@/components/admin/properties/property-followup";
import { buyersFor, matchReasons, noticeMessage, pendingNotices, seekersFrom, zoneTokens, type Seeker } from "@/lib/admin/buyer-matches";
import { channelMetrics } from "@/lib/admin/period-report";
import { expiryItems, type TodayDossier } from "@/lib/admin/today";
import { clearAdminCache, type AdminProperty, type Cliente, type Lead } from "@/lib/admin/store";
import { keyLoanLate, prepProgress, prepState } from "@/lib/propiedad-seguimiento";
import { propiedades } from "../fixtures/propiedades";

afterEach(() => { cleanup(); clearAdminCache(); vi.unstubAllGlobals(); });

const today = "2026-10-29";
const house = (over: Partial<AdminProperty> = {}): AdminProperty => ({ ...propiedades[0], slug: "casa-playas", titulo: "Casa en Playas", tipo: "casa", operacion: "venta", estado: "disponible", publicada: true, publicadaEl: "2026-10-20", zona: "Playas de Tijuana", direccionAproximada: "Cerca del malecón", precio: { modalidad: "publico", monto: 4_000_000, moneda: "MXN" }, ficha: { recamaras: 3, estacionamientos: 2, construccionM2: 180 }, demo: true, ...over });
const seeker = (over: Partial<Seeker> = {}): Seeker => ({ id: "lead1", kind: "lead", nombre: "Ana Ruiz", telefono: "664 123 4567", href: "/admin/leads/lead1", tipoPropiedad: "casa", zona: "Playas, Otay", perfil: { operacion: "comprar", presupuestoMax: 4_000_000, moneda: "MXN", recamaras: 3 }, ...over });
const lead = (over: Partial<Lead> = {}): Lead => ({ id: "lead1", nombre: "Ana Ruiz", telefono: "6641234567", origen: "manual", estado: "nuevo", creadoEl: "2026-10-20T10:00:00Z", notas: [], ...over });

describe("avisos al comprador", () => {
  test("propone a quien busca ese tipo, en esa zona y con ese presupuesto, con sus razones", () => {
    expect(matchReasons(house(), seeker())).toEqual(["Busca casa", "Busca en Playas", "Dentro de su presupuesto"]);
    expect(matchReasons(house({ precio: { modalidad: "publico", monto: 4_150_000, moneda: "MXN" } }), seeker())).toContain("Hasta 5 % arriba de su presupuesto");
  });

  test("un criterio capturado que no se cumple descarta; uno vacío no", () => {
    for (const over of [{ tipoPropiedad: "terreno" }, { zona: "Otay" }, { perfil: { operacion: "comprar" as const, presupuestoMax: 3_000_000, moneda: "MXN" as const } }, { perfil: { operacion: "rentar" as const } }, { perfil: { operacion: "comprar" as const, recamaras: 4 } }])
      expect(matchReasons(house(), seeker(over))).toBeNull();
    expect(matchReasons(house(), seeker({ zona: undefined, perfil: { operacion: "comprar" } }))).toEqual(["Busca casa"]);
    expect(matchReasons(house(), seeker({ tipoPropiedad: undefined, zona: undefined, perfil: { operacion: "comprar" } }))).toBeNull();
    // Otra moneda: no se compara ni descarta.
    expect(matchReasons(house(), seeker({ perfil: { operacion: "comprar", presupuestoMax: 100_000, moneda: "USD" } }))).toEqual(["Busca casa", "Busca en Playas"]);
  });

  test("sin publicar o ya apartado no se ofrece a nadie (RP-91)", () => {
    expect(matchReasons(house({ publicada: false }), seeker())).toBeNull();
    expect(matchReasons(house({ estado: "apartada" }), seeker())).toBeNull();
  });

  test("toma prospectos activos y clientes compradores, sin duplicar al convertido", () => {
    const clients = [{ id: "c1", nombre: "Luis", telefono: "6640000000", tipo: "comprador", notas: "", creadoEl: "", actualizadoEl: "", tipoPropiedad: "casa" } as Cliente];
    const people = seekersFrom([lead({ perfil: { operacion: "comprar" } }), lead({ id: "l2", clienteId: "c1", perfil: { operacion: "comprar" } }), lead({ id: "l3", estado: "descartado", perfil: { operacion: "comprar" } }), lead({ id: "l4", perfil: { operacion: "vender" } })], clients);
    expect(people.map(p => `${p.kind}:${p.id}`)).toEqual(["lead:lead1", "cliente:c1"]);
    expect(people[1].perfil?.operacion).toBe("comprar");
  });

  test("lo ya avisado deja de estar pendiente y el mensaje lleva el enlace público", () => {
    const people = [seeker(), seeker({ id: "lead2", nombre: "Beto" })];
    expect(buyersFor(house(), people)).toHaveLength(2);
    const notified = house({ avisosCompradores: [{ id: "n1", personaId: "lead1", tipo: "lead", medio: "whatsapp", fecha: "2026-10-28T10:00:00Z" }] });
    expect(pendingNotices([notified], people)[0].pending.map(m => m.seeker.id)).toEqual(["lead2"]);
    expect(noticeMessage(house(), seeker(), "https://fortiusinmuebles.com")).toBe("Hola Ana, te comparto un inmueble que puede interesarte: Casa en Playas, en Playas de Tijuana por $4,000,000 MXN. https://fortiusinmuebles.com/inventario/casa-playas");
    expect(zoneTokens("Playas, Otay y Chapultepec")).toEqual(["playas", "otay", "chapultepec"]);
  });

  test("si el precio baja después del aviso, la persona vuelve a quedar por avisar", () => {
    const notice = { id: "n1", personaId: "lead1", tipo: "lead" as const, medio: "whatsapp" as const, fecha: "2026-10-28T10:00:00Z", precio: { monto: 4_000_000, moneda: "MXN" as const } };
    expect(pendingNotices([house({ avisosCompradores: [notice] })], [seeker()])).toEqual([]);
    const cheaper = house({ avisosCompradores: [notice], precio: { modalidad: "publico", monto: 3_800_000, moneda: "MXN" } });
    expect(pendingNotices([cheaper], [seeker()])[0].pending.map(m => m.seeker.id)).toEqual(["lead1"]);
    expect(noticeMessage(cheaper, seeker(), "https://fortiusinmuebles.com")).toMatch(/^Hola Ana, bajó de precio un inmueble que te compartí: Casa en Playas/);
  });
});

describe("llaves y preparación", () => {
  const toDay = (instant: string) => instant.slice(0, 10);
  test("las llaves sin fecha prevista deben volver el mismo día", () => {
    expect(keyLoanLate({ id: "k", persona: "Ana", salida: "2026-10-28T17:00:00Z" }, today, toDay)).toBe(true);
    expect(keyLoanLate({ id: "k", persona: "Ana", salida: "2026-10-28T17:00:00Z", regresoPrevisto: "2026-10-30" }, today, toDay)).toBe(false);
    expect(keyLoanLate({ id: "k", persona: "Ana", salida: "2026-10-20T17:00:00Z", regreso: "2026-10-21T10:00:00Z" }, today, toDay)).toBe(false);
  });
  test("el material cargado cuenta como listo y «No aplica» no cuenta", () => {
    const p = house({ galeria: [{ src: "/a.jpg", alt: "" }], videoUrl: undefined, tour360Url: undefined, preparacion: { letrero: { estado: "no_aplica" }, video: { estado: "agendado" } } });
    expect(prepState(p, "fotos")).toEqual({ estado: "listo", derived: true });
    expect(prepState(p, "video")).toEqual({ estado: "agendado", derived: false });
    expect(prepProgress(p)).toEqual({ done: 1, total: 5 });
  });
});

describe("contratos y licencias por vencer", () => {
  const names = { client: (id?: string) => id === "c1" ? "Familia Navarro" : undefined, property: (slug?: string | null) => slug === "casa" ? "Casa en Playas" : undefined };
  const dossier = (over: Partial<TodayDossier> = {}): TodayDossier => ({ id: "d1", folio: "EXP-1", etapa: "comercializacion", cliente_id: "c1", propiedad_slug: "casa", flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {} } as TodayDossier["flujo"], ...over });
  test("avisa 30 días antes del fin del contrato y 60 de la licencia; vencidos siguen avisando", () => {
    const items = expiryItems({ today, names, dossiers: [dossier(), dossier({ id: "d2", folio: "EXP-2" }), dossier({ id: "d3", folio: "EXP-3", etapa: "entrega" })], contracts: [
      { expedienteId: "d1", folio: "EXP-1", emitido: true, fin: "2026-11-20", exclusiva: true, licencia: { numero: "BC-1", vigencia: "2026-12-20" } },
      { expedienteId: "d2", folio: "EXP-2", emitido: true, fin: "2026-10-25", exclusiva: false, licencia: { numero: "BC-1", vigencia: "2026-12-20" } },
      { expedienteId: "d3", folio: "EXP-3", emitido: true, fin: "2026-10-30", exclusiva: false },
    ] });
    expect(items.map(i => [i.kind, i.date, i.late])).toEqual([["Contrato", "2026-10-25", true], ["Contrato", "2026-11-20", false], ["Licencia", "2026-12-20", false]]);
    expect(items[0].text).toBe("El contrato de servicio venció el 25 oct. Renuévalo o retira la publicación.");
    expect(items[1].text).toBe("El contrato de servicio vence en 22 días, el 20 nov. Habla con el propietario para renovarlo.");
    expect(items[1].meta).toBe("Familia Navarro · Casa en Playas · Exclusiva · EXP-1");
  });
  test("un 09 sin emitir, lejano o de una operación descartada no avisa", () => {
    expect(expiryItems({ today, names, dossiers: [dossier(), dossier({ id: "d2", flujo: { version: 1, ruta: "captacion", estado: "descartada", motivo: "", requisitos: {} } as TodayDossier["flujo"] })], contracts: [
      { expedienteId: "d1", folio: "EXP-1", emitido: false, fin: "2026-11-01", exclusiva: false },
      { expedienteId: "d2", folio: "EXP-2", emitido: true, fin: "2026-11-01", exclusiva: false },
    ] })).toEqual([]);
    expect(expiryItems({ today, names, dossiers: [dossier()], contracts: [{ expedienteId: "d1", folio: "EXP-1", emitido: true, fin: "2027-03-01", exclusiva: false }] })).toEqual([]);
  });
});

test("prospectos por canal: el capturado manda y el sitio se deduce del formulario", () => {
  const rows = channelMetrics([lead({ canal: "referido", estado: "contactado" }), lead({ id: "b", origen: "contacto" }), lead({ id: "c", origen: "evaluar", firstContactedAt: "2026-10-21T10:00:00Z", estado: "descartado" }), lead({ id: "d" })]);
  expect(rows.map(r => [r.label, r.recibidos, r.atendidos, r.descartados])).toEqual([["Sitio web", 2, 1, 1], ["Referido", 1, 1, 0], ["Sin dato", 1, 0, 0]]);
});

test("se prestan llaves, se registra su regreso y se registra un aviso al comprador", async () => {
  const writes: Array<Record<string, unknown>> = [];
  let property: AdminProperty = house({ slug: "casa", galeria: [{ src: "/a.jpg", alt: "" }] });
  let version = 1;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") { const body = JSON.parse(String(init.body)); writes.push(body.data); property = body.data; version += 1; return Response.json({ record: { id: "casa", data: property, version } }); }
    if (url.endsWith("/propiedades")) return Response.json({ records: [{ id: "casa", data: property, version }] });
    if (url.endsWith("/leads")) return Response.json({ records: [{ id: "lead1", data: lead({ tipoPropiedad: "casa", zona: "Playas", perfil: { operacion: "comprar" } }), version: 1 }] });
    return Response.json({ records: [] });
  });
  render(<PropertyFollowup slug="casa" />);
  const keys = within(await screen.findByRole("region", { name: "Llaves" }));
  fireEvent.change(keys.getByLabelText("Quién se las lleva"), { target: { value: "Beto Soto" } });
  fireEvent.change(keys.getByLabelText("Para qué"), { target: { value: "Visita con comprador" } });
  fireEvent.click(keys.getByRole("button", { name: "Prestar llaves" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).toMatchObject({ llaves: { prestamos: [{ persona: "Beto Soto", motivo: "Visita con comprador" }] } });
  fireEvent.click(await keys.findByRole("button", { name: "Registrar que Beto Soto regresó las llaves" }));
  await waitFor(() => expect(writes).toHaveLength(2));
  expect((writes[1].llaves as { prestamos: Array<{ regreso?: string }> }).prestamos[0].regreso).toBeTruthy();

  const buyers = within(screen.getByRole("region", { name: "Compradores que podrían interesarse" }));
  expect(await buyers.findByText("Ana Ruiz")).toBeTruthy();
  expect(buyers.getByRole("link", { name: "Escribir por WhatsApp a Ana Ruiz" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/526641234567\?text=Hola%20Ana/);
  fireEvent.click(buyers.getByRole("button", { name: "Registrar que ya le avisaste a Ana Ruiz" }));
  await waitFor(() => expect(writes).toHaveLength(3));
  expect(writes[2]).toMatchObject({ avisosCompradores: [{ personaId: "lead1", tipo: "lead", medio: "whatsapp" }] });
  expect(await buyers.findByText("Avisado")).toBeTruthy();
});
