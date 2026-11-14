import { expect, test } from "vitest";
import { ACREEDORES, PASO_CLAVES, nuevoTramite, pasosDe, textoDelAvance, type Acreedor } from "@/lib/tramites";

// TRA-01 (fuentes oficiales, 14/11/2026): en Baja California el Registro Público inscribe la
// cancelación con la carta del acreedor (Retys BC-DRPPC-014) y Fovissste emite un instrumento
// administrativo gratuito (FOVISSSTE-00-012-A). Solo el banco pasa por notario.
const acreedores = Object.keys(ACREEDORES) as Acreedor[];

test("Infonavit y Fovissste no pasan por notario; el banco sí", () => {
  for (const a of ["infonavit", "fovissste"] as const) {
    const texto = JSON.stringify(pasosDe(a).map(({ nombre, ayuda, pendientes }) => ({ nombre, ayuda, pendientes })));
    expect(texto).not.toMatch(/notar/i);
    expect(nuevoTramite({ id: "x", acreedor: a, titulo: "Casa", clienteId: "c", asesorId: "a" }).pagos.map(p => p.concepto).join()).not.toMatch(/escritura/i);
  }
  expect(JSON.stringify(pasosDe("banco"))).toMatch(/notar/i);
  expect(nuevoTramite({ id: "x", acreedor: "banco", titulo: "Casa", clienteId: "c", asesorId: "a" }).pagos.map(p => p.concepto)).toContain("Escritura de cancelación");
});

test("Fovissste paga los derechos antes del instrumento; Infonavit valida antes de pagar", () => {
  expect(pasosDe("fovissste").map(p => p.nombre)).toEqual(["Datos del crédito", "Crédito liquidado", "Carta de finiquito", "Pago de derechos", "Instrumento de cancelación", "Registro Público", "Certificado de gravámenes", "Entrega"]);
  expect(pasosDe("infonavit").map(p => p.nombre)).toEqual(["Datos del crédito", "Crédito liquidado", "Carta de instrucción", "Validación de Infonavit", "Pago de derechos", "Registro Público", "Certificado de gravámenes", "Entrega"]);
  expect(pasosDe("banco").map(p => p.nombre)).toEqual(["Datos del crédito", "Crédito liquidado", "Carta de finiquito", "Notario y presupuesto", "Firma ante notario", "Registro Público", "Certificado de gravámenes", "Entrega"]);
  for (const a of acreedores) expect(pasosDe(a).map(p => p.clave)).toEqual([...PASO_CLAVES]);
});

test("el avance solo pide aprobar el presupuesto del notario cuando hay notario", () => {
  const en = (a: Acreedor) => ({ ...nuevoTramite({ id: "x", acreedor: a, titulo: "Casa", clienteId: "c", asesorId: "a" }), pasoActual: 3 });
  const partes = { listo: false, sigue: false, necesita: true, pagos: false };
  expect(textoDelAvance(en("banco"), partes, "Ana", "F")).toMatch(/presupuesto del notario/);
  expect(textoDelAvance(en("infonavit"), partes, "Ana", "F")).not.toMatch(/notario/);
});
