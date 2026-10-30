import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from 'node:fs/promises';
import { actualizarChecklist, checklistCompleto, checklistDesactualizado, checklistFor, checklistTaskId, levantamientoFor, motivoNoAplica, municipioDe, type PasoChecklist } from "@/lib/formatos/checklist-documentos";
import { juridicaDocumentsFrom } from "@/components/admin/operation/use-documents";
import type { Task } from "@/lib/tasks";
import { checklistPdf } from "@/lib/formatos/checklist-print";

describe("checklist de documentos del propietario", () => {
  it("pide lo básico y agrega lo que corresponde a su entrevista", () => {
    const basic = checklistFor({ estadoCivilActual: "soltero", gravamen: "no", tipoInmueble: "casa" });
    expect(basic.filter(i => !i.porConfirmar).map(i => i.id)).toEqual(["D01", "D02", "D03", "D05", "D06", "D07", "D08", "D09", "D10", "D11"]);
    // Lo que la entrevista no pregunta queda por confirmar, con su pregunta: condominio e INDIVI en una casa.
    expect(basic.filter(i => i.porConfirmar).map(i => [i.id, i.porConfirmar])).toEqual([["D19", "¿Está en un condominio o fraccionamiento con cuotas?"], ["D21", "¿El inmueble viene del INDIVI?"]]);
    const complex = checklistFor({ estadoCivilActual: "casado", gravamen: "banco", representacion: "si", adquisicion: "herencia", ocupacion: "inquilino", tipoInmueble: "departamento" }).map(i => i.id);
    expect(complex).toEqual(expect.arrayContaining(["D12", "D14", "D16", "D17", "D18", "D19"]));
    expect(complex).not.toContain("D20");
  });
  it("sin entrevista no asume un crédito que no se declaró", () => {
    expect(checklistFor({}).map(i => i.id)).not.toContain("D17");
  });
  it("elige el levantamiento según el tipo de inmueble", () => {
    expect(["terreno", "casa", "departamento", "oficina", "local", "nave", "plaza", "otro"].map(levantamientoFor)).toEqual(["04A", "04B", "04C", "04D", "04E", "04F", "04G", "04B"]);
    expect(checklistTaskId("abc")).toBe("checklist-abc");
  });
  it("genera un PDF con acentos y casillas", async () => {
    const bytes = await checklistPdf(checklistFor({ estadoCivilActual: "casado" }), { folio: "EXP-2026-041", cliente: "Familia Castañeda Ortiz", recibidos: ["D01"] });
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
  });
});
beforeEach(()=>{vi.spyOn(globalThis,'fetch').mockImplementation(async input=>new Response(await readFile(`public${String(input)}`)));});
afterEach(()=>vi.restoreAllMocks());

