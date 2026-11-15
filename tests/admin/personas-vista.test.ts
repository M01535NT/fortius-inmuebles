import { describe, expect, it } from "vitest";
import { canalPreferido, diaLocal, faltante, grupoDe, parecidas, prospectoNuevo } from "@/lib/admin/personas-vista";

/* LV-10e · Personas como agenda: a quién le toca hoy, esta semana, después o sin fecha. */
it("agrupa por la fecha del siguiente paso, con hora o sin ella", () => {
  const hoy = "2026-11-14";
  expect(grupoDe("2026-11-02", hoy)).toBe("toca");
  expect(grupoDe("2026-11-14 11:00", hoy)).toBe("toca");
  expect(grupoDe("2026-11-15", hoy)).toBe("semana");
  expect(grupoDe("2026-11-20 09:30", hoy)).toBe("semana");
  expect(grupoDe("2026-11-21", hoy)).toBe("despues");
  expect(grupoDe("9999", hoy)).toBe("sinFecha");
});

it("una marca de tiempo cuenta en el día de Tijuana", () => {
  expect(diaLocal("2026-11-15T05:00:00Z")).toBe("2026-11-14");
  expect(diaLocal("2026-11-15")).toBe("2026-11-15");
});

describe("Nuevo perfil (FLX-01)", () => {
  const base = { nombre: "Ejemplo Soto", telefono: "6645550100", email: "", motivo: "comprar" as const, detalle: "", canal: "llamada" as const, acuerdo: "Enviarle opciones", fecha: "2026-11-16", privacidad: true };
  it("pide nombre, teléfono, motivo y en qué quedaron; el correo solo si lo prefiere", () => {
    expect(faltante(base)).toBeNull();
    expect(faltante({ ...base, telefono: "664" })?.campo).toBe("telefono");
    expect(faltante({ ...base, motivo: "" })?.campo).toBe("motivo");
    expect(faltante({ ...base, canal: "correo" })?.campo).toBe("email");
    expect(faltante({ ...base, canal: "correo", email: "e@ejemplo.mx" })).toBeNull();
    expect(faltante({ ...base, acuerdo: " " })?.campo).toBe("acuerdo");
  });
  it("avisa por teléfono (últimos diez dígitos) o por nombre completo sin acentos", () => {
    const gente = [{ id: "1", nombre: "José Pérez", telefono: "+52 664 555 0100" }, { id: "2", nombre: "Ana", telefono: "" }];
    expect(parecidas(gente, "Otro", "664-555-0100").map(p => [p.id, p.por])).toEqual([["1", "teléfono"]]);
    expect(parecidas(gente, "jose perez", "").map(p => p.por)).toEqual(["nombre"]);
    expect(parecidas(gente, "Ana", "")).toEqual([]);
  });
  it("arma un prospecto contactado con su motivo, canal preferido y próximo contacto", () => {
    const lead = prospectoNuevo(base, { id: "l1", nota: "n1" }, "2026-11-14T18:00:00.000Z", "a1");
    expect(lead).toMatchObject({ id: "l1", estado: "contactado", origen: "manual", asesorId: "a1", firstContactedAt: "2026-11-14T18:00:00.000Z",
      perfil: { operacion: "comprar", canalPreferido: "llamada", proximoContacto: "2026-11-16", proximaAccion: "Enviarle opciones", avisoPrivacidad: "2026-11-14" } });
    expect(canalPreferido(lead.perfil)).toBe("llamada");
    expect(canalPreferido({ canalPreferido: "fax" })).toBeUndefined();
  });
});

describe("Inmuebles de su interés", () => {
  it("lee la lista sin repetir ni basura, agrega al final sin duplicar y quita", async () => {
    const { interesDe, conInteres, sinInteres, TOPE_INTERES } = await import("@/lib/admin/personas-vista");
    expect(interesDe({ inmueblesInteres: ["a", "a", "", 3, "b"] })).toEqual(["a", "b"]);
    expect(interesDe(undefined)).toEqual([]);
    expect(conInteres({ inmueblesInteres: ["a", "b"] }, "a")).toEqual(["b", "a"]);
    expect(conInteres({ inmueblesInteres: Array.from({ length: TOPE_INTERES }, (_, i) => `x${i}`) }, "nuevo")).toHaveLength(TOPE_INTERES);
    expect(sinInteres({ inmueblesInteres: ["a", "b"] }, "a")).toEqual(["b"]);
  });
});
