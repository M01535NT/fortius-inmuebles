import { describe, expect, it } from "vitest";

import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { emptyWorkflow } from "@/lib/formatos/operation-workflow";
import {
  asuntosDe, autorDeNota, avisosDelAsunto, cuentaDocumentos, documentosDelAsunto, estadoAsunto, filasAsuntos, filtrarAsuntos, loQueSigue, marcarDocumento, motivoDelEstado,
  noSeDio, nuevoSiguiente, ordenarAsuntos, ponerEnEspera, posponer, reanudar, textoSigue, type Expediente,
} from "@/lib/panel/datos/asuntos";
import type { Task } from "@/lib/tasks";

const exp = (id: string, extra: Partial<Expediente> = {}): Expediente => ({
  id, cliente_id: "c1", asesor_id: null, propiedad_slug: "casa", folio: `F-${id}`, operacion: "venta", etapa: "comercializacion",
  fecha_objetivo: null, flujo: emptyWorkflow("captacion"), checklist: null, version: 3, created_at: "2026-11-01", updated_at: "2026-11-01", ...extra,
});
const tarea = (id: string, expedienteId: string, vence: string, estado: Task["estado"] = "pendiente") =>
  ({ id, titulo: `Tarea ${id}`, expedienteId, vence, estado, categoria: "captacion", prioridad: "normal", descripcion: "", pasos: [] }) as unknown as Task;
const personas = [{ id: "c1", nombre: "Persona de ejemplo", tipo: "propietario" } as Cliente];
const inmuebles = [{ slug: "casa", codigo: "FORTIUS-000010", titulo: "Casa de ejemplo" } as Property];

describe("Asuntos en solo lectura (PN-04)", () => {
  it("deriva el estado sin inventar", () => {
    expect(estadoAsunto(exp("a"))).toBe("activo");
    expect(estadoAsunto(exp("a", { flujo: { ...emptyWorkflow(), estado: "pausada" } }))).toBe("espera");
    expect(estadoAsunto(exp("a", { etapa: "cerrado" }))).toBe("cerrado");
    expect(estadoAsunto(exp("a", { flujo: { ...emptyWorkflow(), estado: "descartada" } }))).toBe("cerrado");
  });
  it("lo que sigue es la tarea abierta más próxima", () => {
    const s = loQueSigue([tarea("1", "a", "2026-11-20"), tarea("2", "a", "2026-11-10"), tarea("3", "a", "2026-11-01", "completada")], "2026-11-16");
    expect(s).toEqual({ id: "2", texto: "Tarea 2", fecha: "2026-11-10", vencido: true });
    expect(loQueSigue([], "2026-11-16")).toBeNull();
    expect(textoSigue(null)).toBe("Sin siguiente paso");
  });
  it("arma título y línea con persona e inmueble, filtra y ordena", () => {
    const filas = filasAsuntos([exp("a"), exp("b", { cliente_id: null, propiedad_slug: null })], { personas, inmuebles, tareas: [tarea("1", "b", "2026-11-18")], hoy: "2026-11-16" });
    expect(filas[0].titulo).toBe("Venta: captación · Casa de ejemplo");
    expect(filas[0].linea).toBe("Persona de ejemplo · Casa de ejemplo · Venta");
    expect(ordenarAsuntos(filas, "sigue").map((f) => f.id)).toEqual(["b", "a"]);
    expect(filtrarAsuntos(filas, "ejemplo", "activo").map((f) => f.id)).toEqual(["a"]);
    expect(filtrarAsuntos(filas, "", "activo", true).map((f) => f.id)).toEqual(["a"]);
  });
  it("cambia el estado conservando versión, etapa y documentos", () => {
    const e = exp("a", { checklist: { predial: "recibido" }, fecha_objetivo: "2026-12-01T00:00:00Z" });
    const espera = ponerEnEspera(e, "  el avalúo del banco ");
    expect(espera).toMatchObject({ version: 3, etapa: "comercializacion", fechaObjetivo: "2026-12-01", checklist: { predial: "recibido" } });
    expect(espera.flujo).toMatchObject({ estado: "pausada", motivo: "el avalúo del banco", ruta: "captacion" });
    expect(motivoDelEstado({ flujo: espera.flujo ?? null })).toBe("Espera: el avalúo del banco");
    expect(reanudar(e).flujo).toMatchObject({ estado: "activa", motivo: "" });
    expect(noSeDio(e, "Desistió", "se mudó").flujo).toMatchObject({ estado: "descartada", motivo: "Desistió: se mudó" });
    expect(noSeDio(exp("b", { flujo: null, operacion: "renta" }), "Otro").flujo).toMatchObject({ ruta: "arrendador", estado: "descartada", motivo: "Otro" });
  });
  it("documentos: falta por omisión y la cuenta no incluye los que no aplican", () => {
    const e = exp("a", { checklist: { predial: "recibido", avaluo: "no_aplica" } });
    const docs = documentosDelAsunto(e);
    expect(docs).toHaveLength(7);
    expect(docs.find((d) => d.clave === "identidad")?.estado).toBe("pendiente");
    expect(cuentaDocumentos(docs)).toBe("1 de 6 recibidos");
    expect(marcarDocumento(e, "titulo", "recibido").checklist).toEqual({ predial: "recibido", avaluo: "no_aplica", titulo: "recibido" });
  });
  it("el siguiente paso lleva la persona, el asesor y el inmueble del asunto", () => {
    const t = nuevoSiguiente(exp("a", { asesor_id: "as1" }), "  Llamar para la visita ", "2026-11-20", new Date("2026-11-16T10:00:00Z"), "t9");
    expect(t).toMatchObject({ id: "t9", titulo: "Llamar para la visita", expedienteId: "a", clienteId: "c1", asesorId: "as1", propiedadSlug: "casa", vence: "2026-11-20", estado: "pendiente", categoria: "comercializacion" });
    expect(posponer(t, null).vence).toBeUndefined();
    expect(posponer(t, "2026-11-25").vence).toBe("2026-11-25");
  });
});

