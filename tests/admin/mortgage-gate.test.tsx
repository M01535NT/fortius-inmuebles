import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { nuevoTramite, type Tramite } from "@/lib/tramites";
import { esFrenoDeFirma } from "@/lib/admin/tramite-firma";

/* TRA-01 · en la etapa de una venta, la hipoteca pendiente se avisa con la liga al trámite (desde FLX-03 no frena). */
const data = vi.hoisted(() => ({ tramites: [] as unknown[] }));
vi.mock("@/lib/admin/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/admin/store")>();
  return { ...actual, useCollection: (col: unknown) => col === actual.db.tramites ? data.tramites : [] };
});
import { MortgageGateNotice } from "@/components/admin/operation/mortgage-gate";

const OP = "11111111-1111-4111-8111-111111111111";
const tramite = (extra: Partial<Tramite> = {}): Tramite => ({ ...nuevoTramite({ id: "tr-1", acreedor: "banco", titulo: "Casa de ejemplo", clienteId: "cli-1", asesorId: "a1", expedienteId: OP }), pasoActual: 4, ...extra });
afterEach(cleanup);

test("el mensaje del servidor se reconoce", () => {
  expect(esFrenoDeFirma("Antes de la firma: la cancelación de hipoteca de esta venta debe quedar inscrita en el Registro Público. Si se firma sin ella, lo decide el director en el trámite, con su motivo.")).toBe(true);
  expect(esFrenoDeFirma("Antes de avanzar: falta la 02")).toBe(false);
});

test("antes de la firma avisa con la liga al trámite ligado y el paso en que va", () => {
  data.tramites = [tramite()];
  render(<MortgageGateNotice operationId={OP} operacion="venta" stage="negociacion" next="cierre" blocked={false} />);
  expect(screen.getByText("La firma espera la cancelación de hipoteca")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Abrir el trámite" }).getAttribute("href")).toBe("/admin-anterior/tramites?id=tr-1");
  expect(screen.getByText(/Casa de ejemplo: va en/)).toBeTruthy();
  // FLX-03: no frena; dice que se puede pasar y que queda anotado.
  expect(screen.getByText(/Puedes pasar a la firma; quedará anotado en el historial/)).toBeTruthy();
});

test("si el asesor no ve el trámite y el servidor frenó, lleva a la lista de trámites", () => {
  data.tramites = [];
  render(<MortgageGateNotice operationId={OP} operacion="venta" stage="negociacion" next="cierre" blocked />);
  expect(screen.getByRole("link", { name: "Ver los trámites" }).getAttribute("href")).toBe("/admin-anterior/tramites");
});

test("no avisa en renta, lejos de la firma, ni con la cancelación inscrita", () => {
  data.tramites = [tramite()];
  const { rerender } = render(<MortgageGateNotice operationId={OP} operacion="renta" stage="negociacion" next="cierre" blocked={false} />);
  expect(screen.queryByText(/La firma espera/)).toBeNull();
  rerender(<MortgageGateNotice operationId={OP} operacion="venta" stage="documentacion" next="comercializacion" blocked={false} />);
  expect(screen.queryByText(/La firma espera/)).toBeNull();
  data.tramites = [tramite({ pasoActual: 6 })];
  rerender(<MortgageGateNotice operationId={OP} operacion="venta" stage="negociacion" next="cierre" blocked={false} />);
  expect(screen.queryByText(/La firma espera/)).toBeNull();
});

test("con la decisión del director lo dice con su motivo", () => {
  data.tramites = [tramite({ firmaSinCancelacion: { motivo: "El comprador paga de contado", autorizadoPor: "u1", autorizadoEl: "2026-11-14T18:00:00Z" } })];
  render(<MortgageGateNotice operationId={OP} operacion="venta" stage="negociacion" next="cierre" blocked={false} />);
  expect(screen.getByText("Se firma sin la cancelación inscrita")).toBeTruthy();
  expect(screen.getByText(/El director lo autorizó el 14 de noviembre: El comprador paga de contado/)).toBeTruthy();
});
