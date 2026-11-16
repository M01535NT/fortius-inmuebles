import { expect, test } from "vitest";

import type { Asesor } from "@/lib/domain/records";
import {
  aplicarPerfil, AVISOS_POR_OMISION, escribirAvisos, fichaAsesor, fotoDe, inicialesDe, leerAvisos, ordenarEquipo,
  perfilCambio, temaAGuardar, temaValido, validarPerfil,
} from "@/lib/panel/datos/configuracion";
import { conFicha, cuentasParaLigar, cuentasValidas, rolDe, unirCuentas, type Cuenta } from "@/lib/panel/datos/configuracion-cuentas";

const asesor = (d: Partial<Asesor> = {}): Asesor => ({ id: "a1", nombre: "Mariana Estrada", cargo: "Asesora", iniciales: "ME", activo: true, ...d });

test("PN-09 apariencia: lo desconocido es automático y automático no se guarda", () => {
  expect(temaValido("dark")).toBe("dark");
  expect(temaValido("rosa")).toBe("auto");
  expect(temaAGuardar("auto")).toBeNull();
  expect(temaAGuardar("light")).toBe("light");
});

test("PN-09 avisos: guardado dañado o parcial vuelve a lo de por omisión", () => {
  expect(leerAvisos(null)).toEqual(AVISOS_POR_OMISION);
  expect(leerAvisos("{no es json")).toEqual(AVISOS_POR_OMISION);
  expect(leerAvisos('{"citas":false,"otro":true,"consultas":"si"}')).toEqual({ ...AVISOS_POR_OMISION, citas: false });
  const p = { ...AVISOS_POR_OMISION, vencimientos: false };
  expect(leerAvisos(escribirAvisos(p))).toEqual(p);
});

test("PN-09 perfil: nombre obligatorio y teléfono con al menos 7 dígitos", () => {
  expect(validarPerfil({ nombre: "  ", telefono: "" })).toEqual({ nombre: "Escribe tu nombre." });
  expect(validarPerfil({ nombre: "Ana", telefono: "664-12" })).toHaveProperty("telefono");
  expect(validarPerfil({ nombre: "Ana", telefono: "" })).toEqual({});
  expect(validarPerfil({ nombre: "Ana", telefono: "664 123 4567" })).toEqual({});
});

test("PN-09 perfil: aplicar cambia nombre, iniciales y teléfono y conserva lo demás", () => {
  const a = asesor({ telefono: "6641112222", perfilPublico: { publicado: true, descripcion: "x" } });
  const r = aplicarPerfil(a, { nombre: " ana  lópez ", telefono: "" });
  expect(r.nombre).toBe("ana  lópez");
  expect(r.iniciales).toBe("AL");
  expect(r).not.toHaveProperty("telefono");
  expect(r.perfilPublico).toEqual(a.perfilPublico);
  expect(perfilCambio(a, { nombre: "Mariana Estrada ", telefono: "6641112222" })).toBe(false);
  expect(perfilCambio(a, { nombre: "Mariana", telefono: "6641112222" })).toBe(true);
  expect(inicialesDe("")).toBe("?");
});

test("PN-09 equipo: activos primero, por nombre; foto solo con dirección segura", () => {
  const lista = [asesor({ id: "1", nombre: "Zoe" }), asesor({ id: "2", nombre: "Beto", activo: false }), asesor({ id: "3", nombre: "Ana" })];
  expect(ordenarEquipo(lista).map((a) => a.id)).toEqual(["3", "1", "2"]);
  expect(fotoDe(asesor({ perfilPublico: { publicado: true, descripcion: "", foto: "https://x/y.jpg" } }))).toBe("https://x/y.jpg");
  expect(fotoDe(asesor({ perfilPublico: { publicado: true, descripcion: "", foto: "javascript:alert(1)" } }))).toBeNull();
});

test("PN-09 equipo: la ficha dice lo que falta", () => {
  const f = fichaAsesor(asesor({ email: "a@b.mx" }));
  const contacto = f.find((s) => s.titulo === "Contacto")!;
  expect(contacto.datos).toContainEqual({ etiqueta: "Teléfono", valor: "Falta", falta: true });
  expect(contacto.datos).toContainEqual({ etiqueta: "Correo", valor: "a@b.mx" });
  expect(f.find((s) => s.titulo === "Perfil público")!.datos[0]).toEqual({ etiqueta: "En el sitio", valor: "No publicado" });
});

test("PN-09 equipo: une cada cuenta con su ficha y separa las que no tienen", () => {
  const cuentas: Cuenta[] = [
    { user_id: "u1", role: "editor", active: true, email: "ana@x.mx", asesor_id: "a1" },
    { user_id: "u2", role: "admin", active: true, email: "dir@x.mx", asesor_id: null },
    { user_id: "u3", role: "editor", active: false, email: "baja@x.mx", asesor_id: "borrado" },
  ];
  const { porAsesor, sinFicha } = unirCuentas([asesor()], cuentas);
  expect(porAsesor.get("a1")?.map((c) => c.email)).toEqual(["ana@x.mx"]);
  expect(sinFicha.map((c) => c.user_id)).toEqual(["u2", "u3"]);
  expect(rolDe(cuentas[1]!)).toBe("Director");
  expect(rolDe(cuentas[2]!)).toBe("Asesor · sin acceso");
});

test("PN-09 equipo: solo se ligan cuentas de asesor activas que no estén ya en la ficha", () => {
  const cuentas: Cuenta[] = [
    { user_id: "u1", role: "editor", active: true, email: "ana@x.mx", asesor_id: "a1" },
    { user_id: "u2", role: "admin", active: true, email: "dir@x.mx", asesor_id: null },
    { user_id: "u3", role: "editor", active: false, email: "baja@x.mx", asesor_id: null },
    { user_id: "u4", role: "editor", active: true, email: "beto@x.mx", asesor_id: "a2" },
    { user_id: "u5", role: "editor", active: true, email: "carla@x.mx", asesor_id: null },
  ];
  expect(cuentasParaLigar(cuentas, "a1").map((c) => c.user_id)).toEqual(["u4", "u5"]);
  expect(conFicha(cuentas, "u5", "a1").find((c) => c.user_id === "u5")?.asesor_id).toBe("a1");
});

test("PN-09 equipo: una respuesta con otra forma no tumba la pantalla", () => {
  expect(cuentasValidas(null)).toBeNull();
  expect(cuentasValidas({ cuentas: [{ user_id: "u1", role: "editor", active: true }, { user_id: 2 }, { user_id: "u3", role: "otro", active: true }] }))
    .toEqual([{ user_id: "u1", role: "editor", active: true, email: "", asesor_id: null }]);
});