describe("Sus asuntos en las fichas", () => {
  it("lista los de la persona o del inmueble, activos primero y luego los movidos hace poco", () => {
    const lista = [
      exp("a", { updated_at: "2026-11-02" }),
      exp("b", { cliente_id: "c2", propiedad_slug: "otra" }),
      exp("c", { etapa: "cerrado", updated_at: "2026-11-09" }),
      exp("d", { updated_at: "2026-11-05", operacion: "renta" }),
    ];
    expect(asuntosDe(lista, { clienteId: "c1" }).map((a) => a.id)).toEqual(["d", "a", "c"]);
    expect(asuntosDe(lista, { slug: "otra" }).map((a) => a.texto)).toEqual(["Venta · F-b"]);
    expect(asuntosDe(lista, {})).toEqual([]);
  });
});

describe("Autor de una nota", () => {
  it("dice «Tú», el asesor ligado a la cuenta o nada", () => {
    const cuentas = [{ user_id: "u2", asesor_id: "a2", email: "otro@ejemplo.test" }, { user_id: "u3", asesor_id: null, email: "sin.ficha@ejemplo.test" }];
    const asesores = [{ id: "a2", nombre: "Asesor de ejemplo" }];
    expect(autorDeNota("u1", "u1", cuentas, asesores)).toBe("Tú");
    expect(autorDeNota("u2", "u1", cuentas, asesores)).toBe("Asesor de ejemplo");
    expect(autorDeNota("u3", "u1", cuentas, asesores)).toBe("sin.ficha");
    expect(autorDeNota("u9", "u1", cuentas, asesores)).toBeNull();
    expect(autorDeNota(null, "u1", cuentas, asesores)).toBeNull();
  });
});

describe("Avisos del asunto", () => {
  it("avisa de documentos que faltan y de la fecha objetivo vencida, solo en activos", () => {
    const a = avisosDelAsunto(exp("a", { checklist: { identidad: "recibido" }, fecha_objetivo: "2026-11-10" }), "2026-11-16");
    expect(a.map((x) => x.clave).slice(0, 2)).toEqual(["documentos", "fecha"]);
    expect(a[0]?.accion).toBe("Ver documentos");
    expect(avisosDelAsunto(exp("b", { etapa: "cerrado" }), "2026-11-16")).toEqual([]);
  });

  // Sin frenos (titular, 16/11/2026): lo que la base rechazaba al avanzar ahora se avisa.
  it("avisa lo que antes frenaba: inmueble, firma, identificación (legal), hipoteca, contraparte y cierre", () => {
    const todo = { identidad: "recibido", titulo: "recibido", predial: "recibido", gravamenes: "recibido" } as const;
    const venta = exp("v", { etapa: "entrega", propiedad_slug: null, checklist: todo });
    const tramite = { expedienteId: "v", pasoActual: 3, firmaSinCancelacion: null };
    const claves = avisosDelAsunto(venta, "2026-11-16", [tramite]).map((x) => x.clave);
    expect(claves).toEqual(expect.arrayContaining(["inmueble", "firma", "identificacion", "hipoteca", "contraparte", "cierre"]));
    // Inscrita la cancelación o con la decisión del director, ya no avisa; tampoco el trámite de otro asunto.
    for (const t of [{ ...tramite, pasoActual: 6 }, { ...tramite, firmaSinCancelacion: { motivo: "El notario la cancela en la firma" } }, { ...tramite, expedienteId: "otro" }])
      expect(avisosDelAsunto(venta, "2026-11-16", [t]).map((x) => x.clave)).not.toContain("hipoteca");
  });

  it("no avisa lo que ya está: firma revisada, identificación revisada, contraparte y cierre anotados", () => {
    const flujo = { ...emptyWorkflow("captacion"), contraparteExterna: "Comprador de ensayo", cierre: { capto: "a1", vendio: "a1" },
      firmaContrato: { tipo: "intermediacion", fecha: "2026-11-10", firmantes: [{ nombre: "Persona de ejemplo", parte: "propietario" }], archivo: "f1", completa: true, revisada: true },
      requisitos: { identificacion_pld: { estado: "revisado", soporte: "Identificaciones de ensayo" } } } as unknown as Expediente["flujo"];
    const claves = avisosDelAsunto(exp("w", { etapa: "entrega", flujo }), "2026-11-16").map((x) => x.clave);
    for (const c of ["inmueble", "firma", "identificacion", "contraparte", "cierre"] as const) expect(claves).not.toContain(c);
    // Una renta no lleva identificación LFPIORPI; una inversión no pide inmueble ni firma.
    expect(avisosDelAsunto(exp("r", { operacion: "renta", flujo: emptyWorkflow("arrendador") }), "2026-11-16").map((x) => x.clave)).not.toContain("identificacion");
    expect(avisosDelAsunto(exp("i", { operacion: "inversion", propiedad_slug: null, flujo: emptyWorkflow("inversion") }), "2026-11-16").map((x) => x.clave))
      .not.toEqual(expect.arrayContaining(["inmueble"]));
  });
});
