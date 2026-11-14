import { beforeAll, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { crearMaquetador, type Maqueta } from "@/lib/formatos/documento/pdf";
import type { Documento } from "@/lib/formatos/documento/modelo";
import { DOCUMENTOS } from "@/lib/formatos/documento";
import { validateFormato } from "@/lib/formatos/catalog";
import { loadLetterhead } from "@/lib/letterhead-server";

/*
  BUG-C33: en el inventario de entrega y devolución (23), «¿Fortius elaboró el inventario?» es
  obligatoria, pero su zona («Quién elaboró el inventario») solo existe cuando ya dice «sí». Sin
  zona no hay dónde contestarla y el 23 no se puede emitir. Mismo patrón que C-30 en el 20.
*/
let maquetar: (doc: Documento) => Promise<Maqueta>;
beforeAll(async () => {
  const [regular, bold] = await Promise.all([readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf"))]);
  maquetar = await crearMaquetador({ regular, bold, ...await loadLetterhead() });
});
const zonas = async (data: Record<string, unknown>) => new Set((await maquetar(DOCUMENTOS["23"]!(data))).zonas.flatMap(z => z.keys));

it("23 · la pregunta de si Fortius elaboró el inventario tiene dónde contestarse antes de responderla", async () => {
  expect(validateFormato("23", {})).toContain("¿Fortius elaboró el inventario?");
  expect((await zonas({})).has("intervieneFortius")).toBe(true);
});

it("23 · con saldo en contra, el plazo para pagar la diferencia tiene zona", async () => {
  expect((await zonas({ deposito: 1000, reparaciones: 1500 })).has("plazoPagoDiferencia")).toBe(true);
});
