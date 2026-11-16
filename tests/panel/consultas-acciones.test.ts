import { expect, test } from "vitest";

import type { Lead } from "@/lib/domain/records";
import { pestanaDe } from "@/lib/panel/datos/consultas";
import { anotar, atender, cerrarConsulta, faltaParaAnotar, nuevaConsulta, programar, reabrir } from "@/lib/panel/datos/consultas-acciones";

const AHORA = new Date("2026-11-16T18:00:00Z");
const lead = (o: Partial<Lead> = {}): Lead => ({ id: "l1", nombre: "Ana Ruiz", telefono: "664 123 4567", origen: "contacto", estado: "nuevo", creadoEl: "2026-11-16T10:00:00Z", notas: [], ...o });

test("Atender yo: pasa a En seguimiento a nombre de quien la toma y marca el primer contacto", () => {
  const l = atender(lead({ asesorId: "otro" }), "as-yo", AHORA);
  expect(pestanaDe(l)).toBe("seguimiento");
  expect(l.asesorId).toBe("as-yo");
  expect(l.firstContactedAt).toBeTruthy();
  // Dirección sin ficha de asesor: se queda con quien estaba.
  expect(atender(lead({ asesorId: "otro" }), null, AHORA).asesorId).toBe("otro");
  // No pisa el primer contacto que ya había.
  expect(atender(lead({ firstContactedAt: "2026-11-01T00:00:00Z" }), "as-yo", AHORA).firstContactedAt).toBe("2026-11-01T00:00:00Z");
});

test("Cerrar: «No es cliente» o «Sin operación», con nota; reabrir vuelve a seguimiento", () => {
  const no = cerrarConsulta(lead(), "no_es_cliente", "número equivocado", AHORA);
  expect(no.estado).toBe("descartado");
  expect(no.notas.at(-1)?.texto).toBe("Se cerró: no es cliente. número equivocado");
  const sin = cerrarConsulta(lead(), "sin_operacion", "", AHORA);
  expect(sin.estado).toBe("cerrado");
  expect(pestanaDe(sin)).toBe("cerradas");
  const otra = reabrir(sin, AHORA);
  expect(pestanaDe(otra)).toBe("seguimiento");
  expect(otra.notas).toHaveLength(2);
});

test("Anotar y programar el siguiente contacto", () => {
  expect(anotar(lead(), "   ").notas).toHaveLength(0);
  expect(anotar(lead(), " Quiere visitar el sábado ", AHORA).notas[0].texto).toBe("Quiere visitar el sábado");
  const p = programar(lead(), "2026-11-20", "Llamar para la visita");
  expect(p.perfil?.proximoContacto).toBe("2026-11-20");
  expect(p.perfil?.proximaAccion).toBe("Llamar para la visita");
  const sin = programar(p, null);
  expect(sin.perfil?.proximoContacto).toBeUndefined();
  expect(sin.perfil?.proximaAccion).toBeUndefined();
});

test("Anotar una consulta a mano: queda en seguimiento a nombre de quien la anota", () => {
  expect(faltaParaAnotar({ nombre: "", telefono: "6641234567" })).toBe("Escribe el nombre.");
  expect(faltaParaAnotar({ nombre: "Luis", telefono: "664" })).toMatch(/7 dígitos/);
  expect(faltaParaAnotar({ nombre: "Luis", telefono: "664 123 4567" })).toBeNull();
  const n = nuevaConsulta({ nombre: " Luis ", telefono: "664 123 4567", canal: "llamada", mensaje: "  " }, "as-yo", AHORA);
  expect(n).toMatchObject({ nombre: "Luis", origen: "manual", canal: "llamada", estado: "contactado", asesorId: "as-yo" });
  expect(n.mensaje).toBeUndefined();
  expect(pestanaDe(n)).toBe("seguimiento");
});
