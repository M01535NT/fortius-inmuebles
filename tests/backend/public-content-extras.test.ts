import { describe, expect, it } from "vitest";
import { TIPO_INMUEBLE_KEYS } from "@/lib/inmueble-tipos";
import { SEGMENTOS_INMUEBLE, segmentoInmueble, tiposDeSegmento } from "@/lib/inmueble-segmentos";
import { parseRecord, projectPublic } from "@/lib/backend/validation";
import { preguntasPorGrupo } from "@/data/preguntas-frecuentes";

const base = { heroTitulo: "a", heroSubtitulo: "b", manifiestoTitulo: "c", manifiestoTexto: "d", seoTitle: "e", seoDescription: "f" };

describe("segmentos del sitio público", () => {
  it("reparten cada tipo de inmueble en un solo segmento", () => {
    const asignados = SEGMENTOS_INMUEBLE.flatMap(segmento => [...segmento.tipos]);
    expect([...asignados].sort()).toEqual([...TIPO_INMUEBLE_KEYS].sort());
    expect(new Set(asignados).size).toBe(asignados.length);
  });
  it("acepta solo claves conocidas", () => {
    expect(segmentoInmueble("comercial")).toBe("comercial");
    expect(segmentoInmueble("otro")).toBeUndefined();
    expect(tiposDeSegmento("residencial")).toEqual(["casa", "departamento"]);
  });
});

describe("preguntas frecuentes y testimonios del panel", () => {
  it("el panel guarda preguntas y testimonios en el contenido", () => {
    const data = parseRecord("contenido", "singleton", {
      ...base,
      preguntas: [{ id: "q1", grupo: "comprar", pregunta: "¿Se puede apartar?", respuesta: "Sí, por escrito." }],
      testimonios: [{ id: "t1", texto: "Nos explicaron todo.", nombre: "Ana", detalle: "Vendió una casa", autorizado: true }],
    });
    expect(data.preguntas).toHaveLength(1);
    expect(data.testimonios).toHaveLength(1);
  });
  it("rechaza un grupo de pregunta desconocido", () => {
    expect(() => parseRecord("contenido", "singleton", { ...base, preguntas: [{ id: "q1", grupo: "otro", pregunta: "x", respuesta: "y" }] })).toThrow();
  });
  it("un testimonio sin autorización no sale en la proyección pública", () => {
    const [publico] = projectPublic("contenido", [{
      ...base,
      testimonios: [
        { id: "t1", texto: "Con permiso", nombre: "Ana", detalle: "", autorizado: true },
        { id: "t2", texto: "Sin permiso", nombre: "Luis", detalle: "", autorizado: false },
      ],
    }]);
    expect((publico.testimonios as { id: string }[]).map(item => item.id)).toEqual(["t1"]);
  });
  it("la página suma las preguntas del equipo a las base de su grupo", () => {
    const grupos = preguntasPorGrupo({ ...base, preguntas: [{ id: "q1", grupo: "general", pregunta: "¿Atienden en fin de semana?", respuesta: "Con cita." }] });
    expect(grupos.map(grupo => grupo.key)).toEqual(["vender", "comprar", "general"]);
    expect(grupos.find(grupo => grupo.key === "general")?.questions.map(item => item.q)).toContain("¿Atienden en fin de semana?");
    expect(grupos.find(grupo => grupo.key === "comprar")?.questions.length).toBeGreaterThanOrEqual(5);
  });
});
