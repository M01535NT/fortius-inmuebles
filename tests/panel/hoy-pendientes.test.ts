import { describe, expect, it } from "vitest";

import type { Cliente } from "@/lib/backend/contracts";
import type { Expediente, FilaAsunto } from "@/lib/panel/datos/asuntos";
import type { Cobro } from "@/lib/panel/datos/dinero";
import { rutaTramite, teDeben, tonoTramite, tramitesDeHoy } from "@/lib/panel/datos/hoy-pendientes";
import { nuevoTramite, type Tramite } from "@/lib/tramites";

const HOY = "2026-11-16";
const tramite = (id: string, titulo: string, cambios: Partial<Tramite> = {}): Tramite =>
  ({ ...nuevoTramite({ id, acreedor: "infonavit", titulo, clienteId: "c1", asesorId: "a1" }), ...cambios });
const espera = (volver: string) => ({ quien: "Infonavit", desde: "2026-11-01", volver });
const ana = { id: "c1", nombre: "Ana López" } as Cliente;

describe("tramitesDeHoy", () => {
  const lista = [
    tramite("t1", "Casa Otay", { espera: espera("2026-11-16") }),
    tramite("t2", "Depto Centro", { espera: espera("2026-11-10") }),
    tramite("t3", "Lote Playas", { espera: espera("2026-11-20") }),
    tramite("t4", "Sin espera"),
    tramite("t5", "Terminado", { estado: "terminado", espera: espera("2026-11-01") }),
  ];
  it("solo los que esperan respuesta hoy o antes, lo más atrasado primero", () => {
    expect(tramitesDeHoy(lista, [ana], HOY).map((f) => f.id)).toEqual(["t2", "t1"]);
  });
  it("cada fila dice a quién preguntar y nombra a la persona", () => {
    const [atrasado, deHoy] = tramitesDeHoy(lista, [ana], HOY);
    expect(atrasado.estado).toMatch(/^Preguntar a Infonavit \(desde el /);
    expect(deHoy.estado).toBe("Preguntar a Infonavit");
    expect(deHoy.linea).toContain("Ana López");
  });
  it("rojo si ya tocaba antes de hoy; aviso si toca hoy", () => {
    expect(tonoTramite({ espera: espera("2026-11-10") }, HOY)).toBe("error");
    expect(tonoTramite({ espera: espera(HOY) }, HOY)).toBe("aviso");
  });
  it("enlaza a la ficha del trámite", () => {
    expect(rutaTramite("t 1")).toBe("/admin/tramites?ver=t%201");
  });
});

describe("teDeben", () => {
  const exp = (id: string, comision?: number) => ({ id, etapa: "cierre", folio: id, flujo: { version: 1, ruta: "captacion", estado: "activa", motivo: "", requisitos: {}, ...(comision ? { cierre: { capto: "a", vendio: "a", comisionEstimada: comision } } : {}) } }) as unknown as Expediente;
  const cobro = (expedienteId: string, importe: number): Cobro => ({ id: `r-${expedienteId}`, expedienteId, numero: "", fecha: null, importe, moneda: "MXN", medio: "", concepto: "", parcial: true, emitido: true });
  it("suma lo que falta y cuenta los asuntos", () => {
    expect(teDeben([exp("1", 1000), exp("2", 500), exp("3")], [] as FilaAsunto[], [cobro("1", 400)])).toEqual({ total: 1100, asuntos: 2 });
  });
  it("null cuando no se debe nada", () => {
    expect(teDeben([exp("1", 1000)], [], [cobro("1", 1000)])).toBeNull();
    expect(teDeben([], [], [])).toBeNull();
  });
});
