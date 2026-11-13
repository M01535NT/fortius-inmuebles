import { z } from "zod";

/*
  FCH-03: datos de Fortius como empresa, que el director captura una vez en Configuración y que los
  documentos usan (prestador del 09, responsable del 01 y demás). Viven en el registro de
  Configuración bajo `empresa`; solo el director los cambia (la base lo exige desde COR-23) y nunca
  salen en la proyección pública. Lo que no se ha capturado queda vacío: no se inventa ningún dato
  (la razón social de la persona moral todavía no la tiene el titular, 13/11/2026).

  Este módulo no usa nada del servidor: lo leen la pantalla, los generadores de formatos en el
  navegador y el servidor por igual.
*/
const texto = (max: number) => z.string().trim().max(max);
const fecha = z.iso.date().or(z.literal(""));

export const DATOS_FORTIUS_CAMPOS = [
  { clave: "razonSocial", etiqueta: "Razón social", ayuda: "Tal como aparece en el acta constitutiva y en el SAT.", max: 200 },
  { clave: "rfc", etiqueta: "RFC", ayuda: "12 caracteres para persona moral.", max: 13 },
  { clave: "domicilio", etiqueta: "Domicilio fiscal y para notificaciones", ayuda: "Calle, número, colonia, código postal, ciudad y estado.", max: 400, largo: true },
  { clave: "correo", etiqueta: "Correo para contratos y avisos", max: 254 },
  { clave: "telefono", etiqueta: "Teléfono de la empresa", max: 40 },
  { clave: "representante", etiqueta: "Representante legal", ayuda: "Quien firma los contratos por Fortius.", max: 160 },
  { clave: "calidadRepresentante", etiqueta: "Cargo del representante", ayuda: "Por ejemplo: administrador único o apoderado.", max: 120 },
  { clave: "facultades", etiqueta: "Escritura o poder del representante", ayuda: "Número, fecha, notaría y lo que le permite firmar.", max: 1000, largo: true },
  { clave: "licenciaNumero", etiqueta: "Número de licencia estatal", max: 80 },
  { clave: "licenciaVigencia", etiqueta: "Vigencia de la licencia", tipo: "fecha" },
] as const;

export type ClaveDatoFortius = (typeof DATOS_FORTIUS_CAMPOS)[number]["clave"];
/** Todos los campos, siempre presentes: cadena vacía cuando no se ha capturado. `licenciaVigencia`: AAAA-MM-DD o vacío. */
export type DatosFortius = Record<ClaveDatoFortius, string>;

export const datosFortiusSchema = z.object({
  razonSocial: texto(200), rfc: z.string().trim().toUpperCase().regex(/^([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})?$/, "RFC inválido"),
  domicilio: texto(400), correo: z.email().max(254).or(z.literal("")), telefono: texto(40),
  representante: texto(160), calidadRepresentante: texto(120), facultades: texto(1000),
  licenciaNumero: texto(80), licenciaVigencia: fecha,
}).partial().strip();

export const DATOS_FORTIUS_VACIOS: DatosFortius = Object.fromEntries(DATOS_FORTIUS_CAMPOS.map(c => [c.clave, ""])) as DatosFortius;

/**
  Lectura tipada de los datos de Fortius a partir del registro de Configuración (o de lo que
  devuelva `settingsStore.get()`). Nunca lanza: un valor dañado o ausente sale vacío.
*/
export function datosFortius(config: unknown): DatosFortius {
  const empresa = config && typeof config === "object" ? (config as { empresa?: unknown }).empresa : undefined;
  const datos = { ...DATOS_FORTIUS_VACIOS };
  if (!empresa || typeof empresa !== "object") return datos;
  for (const campo of DATOS_FORTIUS_CAMPOS) {
    const parsed = datosFortiusSchema.shape[campo.clave].safeParse((empresa as Record<string, unknown>)[campo.clave]);
    if (parsed.success && typeof parsed.data === "string") datos[campo.clave] = parsed.data;
  }
  return datos;
}

/** Qué falta por capturar, con su etiqueta, para avisarlo en Configuración o en un documento. */
export function faltantesFortius(datos: DatosFortius, claves: readonly ClaveDatoFortius[] = DATOS_FORTIUS_CAMPOS.map(c => c.clave)): string[] {
  return claves.filter(clave => !datos[clave]).map(clave => DATOS_FORTIUS_CAMPOS.find(c => c.clave === clave)!.etiqueta);
}

/**
  Equivalencia con los campos del 09 (prestador). Formatos la usa para prellenar; los campos que el
  asesor ya escribió en el borrador no se pisan (eso lo decide el generador).
*/
export function prestadorDel09(datos: DatosFortius): Record<string, string> {
  const campos: Record<string, string> = {
    prestador: datos.razonSocial, rfcPrestador: datos.rfc, domicilioPrestador: datos.domicilio, correoPrestador: datos.correo, telefonoPrestador: datos.telefono,
    representantePrestador: datos.representante, calidadRepresentante: datos.calidadRepresentante, facultadesPrestador: datos.facultades,
    firmantePrestador: datos.representante, licenciaNumero: datos.licenciaNumero, licenciaVigencia: datos.licenciaVigencia,
  };
  // Solo lo capturado: un dato vacío no borra lo que el borrador ya tenga.
  return Object.fromEntries(Object.entries(campos).filter(([, valor]) => valor));
}
