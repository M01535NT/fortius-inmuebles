/*
  Deducir en vez de preguntar (CSR-03, titular, 31/10/2026). Reglas fijas, sin servicios externos:
  la CURP trae fecha de nacimiento, sexo y entidad; el RFC y la clave catastral se comprueban por
  su forma. Nada de esto decide: lo deducido entra «por confirmar» y el asesor lo revisa.
*/

export const ENTIDADES_CURP: Record<string, string> = {
  AS: "Aguascalientes", BC: "Baja California", BS: "Baja California Sur", CC: "Campeche", CL: "Coahuila", CM: "Colima", CS: "Chiapas", CH: "Chihuahua",
  DF: "Ciudad de México", DG: "Durango", GT: "Guanajuato", GR: "Guerrero", HG: "Hidalgo", JC: "Jalisco", MC: "Estado de México", MN: "Michoacán",
  MS: "Morelos", NT: "Nayarit", NL: "Nuevo León", OC: "Oaxaca", PL: "Puebla", QT: "Querétaro", QR: "Quintana Roo", SP: "San Luis Potosí", SL: "Sinaloa",
  SR: "Sonora", TC: "Tabasco", TS: "Tamaulipas", TL: "Tlaxcala", VZ: "Veracruz", YN: "Yucatán", ZS: "Zacatecas", NE: "Nacido en el extranjero",
};

const CURP = /^([A-Z][AEIOUX][A-Z]{2})(\d{2})(\d{2})(\d{2})([HM])([A-Z]{2})([B-DF-HJ-NP-TV-Z]{3})([A-Z\d])(\d)$/;
const RFC = /^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{3})$/;

export const normalizarClave = (texto: string) => texto.replace(/\s+/g, "").toUpperCase();

/** Fecha AAAA-MM-DD a partir de los seis dígitos AAMMDD; el siglo se decide con el año actual. Devuelve undefined si no existe en el calendario. */
function fechaDeSeisDigitos(aa: string, mm: string, dd: string, siglo?: "19" | "20"): string | undefined {
  const dosDigitos = Number(aa);
  const anio = siglo ? Number(`${siglo}${aa}`) : (dosDigitos <= Number(String(new Date().getUTCFullYear()).slice(2)) ? 2000 + dosDigitos : 1900 + dosDigitos);
  const iso = `${anio}-${mm}-${dd}`;
  const fecha = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== iso ? undefined : iso;
}

export type DatosCurp = { fechaNacimiento: string; sexo: "Hombre" | "Mujer"; entidad: string; entidadClave: string };

/** Lo que dice una CURP válida: fecha de nacimiento, sexo y entidad. undefined si la CURP no tiene la forma correcta. */
export function datosDeCurp(texto: string): DatosCurp | undefined {
  const curp = normalizarClave(texto);
  const m = CURP.exec(curp);
  if (!m) return undefined;
  const [, , aa, mm, dd, sexo, entidadClave, , homoclave] = m;
  // Antes del año 2000 el penúltimo carácter es un dígito; desde el 2000, una letra.
  const siglo = /\d/.test(homoclave) ? "19" : "20";
  const fechaNacimiento = fechaDeSeisDigitos(aa, mm, dd, siglo);
  const entidad = ENTIDADES_CURP[entidadClave];
  if (!fechaNacimiento || !entidad) return undefined;
  return { fechaNacimiento, sexo: sexo === "H" ? "Hombre" : "Mujer", entidad, entidadClave };
}

export const curpValida = (texto: string) => datosDeCurp(texto) !== undefined;

/** Un RFC con la forma correcta (persona física de 13 o moral de 12) y la fecha que contiene, si existe. */
export function datosDeRfc(texto: string): { tipo: "fisica" | "moral"; fecha?: string } | undefined {
  const rfc = normalizarClave(texto);
  const m = RFC.exec(rfc);
  if (!m) return undefined;
  const [, iniciales, aa, mm, dd] = m;
  return { tipo: iniciales.length === 4 ? "fisica" : "moral", fecha: fechaDeSeisDigitos(aa, mm, dd) };
}
export const rfcValido = (texto: string) => datosDeRfc(texto) !== undefined;

/** Clave catastral de Baja California: dígitos y guiones, entre 10 y 24 cifras (los municipios varían en el formato). */
export function claveCatastralValida(texto: string): boolean {
  const clave = texto.replace(/[\s-]/g, "");
  return /^\d{10,24}$/.test(clave);
}

export type Colonia = { cp: string; colonia: string; municipio: string; ciudad?: string };
export type CatalogoCp = { estado: string; descargadoEl: string; cp: Record<string, { municipio: string; ciudad?: string; colonias: string[] }> };

/** Colonias de un código postal según el catálogo cargado; vacío si el código no existe en él. */
export function coloniasDe(catalogo: CatalogoCp | null | undefined, texto: string): Colonia[] {
  const cp = texto.replace(/\D/g, "");
  const entrada = cp.length === 5 ? catalogo?.cp[cp] : undefined;
  if (!entrada) return [];
  return entrada.colonias.map(colonia => ({ cp, colonia, municipio: entrada.municipio, ciudad: entrada.ciudad }));
}

/** Un domicilio escrito como se imprime: calle y número, colonia, código postal, municipio, estado. */
export function domicilioDesde(calleYNumero: string, colonia: Colonia, estado = "Baja California"): string {
  return [calleYNumero.trim(), colonia.colonia, `C.P. ${colonia.cp}`, colonia.municipio, estado].filter(Boolean).join(", ");
}
