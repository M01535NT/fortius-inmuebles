import { expect, test } from "vitest";

import {
  anotarResultado, lineaResultado, notaParaAsunto, pideComoFue, vencimientosEnDias, vencimientosPorFecha, yaPaso, type EventoConResultado,
} from "@/lib/panel/datos/agenda-resultado";
import type { ContratoServidor } from "@/lib/panel/datos/hoy";

const ahora = new Date(2026, 10, 16, 12, 0); // lunes 16 nov, 12:00
const cita = (d: Partial<EventoConResultado> = {}): EventoConResultado => ({ id: "c1", titulo: "Visita con Ana", fecha: "2026-11-16", tipo: "visita", ...d });

test("PN-04 ¿cómo te fue?: ya pasó según día, hora y duración", () => {
  expect(yaPaso(cita({ fecha: "2026-11-15" }), ahora)).toBe(true);
  expect(yaPaso(cita({ fecha: "2026-11-17", hora: "09:00" }), ahora)).toBe(false);
  expect(yaPaso(cita({ hora: "10:30" }), ahora)).toBe(true); // visita de 60 min, terminó 11:30
  expect(yaPaso(cita({ hora: "11:30" }), ahora)).toBe(false); // termina 12:30
  expect(yaPaso(cita({ hora: "11:30", tipo: "llamada" }), ahora)).toBe(true); // 15 min
  expect(yaPaso(cita(), ahora)).toBe(false); // hoy sin hora: se pregunta mañana
});

test("PN-04 ¿cómo te fue?: no se vuelve a preguntar si ya se anotó", () => {
  const pasada = cita({ fecha: "2026-11-14" });
  expect(pideComoFue(pasada, ahora)).toBe(true);
  expect(pideComoFue(anotarResultado(pasada, "hecha", "", ahora), ahora)).toBe(false);
});

test("PN-04 ¿cómo te fue?: conserva las notas y agrega la línea al final", () => {
  const r = anotarResultado(cita({ notas: "Llevar llaves" }), "no_llego", "  Reagendar  ", ahora);
  expect(r.notas).toBe("Llevar llaves\n\nCómo fue (lunes 16 nov): No llegó. Reagendar");
  expect(r.resultado).toEqual({ estado: "no_llego", nota: "Reagendar", anotadoEl: ahora.toISOString() });
  expect(lineaResultado("hecha", "", ahora)).toBe("Cómo fue (lunes 16 nov): Se hizo");
  expect(notaParaAsunto(cita({ hora: "10:00" }), "hecha", "Le gustó")).toBe("Cita «Visita con Ana» (lunes 16 nov, 10:00): Se hizo. Le gustó");
});

test("PN-04 vencimientos: cada uno en su fecha y la licencia una sola vez", () => {
  const contratos: ContratoServidor[] = [
    { expedienteId: "e1", folio: "F-1", emitido: true, fin: "2026-11-20", exclusiva: true, licencia: { numero: "L-9", vigencia: "2026-11-18" } },
    { expedienteId: "e2", folio: "F-2", emitido: false, fin: "2027-01-05", exclusiva: false, licencia: { numero: "L-9", vigencia: "2026-11-18" } },
    { expedienteId: "e3", folio: "F-3", emitido: true, fin: "no es fecha", exclusiva: false },
  ];
  const v = vencimientosEnDias(contratos);
  expect(v.map((x) => x.id)).toEqual(["licencia:L-9", "e1:fin", "e2:fin"]);
  expect(v[0]).toMatchObject({ fecha: "2026-11-18", detalle: "La usan 2 contratos" });
  expect(v[2]).toMatchObject({ detalle: "Contrato sin emitir", expedienteId: "e2" });
  expect(vencimientosPorFecha(v).get("2026-11-20")?.map((x) => x.titulo)).toEqual(["Fin del encargo · F-1"]);
});
