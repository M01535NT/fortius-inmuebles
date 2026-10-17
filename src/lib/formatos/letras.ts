/*
  Importe en letra, como lo arma la plantilla de la opinión de valor (hoja «9. Conciliación»,
  celda Q26): «DOS MILLONES QUINIENTOS MIL PESOS 00/100 M.N.». Hasta 999,999,999.99.
*/

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

/** 0–999 en palabras («uno» se apocopa a «un» delante de «mil», «millón» o «pesos»). */
function grupo(n: number, apocope: boolean): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100), r = n % 100;
  let resto = r < 30 ? UNIDADES[r] : `${DECENAS[Math.floor(r / 10)]}${r % 10 ? ` y ${UNIDADES[r % 10]}` : ""}`;
  if (apocope) resto = resto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
  return [CENTENAS[c], resto].filter(Boolean).join(" ");
}

export function importeEnLetra(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value >= 1e9) return "";
  const entero = Math.floor(value), centavos = Math.round((value - entero) * 100);
  const millones = Math.floor(entero / 1e6), miles = Math.floor((entero % 1e6) / 1000), unidades = entero % 1000;
  const partes = [
    millones === 1 ? "un millón" : millones > 1 ? `${grupo(millones, true)} millones` : "",
    miles === 1 ? "mil" : miles > 1 ? `${grupo(miles, true)} mil` : "",
    millones > 0 && miles === 0 && unidades === 0 ? "de" : "",
    grupo(unidades, true),
  ].filter(Boolean);
  return `${(partes.join(" ") || "cero").toUpperCase()} PESOS ${String(centavos).padStart(2, "0")}/100 M.N.`;
}
