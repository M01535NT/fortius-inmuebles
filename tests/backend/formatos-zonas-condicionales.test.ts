import { beforeAll, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { crearMaquetador, type Maqueta } from "@/lib/formatos/documento/pdf";
import type { Documento } from "@/lib/formatos/documento/modelo";
import { DOCUMENTOS } from "@/lib/formatos/documento";
import { formatoById, validateFormato } from "@/lib/formatos/catalog";
import { loadLetterhead } from "@/lib/letterhead-server";

/*
  Captura sobre el documento: un dato se llena pulsando su zona, y «Qué falta» lleva a la zona del
  dato pendiente. Si un dato obligatorio solo tiene zona cuando ya está lleno, no hay dónde
  capturarlo y el formato no se puede emitir.
*/
let maquetar: (doc: Documento) => Promise<Maqueta>;
beforeAll(async () => {
  const [regular, bold] = await Promise.all([readFile(join(process.cwd(), "public/fonts/Archivo-Regular.ttf")), readFile(join(process.cwd(), "public/fonts/Archivo-SemiBold.ttf"))]);
  maquetar = await crearMaquetador({ regular, bold, ...await loadLetterhead() });
});
/** Los campos que la validación pide y que no tienen ninguna zona en la hoja. */
async function pendientesSinZona(id: string, data: Record<string, unknown>) {
  const byLabel = new Map(formatoById(id).fields.map(f => [f.label, f.key]));
  const covered = new Set((await maquetar(DOCUMENTOS[id]!(data))).zonas.flatMap(z => z.keys));
  return validateFormato(id, data).map(label => byLabel.get(label)).filter((key): key is string => !!key && key !== "folio" && !covered.has(key));
}

// BUG-C32: una promesa (15) recién iniciada se ve con «NaN» en el precio, la garantía, la pena y los recursos (`formatAmount(undefined)`).
it("15 · la promesa vacía no muestra NaN en los importes", () => {
  expect(JSON.stringify(DOCUMENTOS["15"]!({}).blocks)).not.toMatch(/NaN/);
});

// BUG-C30: en el contrato de arrendamiento con fiador, «¿El fiador responde con un inmueble?» es obligatoria, pero su zona solo existe cuando ya dice «sí».
it("20 · con fiador, la pregunta de si responde con un inmueble tiene dónde contestarse", async () => {
  expect(await pendientesSinZona("20", { garantia: "fiador" })).not.toContain("fiadorConInmueble");
});

// BUG-C31: en la respuesta a la oferta (14) dada después del plazo, la confirmación de vigencia es obligatoria, pero su zona solo aparece cuando ya está escrita.
it("14 · respondida fuera de plazo, la confirmación de vigencia tiene dónde capturarse", async () => {
  const data = { estadoRespuesta: "registrada", decisionPropietario: "aceptar", fechaLimitePropuesta: "2026-11-10", fechaRespuesta: "2026-11-12" };
  expect(validateFormato("14", data)).toContain("Confirmación de vigencia por el comprador");
  expect(await pendientesSinZona("14", data)).not.toContain("confirmacionVigencia");
});
