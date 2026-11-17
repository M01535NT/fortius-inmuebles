import { describe, expect, it } from "vitest";

import type { Evento } from "@/lib/domain/records";
import { aHoraGuardada, datosDeCita, deHoraGuardada, editarCita, nuevaCita, seEmpalma, tituloCita, type DatosCita } from "@/lib/panel/datos/agenda-acciones";

const base: DatosCita = { tipo: "visita", titulo: "", fecha: "2026-11-20", hora: 10 * 60, clienteId: "c1", propiedadSlug: "casa", notas: "", asesorId: "a1" };

describe("Escribir en la Agenda (PN-04)", () => {
  it("guarda la hora como HH:mm y la lee de vuelta", () => {
    expect(aHoraGuardada(9 * 60 + 30)).toBe("09:30");
    expect(deHoraGuardada("09:30")).toBe(570);
    expect(deHoraGuardada(undefined)).toBeNull();
  });
  it("arma el título con el tipo y la persona si no se escribe", () => {
    expect(tituloCita({ tipo: "visita", titulo: "" }, "Ana")).toBe("Visita con Ana");
    expect(tituloCita({ tipo: "llamada", titulo: "" })).toBe("Llamada");
    expect(tituloCita({ tipo: "firma", titulo: "  Firma en notaría 5 " }, "Ana")).toBe("Firma en notaría 5");
  });
  it("nueva cita sin campos vacíos; editar quita lo que se borró", () => {
    const n = nuevaCita(base, "Ana", "e1");
    expect(n).toEqual({ id: "e1", titulo: "Visita con Ana", fecha: "2026-11-20", tipo: "visita", hora: "10:00", clienteId: "c1", propiedadSlug: "casa", asesorId: "a1" });
    const e = editarCita(n, { ...datosDeCita(n), hora: null, propiedadSlug: "", notas: "Llevar llaves" });
    expect(e.hora).toBeUndefined();
    expect(e.propiedadSlug).toBeUndefined();
    expect(e.notas).toBe("Llevar llaves");
    expect(e.titulo).toBe("Visita con Ana");
  });
  it("avisa del empalme sin impedirlo", () => {
    const otra: Evento = { id: "x", titulo: "Firma de ejemplo", fecha: "2026-11-20", hora: "10:30", tipo: "firma", asesorId: "a1" };
    expect(seEmpalma(nuevaCita(base, "Ana", "e1"), [otra])).toBe("Se empalma con «Firma de ejemplo» a las 10:30.");
    expect(seEmpalma(nuevaCita({ ...base, hora: 12 * 60 }, "Ana", "e1"), [otra])).toBeNull();
  });
});
