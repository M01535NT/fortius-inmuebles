#!/usr/bin/env node
/*
  Catálogo de códigos postales de Baja California (CSR-03).
  Descarga el catálogo abierto de Correos de México, se queda solo con Baja California y lo
  escribe en src/data/codigos-postales-bc.json. El archivo no se versiona: la fuente lo entrega
  gratis para uso particular y no permite redistribuirlo, así que cada entorno lo genera con
  esta herramienta. Con --si-falta solo descarga cuando el archivo no existe (para la build).

  Uso: node tools/sepomex-bc.mjs [--si-falta]
*/
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const FUENTE = "https://www.correosdemexico.gob.mx/datosabiertos/cp/cpdescarga.txt";
const DESTINO = resolve(process.cwd(), "src/data/codigos-postales-bc.json");
const ESTADO_BC = "02";

async function main() {
  if (process.argv.includes("--si-falta") && existsSync(DESTINO)) { console.log("Catálogo de códigos postales ya presente."); return; }
  const response = await fetch(FUENTE, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`No se pudo descargar el catálogo (${response.status})`);
  const texto = new TextDecoder("latin1").decode(await response.arrayBuffer());
  const lineas = texto.split(/\r?\n/);
  const encabezado = lineas.find(linea => linea.startsWith("d_codigo|"));
  if (!encabezado) throw new Error("El catálogo no tiene el encabezado esperado");
  const columnas = encabezado.split("|");
  const col = nombre => { const i = columnas.indexOf(nombre); if (i < 0) throw new Error(`Falta la columna ${nombre}`); return i; };
  const iCp = col("d_codigo"), iColonia = col("d_asenta"), iTipo = col("d_tipo_asenta"), iMunicipio = col("D_mnpio"), iEstado = col("c_estado"), iCiudad = col("d_ciudad");
  const porCp = new Map();
  for (const linea of lineas) {
    if (!linea || linea === encabezado || !/^\d{5}\|/.test(linea)) continue;
    const campos = linea.split("|");
    if (campos[iEstado] !== ESTADO_BC) continue;
    const cp = campos[iCp];
    const entrada = porCp.get(cp) ?? { municipio: campos[iMunicipio], ciudad: campos[iCiudad] || undefined, colonias: [] };
    const nombre = campos[iTipo] && campos[iTipo] !== "Colonia" ? `${campos[iColonia]} (${campos[iTipo]})` : campos[iColonia];
    if (!entrada.colonias.includes(nombre)) entrada.colonias.push(nombre);
    porCp.set(cp, entrada);
  }
  if (porCp.size < 100) throw new Error(`Se leyeron muy pocos códigos postales de Baja California (${porCp.size})`);
  const salida = { estado: "Baja California", fuente: "Correos de México, catálogo nacional de códigos postales (datos abiertos)", descargadoEl: new Date().toISOString().slice(0, 10), cp: Object.fromEntries([...porCp].sort(([a], [b]) => a.localeCompare(b))) };
  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify(salida));
  console.log(`Catálogo escrito: ${porCp.size} códigos postales de Baja California en ${DESTINO}`);
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
