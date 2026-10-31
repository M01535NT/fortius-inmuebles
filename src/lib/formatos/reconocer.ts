import { DATOS_EXPEDIENTE, type DatosGuardados } from "./datos-expediente";
import { curpValida, normalizarClave, rfcValido } from "./deducir";

/*
  Pegar y reconocer (CSR-07, titular, 31/10/2026). El asesor pega un texto (el correo del notario,
  un mensaje del cliente) y el sistema reconoce con patrones fijos lo que tiene forma propia: CURP,
  RFC, folio real, clave catastral, partida, escritura, teléfono y correo. No es inteligencia
  artificial: no interpreta, no adivina nombres ni montos. Todo entra «por confirmar» con la frase
  de donde salió.
*/

export type Reconocido = { clave: string; valor: string | number; cita: string };

const MESES: Record<string, string> = { enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06", julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10", noviembre: "11", diciembre: "12" };
const frase = (texto: string, indice: number, largo: number) => texto.slice(Math.max(0, indice - 40), Math.min(texto.length, indice + largo + 40)).replace(/\s+/g, " ").trim();

/** «2 de mayo de 2010» o «02/05/2010» → 2010-05-02. */
export function fechaEnTexto(texto: string): string | undefined {
  const letras = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de\s+|del\s+)?(\d{4})/i.exec(texto);
  if (letras) {
    const mes = MESES[letras[2].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")] ?? MESES[letras[2].toLowerCase()];
    if (mes) return `${letras[3]}-${mes}-${letras[1].padStart(2, "0")}`;
  }
  const numeros = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(texto);
  if (numeros) return `${numeros[3]}-${numeros[2].padStart(2, "0")}-${numeros[1].padStart(2, "0")}`;
  return undefined;
}

/** Lo que el texto dice con forma propia, en el orden en que aparece; un dato por clave (el primero gana). */
export function reconocerTexto(texto: string): Reconocido[] {
  const encontrados: Reconocido[] = [];
  const anota = (clave: string, valor: string | number, indice: number, largo: number) => { if (!encontrados.some(item => item.clave === clave)) encontrados.push({ clave, valor, cita: frase(texto, indice, largo) }); };
  for (const m of texto.matchAll(/\b[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z\d]\d\b/gi)) if (curpValida(m[0])) anota("propietarioCurp", normalizarClave(m[0]), m.index, m[0].length);
  for (const m of texto.matchAll(/\b[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}\b/gi)) {
    const clave = normalizarClave(m[0]);
    if (rfcValido(clave) && !curpValida(clave) && !encontrados.some(item => item.clave === "propietarioRfc")) anota("propietarioRfc", clave, m.index, m[0].length);
  }
  const conEtiqueta = (etiqueta: RegExp, clave: string, limpiar: (valor: string) => string | number = valor => valor.trim()) => {
    const m = etiqueta.exec(texto);
    if (m && m[1].trim()) anota(clave, limpiar(m[1]), m.index, m[0].length);
  };
  conEtiqueta(/folio\s+real(?:\s+n[úu]mero|\s+no\.?)?\s*[:#]?\s*([\d][\d.,/-]*)/i, "folioReal", valor => valor.replace(/[.,]+$/, ""));
  conEtiqueta(/clave\s+catastral(?:\s+n[úu]mero|\s+no\.?)?\s*[:#]?\s*([\d][\d-]*)/i, "claveCatastral");
  conEtiqueta(/partida(?:\s+registral)?(?:\s+n[úu]mero|\s+no\.?)?\s*[:#]?\s*([\d][\d.,/-]*)/i, "partida", valor => valor.replace(/[.,]+$/, ""));
  const escritura = /escritura(?:\s+p[úu]blica)?(?:\s+n[úu]mero|\s+no\.?)?\s*[:#]?\s*([\d][\d.,]*)/i.exec(texto);
  if (escritura) {
    // La misma oración (hasta el punto final) suele traer la fecha y la notaría.
    const resto = texto.slice(escritura.index);
    const fin = resto.search(/\.(?=\s|$)|\n/);
    const oracion = fin === -1 ? resto : resto.slice(0, fin);
    const fecha = fechaEnTexto(oracion);
    const notaria = /notar[ií]a(?:\s+p[úu]blica)?(?:\s+n[úu]mero|\s+no\.?)?\s*[:#]?\s*(\d+)/i.exec(oracion)?.[1];
    const partes = [`escritura ${escritura[1].replace(/[.,]+$/, "")}`, fecha ? `del ${fecha}` : "", notaria ? `notaría ${notaria}` : ""].filter(Boolean);
    anota("escritura", partes.join(" "), escritura.index, oracion.length);
  }
  const telefono = /(?:tel[ée]fono|cel(?:ular)?|whatsapp)\s*[:#]?\s*(\+?\d[\d\s-]{8,}\d)/i.exec(texto);
  if (telefono) anota("propietarioTelefono", telefono[1].replace(/[\s-]/g, ""), telefono.index, telefono[0].length);
  const correo = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i.exec(texto);
  if (correo) anota("propietarioCorreo", correo[0].toLowerCase(), correo.index, correo[0].length);
  const nacimiento = /(?:naci[óo]|fecha\s+de\s+nacimiento)[^.\n]{0,20}?((?:\d{1,2}\s+de\s+[a-záéíóú]+\s+(?:de\s+|del\s+)?\d{4})|(?:\d{1,2}[/-]\d{1,2}[/-]\d{4}))/i.exec(texto);
  if (nacimiento) { const fecha = fechaEnTexto(nacimiento[1]); if (fecha) anota("propietarioNacimiento", fecha, nacimiento.index, nacimiento[0].length); }
  const superficie = (etiqueta: RegExp, clave: string) => {
    const m = etiqueta.exec(texto);
    if (!m) return;
    const numero = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(numero) && numero > 0) anota(clave, numero, m.index, m[0].length);
  };
  superficie(/(?:superficie\s+(?:de\s+)?terreno|terreno\s+de)\s*[:#]?\s*([\d][\d,]*(?:\.\d+)?)\s*m/i, "superficieTerreno");
  superficie(/(?:superficie\s+(?:de\s+)?construcci[óo]n|construcci[óo]n\s+de)\s*[:#]?\s*([\d][\d,]*(?:\.\d+)?)\s*m/i, "superficieConstruccion");
  return encontrados.filter(item => DATOS_EXPEDIENTE.some(def => def.clave === item.clave));
}

/** Lo reconocido como datos «por confirmar», sin pisar lo que ya está en el expediente. */
export function proponerReconocido(actuales: DatosGuardados, reconocido: Reconocido[], ahora: string, origen = "Texto pegado"): { datos: DatosGuardados; propuestos: string[] } {
  const datos: DatosGuardados = { ...actuales };
  const propuestos: string[] = [];
  for (const item of reconocido) {
    if (actuales[item.clave]) continue;
    datos[item.clave] = { valor: item.valor, estado: "propuesto", fuente: { documento: origen, cita: item.cita.slice(0, 200) }, actualizadoEl: ahora };
    propuestos.push(item.clave);
  }
  return { datos, propuestos };
}
