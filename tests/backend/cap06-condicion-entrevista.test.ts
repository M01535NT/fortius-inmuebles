import { describe, expect, it } from "vitest";
import { validateFormato } from "@/lib/formatos/catalog";
import { checklistFor } from "@/lib/formatos/checklist-documentos";
import { entrevistaDocumento } from "@/lib/formatos/documento/entrevista";
import { mostrarCampoEntrevista } from "@/lib/formatos/entrevista";
import { conditionWith02 } from "@/lib/intake/condition";
import { visibleFields } from "@/lib/intake/wizard";

/* CAP-06 (DEC-39, decidida por el titular el 12/11/2026): preguntas de la 02 y documentos por caso. */
const item = (data: Record<string, unknown>, id: string) => checklistFor(data).find(i => i.id === id);

describe("CAP-06 · la 02 con el problema del inmueble", () => {
  it("con crédito pregunta si está al corriente y cuánto debe; sin crédito no", () => {
    expect(mostrarCampoEntrevista("creditoAlCorriente", { gravamen: "infonavit" })).toBe(true);
    expect(mostrarCampoEntrevista("saldoCredito", { gravamen: "banco" })).toBe(true);
    expect(mostrarCampoEntrevista("creditoAlCorriente", { gravamen: "no" })).toBe(false);
    expect(mostrarCampoEntrevista("saldoCredito", {})).toBe(false);
  });

  it("las preguntas nuevas no son obligatorias: ningún dato faltante detiene el flujo", () => {
    const missing = validateFormato("02", { gravamen: "infonavit" });
    for (const label of ["¿Tiene algún problema el inmueble?", "¿Está al corriente con los pagos?", "¿Sabe cuánto debe?"]) expect(missing).not.toContain(label);
  });

  it("el documento imprime el problema y, salvo sin crédito, las dos preguntas del crédito", () => {
    const preguntas = (data: Record<string, unknown>) => entrevistaDocumento(data).blocks.flatMap(b => b.kind === "form" ? b.rows.flat().map(cell => cell.q) : []);
    expect(preguntas({ gravamen: "infonavit", creditoAlCorriente: "no", saldoCredito: "Cerca de 180 mil" })).toEqual(expect.arrayContaining(["¿Tiene algún problema el inmueble?", "¿Está al corriente con los pagos?", "¿Sabe cuánto debe?"]));
    expect(preguntas({})).toContain("¿Está al corriente con los pagos?");
    expect(preguntas({ gravamen: "no" })).not.toContain("¿Está al corriente con los pagos?");
  });
});

describe("CAP-06 · la lista de documentos según el caso", () => {
  it("ocupado sin permiso: pregunta por la denuncia o demanda en lugar del contrato de renta", () => {
    for (const data of [{ ocupacion: "sin_permiso" }, { ocupacion: "otro", problema: "ocupado_sin_permiso" }]) {
      expect(item(data, "D18")).toEqual({ id: "D18", texto: "D18 · Denuncia o demanda por la ocupación", porConfirmar: "¿Hay denuncia o demanda por la ocupación?" });
    }
    expect(item({ ocupacion: "inquilino" }, "D18")?.texto).toBe("D18 · Contrato de arrendamiento vigente");
  });

  it("herencia, adeudos y juicio piden lo suyo", () => {
    expect(item({ problema: "herencia" }, "D16")).toEqual({ id: "D16", texto: "D16 · Acta de defunción y testamento o juicio sucesorio" });
    expect(item({ problema: "adeudos" }, "D06")?.texto).toBe("D06 · Último recibo de predial, con lo que se debe");
    expect(item({ problema: "juicio" }, "D22")?.texto).toBe("D22 · Número de expediente y copia de la demanda del juicio");
    expect(item({ problema: "ninguno" }, "D22")).toBeUndefined();
  });

  it("con el crédito atrasado o sin saber, pide además el estado de cuenta", () => {
    expect(item({ gravamen: "infonavit", creditoAlCorriente: "no" }, "D17")?.texto).toBe("D17 · Carta del Infonavit con el saldo y la instrucción de cancelación de la hipoteca, y estado de cuenta con lo que se debe");
    expect(item({ gravamen: "infonavit", creditoAlCorriente: "si" }, "D17")?.texto).toBe("D17 · Carta del Infonavit con el saldo y la instrucción de cancelación de la hipoteca");
  });
});

describe("CAP-06 · la condición también sale de la 02", () => {
  it("si la llamada no dijo nada, cuenta lo anotado en la 02; la llamada gana si dijo algo", () => {
    expect(conditionWith02({}, { ocupacion: "sin_permiso" })).toEqual({ text: "Ocupado sin permiso" });
    expect(conditionWith02({ problema: "ninguno" }, { problema: "juicio" })).toEqual({ text: "Juicio o conflicto" });
    expect(conditionWith02({ problema: "adeudos" }, { problema: "juicio" })).toEqual({ text: "Con adeudos" });
    expect(conditionWith02({}, { problema: "ninguno", ocupacion: "propietario" })).toBeNull();
    expect(conditionWith02(undefined, undefined)).toBeNull();
  });

  it("en la llamada no se pregunta cómo visitar un inmueble ocupado sin permiso", () => {
    const keys = (problema: string) => visibleFields("vender", { problema }).map(f => f.key);
    expect(keys("ocupado_sin_permiso")).not.toContain("acceso");
    expect(keys("ninguno")).toContain("acceso");
  });
});
