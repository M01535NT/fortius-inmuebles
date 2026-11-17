import { expect, test } from "vitest";

import {
  alcanceDe, crearInvitacion, escribirOrdenEquipo, fichasParaInvitar, normalizarCorreo, ordenEquipoGuardado, papelDeCuenta,
  resumenInvitacion, validarInvitacion,
} from "@/lib/panel/datos/configuracion-invitaciones";

const borrador = (correo: string) => ({ correo, papel: "asesor" as const, asesorId: "" });

test("PN-09 invitar: correo válido, sin cuenta y sin repetir", () => {
  const cuentas = [{ email: "Ana@Fortius.mx" }];
  const preparadas = [{ correo: "luis@ejemplo.com" }];
  expect(validarInvitacion(borrador("  "), cuentas, preparadas)).toMatch(/Escribe/);
  expect(validarInvitacion(borrador("ana@fortius"), cuentas, preparadas)).toMatch(/Revisa/);
  expect(validarInvitacion(borrador(" ana@fortius.MX "), cuentas, preparadas)).toMatch(/ya tiene cuenta/);
  expect(validarInvitacion(borrador("LUIS@ejemplo.com"), cuentas, preparadas)).toMatch(/Ya hay/);
  expect(validarInvitacion(borrador("nueva@ejemplo.com"), cuentas, preparadas)).toBeNull();
  expect(normalizarCorreo(" A@B.Co ")).toBe("a@b.co");
});

test("PN-09 invitar: un director no lleva ficha de asesor", () => {
  const ahora = new Date("2026-11-16T18:00:00Z");
  expect(crearInvitacion({ correo: "D@x.mx", papel: "director", asesorId: "a1" }, ahora)).toEqual({ correo: "d@x.mx", papel: "director", asesorId: null, preparada: ahora.toISOString() });
  expect(crearInvitacion({ correo: "a@x.mx", papel: "asesor", asesorId: "a1" }, ahora).asesorId).toBe("a1");
  const nombre = (id: string) => (id === "a1" ? "Mariana" : undefined);
  expect(resumenInvitacion({ papel: "director", asesorId: null }, nombre)).toBe("Director · ve todo");
  expect(resumenInvitacion({ papel: "asesor", asesorId: "a1" }, nombre)).toBe("Asesor · entra como Mariana");
  expect(resumenInvitacion({ papel: "asesor", asesorId: null }, nombre)).toBe("Asesor · sin ficha todavía");
});

test("PN-09 invitar: solo fichas activas, sin cuenta y sin invitación", () => {
  const fichas = [
    { id: "a1", nombre: "Zoe" }, { id: "a2", nombre: "Ana" }, { id: "a3", nombre: "Beto", activo: false }, { id: "a4", nombre: "Carla" },
  ];
  expect(fichasParaInvitar(fichas, new Set(["a4"]), [{ asesorId: "a1" }, { asesorId: null }]).map((f) => f.id)).toEqual(["a2"]);
});

test("PN-09 papeles: el director ve todo, el asesor solo lo suyo", () => {
  expect(papelDeCuenta({ role: "admin" })).toBe("director");
  expect(papelDeCuenta({ role: "editor" })).toBe("asesor");
  expect(alcanceDe({ role: "admin", active: true })).toBe("Ve todo");
  expect(alcanceDe({ role: "editor", active: true })).toBe("Ve solo lo suyo");
  expect(alcanceDe({ role: "admin", active: false })).toBe("No puede entrar");
});

test("PN-09 orden del equipo: lo guardado manda, lo nuevo va al final y lo dañado se ignora", () => {
  const base = [{ id: "a" }, { id: "b" }, { id: "c" }];
  expect(ordenEquipoGuardado(base, escribirOrdenEquipo([{ id: "c" }, { id: "x" }, { id: "a" }])).map((x) => x.id)).toEqual(["c", "a", "b"]);
  expect(ordenEquipoGuardado(base, "{roto").map((x) => x.id)).toEqual(["a", "b", "c"]);
});
