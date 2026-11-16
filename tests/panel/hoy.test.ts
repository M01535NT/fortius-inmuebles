import { expect, test } from "vitest";

import type { Lead } from "@/lib/domain/records";
import { resumenEspera, saludo, vencimientosDeContratos, type ContratoServidor } from "@/lib/panel/datos/hoy";

const HOY = new Date(2026, 10, 16);
const c = (o: Partial<ContratoServidor>): ContratoServidor => ({ expedienteId: "x1", folio: "EXP-000001", emitido: true, exclusiva: true, ...o });

test("PN-04 hoy: avisa fin de encargo y licencia dentro de 30 días, de lo vencido a lo lejano", () => {
  const lista = vencimientosDeContratos([
    c({ fin: "2026-11-20" }),
    c({ expedienteId: "x2", folio: "EXP-000002", fin: "2026-11-10", emitido: false }),
    c({ expedienteId: "x3", folio: "EXP-000003", fin: "2027-03-01", licencia: { vigencia: "2026-11-17" } }),
  ], HOY);
  expect(lista.map((v) => v.titulo)).toEqual(["Fin del encargo · EXP-000002", "Licencia estatal", "Fin del encargo · EXP-000001"]);
  expect(lista[0]).toMatchObject({ tono: "error", detalle: "Venció hace 6 días · contrato sin emitir" });
  expect(lista[1]).toMatchObject({ tono: "aviso", detalle: "Vence mañana · la usa 1 contrato" });
  expect(lista[2].detalle).toBe("Vence el viernes 20 nov (en 4 días)");
});

test("PN-04 hoy: la licencia estatal se avisa una sola vez aunque la usen varios contratos (AUD-03, H2)", () => {
  const licencia = { numero: "BC-123", vigencia: "2026-11-25" };
  const lista = vencimientosDeContratos([
    c({ licencia }), c({ expedienteId: "x2", folio: "EXP-000002", licencia }), c({ expedienteId: "x3", folio: "EXP-000003", licencia }),
  ], HOY);
  expect(lista).toHaveLength(1);
  expect(lista[0]).toMatchObject({ titulo: "Licencia estatal BC-123", detalle: "Vence el miércoles 25 nov (en 9 días) · la usan 3 contratos" });
});

test("PN-04 hoy: cuenta las consultas por atender y nombra la que más espera (AUD-03, H3)", () => {
  const ahora = Date.parse("2026-11-16T12:00:00Z");
  const lead = (id: string, estado: Lead["estado"], creadoEl: string) => ({ id, estado, creadoEl, nombre: id, telefono: "" }) as unknown as Lead;
  const r = resumenEspera([
    lead("a", "nuevo", "2026-11-16T11:30:00Z"),
    lead("b", "nuevo", "2026-11-16T09:00:00Z"),
    lead("c", "descartado", "2026-11-01T09:00:00Z"),
  ], ahora);
  expect(r.cuantas).toBe(2);
  expect(r.peor).toBe("3 horas");
  expect(r.urgencia).toBe("error");
  expect(resumenEspera([], ahora)).toEqual({ cuantas: 0, peor: null, urgencia: "normal" });
});

test("PN-04 hoy: el saludo cambia con la hora", () => {
  expect(saludo(3)).toBe("Buenas noches");
  expect(saludo(6)).toBe("Buenos días");
  expect(saludo(8)).toBe("Buenos días");
  expect(saludo(15)).toBe("Buenas tardes");
  expect(saludo(21)).toBe("Buenas noches");
});
