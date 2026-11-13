#!/usr/bin/env node
/*
  Prepara la copia de la plantilla del 07 que usa el panel (public/plantillas/07_OpinionValor.xlsx)
  a partir del archivo del titular (04_Metodologia/01_Captacion/07_OpinionValor.xlsx).

  Se conservan textos, estilos, dibujos, membrete y fórmulas de presentación del original. Solo se
  cambian las fórmulas que esperan casillas de control que el panel no captura (estado «Incluido»
  de cada comparable, «Revisado» de superficies, «Revisada» de la conclusión y del enfoque físico):
  con ellas el Excel saldría vacío. Se sustituyen por las de la copia anterior (17/10/2026), que
  calculan con lo que el panel sí captura, igual que su PDF. La marca «BORRADOR» de la portada
  depende de esa revisión y se deja vacía por la misma razón.

  Uso: node tools/plantilla-07.mjs <07_OpinionValor.xlsx del titular> [salida]
*/
import { readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";

const [, , source, target = "public/plantillas/07_OpinionValor.xlsx"] = process.argv;
if (!source) { console.error("Uso: node tools/plantilla-07.mjs <07_OpinionValor.xlsx> [salida]"); process.exit(1); }

const comparables = (filas, q0) => Object.fromEntries(filas.flatMap((row, i) => {
  const q = q0 + 19 * i; // ficha de captura del comparable i: precio en Q(q+7), moneda en Q(q+6)
  return [[`E${row}`, `IF(AND(ISNUMBER(Q${q + 7}),Q${q + 7}>0),Q${q + 7}*IF(Q${q + 6}="USD",'2. Antecedentes'!$Q$16,1),"")`], [`K${row}`, `IF(ISNUMBER(E${row}),PRODUCT(G${row}:J${row}),"")`]];
}));

/** Hoja (número de sheetN.xml) → celda → fórmula simplificada, sin el signo «=». */
const FORMULAS = {
  1: { A42: `""` },
  7: { ...comparables([11, 12, 13, 14, 15], 11), L16: `IF(COUNT(L11:L15)>=3,AVERAGE(L11:L15),"")`, J21: `IF(AND(ISNUMBER(D19),D19>0,ISNUMBER(J19)),D19*J19*IF(ISNUMBER(D20),D20,1),"")` },
  8: { ...comparables([11, 12, 13, 14, 15], 11), L16: `IF(COUNT(L11:L15)>=3,AVERAGE(L11:L15),"")`, J21: `IF(AND(ISNUMBER(D19),D19>0,ISNUMBER(J19),'2. Antecedentes'!Q13<>"Terreno"),D19*J19*IF(ISNUMBER(D20),D20,1),"")` },
  9: { ...comparables([12, 13, 14, 15, 16], 11), L17: `IF(COUNT(L12:L16)>=3,AVERAGE(L12:L16),"")`, H34: `IF(AND(ISNUMBER(H31),ISNUMBER(H32),H32>0,H32<1),H31/H32,"")` },
  10: { L19: `IF(COUNT(L15:L18)>0,SUM(L15:L18),"")`, K26: `SUM(K23:K25)` },
  11: { I16: `IF(ISNUMBER(I14),ROUND(I14/IF(AND(ISNUMBER(Q9),Q9>0),Q9,1),0)*IF(AND(ISNUMBER(Q9),Q9>0),Q9,1),"")` },
};
const xml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const zip = await JSZip.loadAsync(await readFile(source));
for (const [hoja, cells] of Object.entries(FORMULAS)) {
  const name = `xl/worksheets/sheet${hoja}.xml`;
  let sheet = await zip.file(name).async("string");
  for (const [ref, formula] of Object.entries(cells)) {
    const pattern = new RegExp(`<c r="${ref}"([^>]*?)>[\\s\\S]*?</c>`);
    const match = sheet.match(pattern);
    if (!match || !/<f>/.test(match[0])) throw new Error(`${name}: ${ref} no tiene fórmula en la plantilla; revisar el mapa`);
    // Sin valor guardado: Excel lo recalcula al abrir (fullCalcOnLoad). El tipo «str» se quita con el valor.
    const cell = `<c r="${ref}"${match[1].replace(/ t="[^"]*"/, "")}><f>${xml(formula)}</f></c>`;
    sheet = sheet.replace(pattern, () => cell); // función: «$1» de las fórmulas no es un grupo de la expresión

  }
  zip.file(name, sheet);
}
const workbook = await zip.file("xl/workbook.xml").async("string");
zip.file("xl/workbook.xml", workbook.replace(/<calcPr([^>]*?)\s*\/>/, (all, attrs) => attrs.includes("fullCalcOnLoad") ? all : `<calcPr${attrs} fullCalcOnLoad="1"/>`));
await writeFile(target, await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }));
console.log(`Plantilla del 07 lista en ${target}`);
