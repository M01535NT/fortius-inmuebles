import { describe, expect, test } from "vitest";
import { appRunSchema, resultSchema, resultToCsv } from "@/lib/apps/contracts";
describe("saved app work", () => {
  test("rejects unregistered apps and malformed context", () => {
    expect(appRunSchema.safeParse({ slug: "shell", title: "x", input: {}, result: null, context: {} }).success).toBe(false);
    expect(appRunSchema.safeParse({ slug: "hipoteca", title: "x", input: {}, result: null, context: { expedienteId: "other" } }).success).toBe(false);
  });
  test("round trips typed results and guards CSV formulas", () => {
    const result = resultSchema.parse({ title: "Ejemplo", summary: [{ label: "Precio", value: "100 MXN" }], sections: [{ title: "Ofertas", columns: ["Nombre"], rows: [["=WEBSERVICE(\"x\")"], ["a,b"]] }] });
    expect(resultToCsv(result)).toContain("'=WEBSERVICE");
    expect(resultToCsv(result)).toContain('"a,b"');
  });
});
