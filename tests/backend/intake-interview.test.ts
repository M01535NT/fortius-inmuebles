import { describe, expect, it } from "vitest";
import {
  interviewIssues,
  interviewFields,
  INTENTS,
  type InterviewAnswers,
} from "../../src/lib/intake/interview";
const common: InterviewAnswers = {
  fecha: "2026-10-13",
  objetivo: "Iniciar servicio",
  plazo: "Tres meses",
  zona: "Tijuana",
  tipoInmueble: "casa",
  presupuestoEstado: "por_definir",
  privacidad: "presentado",
  siguienteAccion: "Revisar documentos",
  siguienteFecha: "2026-10-20",
};
describe("Entrevista inicial por intención", () => {
  it("prepara cinco perfiles diferentes sin confundir renta con venta", () => {
    expect(Object.keys(INTENTS)).toEqual([
      "vender",
      "arrendar",
      "comprar",
      "rentar",
      "invertir",
    ]);
    expect(interviewFields("arrendar").map((f) => f.key)).toContain(
      "ocupacion",
    );
    expect(interviewFields("rentar").map((f) => f.key)).not.toContain(
      "financiamiento",
    );
    expect(interviewFields("invertir").map((f) => f.key)).toContain(
      "estrategia",
    );
  });
  it("admite desconocidos expresos y valida solo preguntas pertinentes", () => {
    expect(
      interviewIssues("vender", {
        ...common,
        relacion: "propietario",
        ocupacion: "por_aclarar",
        documentos: "por_aclarar",
        alertas: "por_aclarar",
        estadoCivil: "soltero",
      }),
    ).toEqual([]);
    expect(
      interviewIssues("rentar", {
        ...common,
        uso: "Vivienda familiar",
        necesidades: "Dos recámaras",
      }),
    ).toEqual([]);
    expect(
      interviewIssues("invertir", {
        ...common,
        uso: "Inversión",
        necesidades: "Casa para renta",
        financiamiento: "por_definir",
        estrategia: "por_definir",
        horizonte: "Tres años",
      }),
    ).toEqual([]);
  });
  it("conserva datos matrimoniales opcionales sin condicionar la entrevista inicial", () => {
    expect(
      interviewIssues("vender", {
        ...common,
        relacion: "propietario",
        ocupacion: "desocupado",
        documentos: "Escritura",
        alertas: "ninguna_declarada",
        estadoCivil: "casado",
      }),
    ).toEqual([]);
    expect(
      interviewIssues("vender", {
        ...common,
        relacion: "propietario",
        ocupacion: "desocupado",
        documentos: "Escritura",
        alertas: "ninguna_declarada",
        estadoCivil: "casado",
        conyuge: "Ana López",
        regimen: "separacion",
      }),
    ).toEqual([]);
    expect(interviewFields("vender").map((field) => field.key)).toContain(
      "estadoCivil",
    );
    expect(interviewFields("comprar").map((field) => field.key)).not.toContain(
      "estadoCivil",
    );
  });
  it("exige importe positivo cuando se declara conocido y próxima acción fechada", () => {
    const issues = interviewIssues("comprar", {
      ...common,
      uso: "Vivienda",
      necesidades: "Tres habitaciones",
      financiamiento: "por_definir",
      presupuestoEstado: "conocido",
      importe: "0",
      moneda: "MXN",
      siguienteFecha: "",
    });
    expect(issues.map((i) => i.key)).toEqual(
      expect.arrayContaining(["importe", "siguienteFecha"]),
    );
  });
  it("no interpreta pendientes de privacidad como consentimiento", () => {
    expect(
      interviewIssues("rentar", {
        ...common,
        uso: "Vivienda",
        necesidades: "Dos recámaras",
        privacidad: "pendiente",
      }).map((i) => i.key),
    ).toContain("privacidad");
  });
});
