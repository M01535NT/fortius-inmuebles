import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from 'node:fs/promises';
import { checklistFor, checklistTaskId, levantamientoFor } from "@/lib/formatos/checklist-documentos";
import { checklistPdf } from "@/lib/formatos/checklist-print";

describe("checklist de documentos del propietario", () => {
  it("pide lo básico y agrega lo que corresponde a su entrevista", () => {
    const basic = checklistFor({ estadoCivilActual: "soltero", gravamen: "no", tipoInmueble: "casa" }).map(i => i.id);
    expect(basic).toEqual(["D01", "D02", "D03", "D05", "D06", "D07", "D08", "D09", "D10", "D11"]);
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
