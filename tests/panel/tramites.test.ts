import { describe, expect, it } from "vitest";

import type { Cliente } from "@/lib/backend/contracts";
import { alternarPendiente, anotarTramite, cerrarPaso, faltanDelPaso, filaTramite, grupoDe, ordenarTramites, ponerEnEspera, yaRespondieron } from "@/lib/panel/datos/tramites";
import { nuevoTramite, type Tramite } from "@/lib/tramites";

const base = (extra: Partial<Tramite> = {}): Tramite => ({ ...nuevoTramite({ id: "t1", acreedor: "infonavit", titulo: "Casa de ejemplo", clienteId: "c1", asesorId: "a1" }), ...extra });
const personas = [{ id: "c1", nombre: "Ana Ejemplo" } as Cliente];

describe("Trámites (PN-07)", () => {
  it("agrupa por lo que toca", () => {
    expect(grupoDe(base(), "2026-11-16")).toBe("en_curso");
    expect(grupoDe(base({ espera: { quien: "Registro", desde: "2026-11-10", volver: "2026-11-16" } }), "2026-11-16")).toBe("hoy");
    expect(grupoDe(base({ espera: { quien: "Registro", desde: "2026-11-10", volver: "2026-11-20" } }), "2026-11-16")).toBe("esperando");
    expect(grupoDe(base({ estado: "cancelado" }), "2026-11-16")).toBe("listo");
    const f = filaTramite(base({ espera: { quien: "Registro", desde: "2026-11-10", volver: "2026-11-20" } }), personas, "2026-11-16");
    expect(f.estado).toBe("Espera a Registro · faltan 4 días");
    expect(f.linea).toBe("Cancelación de hipoteca · Infonavit · Ana Ejemplo");
  });
  it("ordena hoy, esperando y en curso", () => {
    const ts = [base({ id: "a" }), base({ id: "b", espera: { quien: "X", desde: "2026-11-01", volver: "2026-11-01" } })];
    expect(ordenarTramites(ts.map((t) => filaTramite(t, personas, "2026-11-16")), ts).map((f) => f.id)).toEqual(["b", "a"]);
  });
  it("cierra el paso aunque falten pendientes (DEC-61) y no escribe historial (lo hace la base)", () => {
    const t = base();
    expect(cerrarPaso(t, [])?.pasoActual).toBe(1);
    const listo = t.pasos[0].pendientes.reduce((x, p) => alternarPendiente(x, p.id), t);
    const c = cerrarPaso(listo, []);
    expect(c?.pasoActual).toBe(1);
    expect(c?.notas).toEqual([]);
  });
  it("el paso con documento se cierra también sin él (DEC-61); lo que falta se avisa", () => {
    const t = base({ pasoActual: 1 });
    const hecho = t.pasos[1].pendientes.reduce((x, p) => alternarPendiente(x, p.id), t);
    expect(cerrarPaso(hecho, [])?.pasoActual).toBe(2);
    expect(faltanDelPaso(hecho, []).some((f) => f.startsWith("Subir:"))).toBe(true);
    expect(cerrarPaso(hecho, [{ pasoClave: "liquidado" }])?.pasoActual).toBe(2);
  });
  it("espera, respuesta y notas solo agregan notas de tipo nota", () => {
    const e = ponerEnEspera(base(), " Registro Público ", "2026-11-20", "2026-11-16");
    expect(e.espera).toEqual({ quien: "Registro Público", desde: "2026-11-16", volver: "2026-11-20" });
    expect(e.notas).toEqual([]);
    expect(yaRespondieron(e, "").notas).toEqual([]);
    expect(yaRespondieron(e, "Lo tienen el lunes").notas[0]).toMatchObject({ tipo: "nota", texto: "Respondió Registro Público: Lo tienen el lunes" });
    expect(anotarTramite(base(), " Llamar al notario ").notas[0]).toMatchObject({ tipo: "nota", texto: "Llamar al notario" });
  });
});
