import { describe, expect, it } from "vitest";

import type { Cliente } from "@/lib/backend/contracts";
import { avisosDeDatos, buscarDuplicado, claveTelefono, datosDe, editarPersona, faltaParaEditar, faltaParaPersona, nuevaPersona } from "@/lib/panel/datos/personas-acciones";

const base: Cliente = { id: "c1", nombre: "Persona de ejemplo", telefono: "+52 664 123 4567", email: "Ejemplo@Correo.test", tipo: "comprador", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" };
const ahora = new Date("2026-11-16T18:00:00Z");

describe("alta de personas (PN-03)", () => {
  it("pide lo mínimo y dice qué falta, en orden", () => {
    const d = { nombre: "", telefono: "", email: "", accion: "" };
    expect(faltaParaPersona(d)?.campo).toBe("nombre");
    expect(faltaParaPersona({ ...d, nombre: "Ana" })?.campo).toBe("telefono");
    expect(faltaParaPersona({ ...d, nombre: "Ana", telefono: "664 123 45 67", email: "mal" })?.campo).toBe("email");
    expect(faltaParaPersona({ ...d, nombre: "Ana", telefono: "664 123 45 67" })?.campo).toBe("accion");
    expect(faltaParaPersona({ ...d, nombre: "Ana", telefono: "664 123 45 67", accion: "Mandar opciones" })).toBeNull();
  });
  it("crea la persona a nombre de quien la anota, con su motivo, canal y siguiente paso", () => {
    const p = nuevaPersona({ nombre: "  Ana   López ", telefono: "6641234567", email: "", motivo: "vende", canal: "llamada", accion: "Pasar a ver la casa", fecha: "2026-11-17" }, "as-a", ahora);
    expect(p).toMatchObject({ nombre: "Ana López", tipo: "propietario", asesorId: "as-a", perfil: { canalPreferido: "llamada", proximaAccion: "Pasar a ver la casa", proximoContacto: "2026-11-17" } });
    expect(p.email).toBeUndefined();
    expect(nuevaPersona({ nombre: "B", telefono: "6641234567", email: "", motivo: "otro", canal: "correo", accion: "x", fecha: null }, null, ahora).asesorId).toBeUndefined();
  });
  it("avisa del duplicado por teléfono (sin importar +52 ni espacios) o por correo", () => {
    expect(claveTelefono("+52 (664) 123-4567")).toBe("6641234567");
    expect(buscarDuplicado([base], { telefono: "664 123 4567" })?.id).toBe("c1");
    expect(buscarDuplicado([base], { email: "ejemplo@correo.test " })?.id).toBe("c1");
    expect(buscarDuplicado([base], { telefono: "664 123" })).toBeNull();
    expect(buscarDuplicado([base], { telefono: "6641234567" }, "c1")).toBeNull();
  });
});

describe("editar datos (PN-03)", () => {
  it("guarda contacto y datos para contratos; vacío quita el dato y CURP y RFC van en mayúsculas", () => {
    const d = { ...datosDe(base), email: "", curp: "lopa800101hbcxxx09", rfc: "lopa800101ab1", estadoCivil: "Soltera", canal: "whatsapp" as const, motivo: "renta" as const };
    const e = editarPersona(base, d, ahora);
    expect(e).toMatchObject({ curp: "LOPA800101HBCXXX09", rfc: "LOPA800101AB1", estadoCivil: "Soltera", tipo: "arrendatario", perfil: { canalPreferido: "whatsapp" } });
    expect(e.email).toBeUndefined();
    expect(e.creadoEl).toBe(base.creadoEl);
  });
  it("cuenta caracteres de CURP y RFC y acepta solo correo como contacto", () => {
    expect(avisosDeDatos({ curp: "ABC", rfc: "" }).curp).toMatch(/18.*3/);
    expect(avisosDeDatos({ curp: "", rfc: "ABC123456AB1" })).toEqual({});
    expect(faltaParaEditar({ nombre: "Ana", telefono: "", email: "ana@correo.test" })).toBeNull();
    expect(faltaParaEditar({ nombre: "Ana", telefono: "", email: "" })?.campo).toBe("telefono");
  });
});
