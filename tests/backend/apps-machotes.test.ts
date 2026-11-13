import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { formatoById } from "@/lib/formatos/catalog";
import { FORMATOS_INDEPENDIENTES } from "@/lib/apps/documentos";

/* HER-02 · RP-77: el machote en blanco de cada formato siempre se descarga, sin aviso de incompleto. */
describe("Machotes en blanco", () => {
  for (const id of FORMATOS_INDEPENDIENTES) {
    const definition = formatoById(id);
    if (!definition.readyForEmission) continue;
    it(`${id} sale en blanco`, async () => {
      const pdf = await PDFDocument.load(await createFormatoPdf(id, {}, [], { machote: true }));
      expect(pdf.getPageCount()).toBeGreaterThan(0);
    }, 30000);
  }
  it("sin «machote», un formato vacío sigue pidiendo sus datos", async () => {
    await expect(createFormatoPdf("15", {})).rejects.toThrow(/Faltan datos/);
  });
});