/* COR-06 (29/10/2026): lista preliminar revisable con B-06 y B-07. */
describe("lista de documentos revisable", () => {
  const pasos = (data: Record<string, unknown>): PasoChecklist[] => checklistFor(data).map(item => ({ ...item, hecho: false }));

  it("un terreno no exige la constancia del agua sin preguntar, y pide el deslinde catastral", () => {
    const terreno = checklistFor({ tipoInmueble: "terreno", inmueble: "Lote 5, Ensenada, B. C." });
    expect(terreno.find(i => i.id === "D07")).toMatchObject({ porConfirmar: "¿El terreno tiene toma de agua?", texto: "D07 · Constancia de la CESPE (deslinde reciente y cuenta sin adeudo)" });
    expect(terreno.find(i => i.id === "D05")?.texto).toBe("D05 · Deslinde catastral certificado por catastro y clave catastral");
    expect(motivoNoAplica({ tipoInmueble: "terreno" }, "D07")).toBe("El terreno no tiene toma de agua");
  });

  it("el organismo del agua sale del municipio del domicilio", () => {
    expect(["Calle 1, Tijuana", "Playas de Rosarito", "ENSENADA", "Tecate, B.C.", "Mexicali"].map(municipioDe)).toEqual(["tijuana", "rosarito", "ensenada", "tecate", undefined]);
    expect(checklistFor({ tipoInmueble: "casa", inmueble: "Av. Juárez, Tecate" }).find(i => i.id === "D07")?.texto).toContain("CESPTE");
    expect(checklistFor({ tipoInmueble: "casa" }).find(i => i.id === "D07")?.texto).toContain("según el municipio");
  });

  it("un heredero o una promesa previa generan su documento sin preguntar", () => {
    expect(checklistFor({ relacion: "heredero" }).find(i => i.id === "D16")).toEqual({ id: "D16", texto: "D16 · Documentos de la sucesión o adjudicación" });
    expect(checklistFor({ relacion: "propietario" }).find(i => i.id === "D16")?.porConfirmar).toBe("¿Lo recibió por herencia o adjudicación?");
    expect(checklistFor({ promesaPrevia: "si" }).find(i => i.id === "D18")?.porConfirmar).toBeUndefined();
    expect(checklistFor({ ocupacion: "inquilino" }).find(i => i.id === "D18")?.texto).toBe("D18 · Contrato de arrendamiento vigente");
    expect(checklistFor({ gravamen: "no_sabe" }).find(i => i.id === "D17")?.porConfirmar).toBe("¿Tiene hipoteca o crédito sobre el inmueble?");
    expect(checklistFor({ gravamen: "fovissste" }).find(i => i.id === "D17")?.texto).toContain("del Fovissste");
  });

  it("«No aplica» con motivo cierra el punto; sin motivo o por confirmar, no", () => {
    expect(checklistCompleto([{ id: "D01", texto: "D01", hecho: true }, { id: "D07", texto: "D07", hecho: false, noAplica: "El terreno no tiene toma de agua" }])).toBe(true);
    expect(checklistCompleto([{ id: "D07", texto: "D07", hecho: false, noAplica: "  " }])).toBe(false);
    expect(checklistCompleto([{ id: "D21", texto: "D21", hecho: false, porConfirmar: "¿El inmueble viene del INDIVI?" }])).toBe(false);
    expect(checklistCompleto([])).toBe(false);
  });

  it("al cambiar la entrevista, la lista conserva lo hecho y lo agregado, y respeta lo ya respondido", () => {
    const antes = pasos({ tipoInmueble: "casa", estadoCivilActual: "soltero" }).map(p =>
      p.id === "D01" ? { ...p, hecho: true } : p.id === "D21" ? { ...p, porConfirmar: undefined, noAplica: "No viene del INDIVI" } : p.id === "D19" ? { id: p.id, texto: p.texto, hecho: false, aplica: true } : p);
    antes.push({ id: "X1", texto: "D22 · Constancia del fraccionamiento", hecho: false });
    const sugeridos = checklistFor({ tipoInmueble: "casa", estadoCivilActual: "casado" });
    expect(checklistDesactualizado(antes, sugeridos)).toBe(true);
    const despues = actualizarChecklist(antes, sugeridos);
    expect(despues.find(p => p.id === "D01")?.hecho).toBe(true);
    expect(despues.find(p => p.id === "D12")).toEqual({ id: "D12", texto: "D12 · Acta de matrimonio y, en su caso, capitulaciones", hecho: false });
    expect(despues.find(p => p.id === "D21")?.noAplica).toBe("No viene del INDIVI");
    // Ya respondió que sí está en condominio: no se le vuelve a preguntar.
    expect(despues.find(p => p.id === "D19")?.porConfirmar).toBeUndefined();
    expect(despues.at(-1)?.id).toBe("X1");
    expect(checklistDesactualizado(despues, sugeridos)).toBe(false);
    // Lo pendiente que ya no corresponde se quita; lo recibido se queda.
    const sinCasa = actualizarChecklist(despues, checklistFor({ tipoInmueble: "nave-industrial", estadoCivilActual: "casado" }));
    expect(sinCasa.some(p => p.id === "D19")).toBe(false);
    expect(sinCasa.some(p => p.id === "D21")).toBe(true);
  });

  it("el dictamen jurídico (05) recibe «No aplica» con su motivo, lo por confirmar y lo agregado", () => {
    const task = { pasos: [
      { id: "D01", texto: "D01 · Escritura", hecho: true },
      { id: "D07", texto: "D07 · Agua", hecho: false, noAplica: "El terreno no tiene toma de agua" },
      { id: "D21", texto: "D21 · INDIVI", hecho: false, porConfirmar: "¿El inmueble viene del INDIVI?" },
      { id: "X1", texto: "D22 · Constancia del fraccionamiento", hecho: true },
    ] } as unknown as Task;
    const filas = Object.fromEntries(juridicaDocumentsFrom(task).map(fila => [fila.concepto, fila]));
    expect(filas.D01).toMatchObject({ aplica: "si", estado: "recibido" });
    expect(filas.D07).toEqual({ concepto: "D07", aplica: "no", verificacion: "El terreno no tiene toma de agua" });
    expect(filas.D21).toEqual({ concepto: "D21", aplica: "pendiente", verificacion: "¿El inmueble viene del INDIVI?" });
    expect(filas.D22).toMatchObject({ aplica: "si", estado: "recibido", verificacion: "Constancia del fraccionamiento (recibido)" });
    expect(filas.D04).toEqual({ concepto: "D04" });
  });
});
