import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { matchReasons, zoneKey, zoneTokens, type Seeker } from "@/lib/admin/buyer-matches";
import { captureHref, demandGroups, unmetSeekers, waitingFor } from "@/lib/admin/demand";
import { DemandView, budgetText, groupTitle } from "@/components/admin/properties/demand-view";
import type { AdminProperty } from "@/lib/admin/store";
import { propiedades } from "../fixtures/propiedades";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams(), usePathname: () => "/admin/propiedades" }));
afterEach(cleanup);

// Datos ficticios de ensayo (COR-19).
const house = (over: Partial<AdminProperty> = {}): AdminProperty => ({ ...propiedades[0], slug: "casa-playas", titulo: "Casa en Playas", tipo: "casa", operacion: "venta", estado: "disponible", publicada: true, zona: "Playas de Tijuana", direccionAproximada: "Cerca del malecón", precio: { modalidad: "publico", monto: 4_000_000, moneda: "MXN" }, ficha: {}, demo: true, ...over });
const seeker = (id: string, over: Partial<Seeker> = {}): Seeker => ({ id, kind: "lead", nombre: `Interesado ${id}`, telefono: "6640000000", href: `/admin/leads/${id}`, tipoPropiedad: "casa", zona: "Lomas Virreyes", perfil: { operacion: "comprar", presupuestoMax: 5_000_000, moneda: "MXN" }, ...over });

test("la zona se compara sin acentos ni «de»: «Lomas Virreyes» es «Lomas de Virreyes»", () => {
  expect(zoneKey("Lomas de Virreyes")).toBe(zoneKey("Lomas Virreyes"));
  expect(zoneKey("Colonia Juárez, del Río")).toBe("colonia juarez rio");
  expect(zoneTokens("Playas, Otay y Chapultepec")).toEqual(["playas", "otay", "chapultepec"]);
  expect(matchReasons(house({ zona: "Lomas de Virreyes" }), seeker("a"))).toEqual(["Busca casa", "Busca en Lomas Virreyes", "Dentro de su presupuesto"]);
});

test("agrupa a quien busca y no tiene inmueble que le sirva, con cuántos son y su presupuesto por moneda", () => {
  const people = [
    seeker("a"), seeker("b", { zona: "Lomas de Virreyes", perfil: { operacion: "invertir", presupuestoMax: 3_000_000, moneda: "MXN" } }),
    seeker("c", { perfil: { operacion: "comprar", presupuestoMax: 250_000, moneda: "USD" } }),
    seeker("d", { zona: "Playas" }), // le sirve la casa publicada en Playas
    seeker("e", { tipoPropiedad: "departamento", zona: "Otay, Chapultepec", perfil: { operacion: "rentar" } }),
    seeker("f", { perfil: { operacion: "vender" } }),
  ];
  expect(unmetSeekers(people, [house()]).map(s => s.id)).toEqual(["a", "b", "c", "e"]);
  const groups = demandGroups(people, [house()]);
  expect(groups.map(g => [g.key, g.seekers.length])).toEqual([["comprar|casa|lomas virreyes", 3], ["rentar|departamento|chapultepec", 1], ["rentar|departamento|otay", 1]]);
  expect(groups[0].budgets).toEqual([{ moneda: "MXN", min: 3_000_000, max: 5_000_000 }, { moneda: "USD", min: 250_000, max: 250_000 }]);
  expect(groupTitle(groups[0])).toBe("Casa en venta · Lomas Virreyes");
  expect(budgetText(groups[0])).toBe("de $3,000,000 MXN a $5,000,000 MXN · hasta $250,000 USD");
  expect(budgetText(groups[1])).toBe("Sin presupuesto dicho");
  // Apartada o sin publicar no cubre la demanda.
  expect(demandGroups([seeker("d", { zona: "Playas" })], [house({ estado: "apartada" })])).toHaveLength(1);
});

test("captar para ese perfil abre la operación del propietario con zona y tipo", () => {
  expect(captureHref({ intent: "comprar", tipo: "casa", zona: "Lomas Virreyes" })).toBe("/admin/operaciones/nueva?intencion=vender&zona=Lomas+Virreyes&tipo=casa");
  expect(captureHref({ intent: "rentar" })).toBe("/admin/operaciones/nueva?intencion=arrendar");
});

test("cuenta quién espera un inmueble como el que se capta", () => {
  const people = [seeker("a"), seeker("b", { tipoPropiedad: undefined }), seeker("c", { tipoPropiedad: "terreno" }), seeker("d", { perfil: { operacion: "rentar" } }), seeker("e", { zona: "Otay" })];
  expect(waitingFor({ intent: "comprar", tipo: "casa", zona: "Lomas de Virreyes, Tijuana" }, people).map(s => s.id)).toEqual(["a", "b"]);
  expect(waitingFor({ intent: "comprar", tipo: "casa" }, people)).toEqual([]);
});

test("la vista muestra cada grupo con su liga para captar", () => {
  render(<DemandView groups={demandGroups([seeker("a"), seeker("b")], [])} />);
  expect(screen.getByText("Casa en venta · Lomas Virreyes")).toBeTruthy();
  expect(screen.getByText(/2 interesados/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Captar inmueble para este perfil" }).getAttribute("href")).toBe("/admin/operaciones/nueva?intencion=vender&zona=Lomas+Virreyes&tipo=casa");
  cleanup();
  render(<DemandView groups={[]} />);
  expect(screen.getByText("Nadie espera algo que no tengamos")).toBeTruthy();
});
