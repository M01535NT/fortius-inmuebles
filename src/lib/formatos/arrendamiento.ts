import type { FormatoField } from "./catalog";

/*
  20 · Contrato de arrendamiento (DOC-14). El titular pidió el 13/11/2026 que el agente lo
  redactara «estándar y flexible» y aprobó el texto ese mismo día: un solo contrato para casa
  habitación o para uso comercial u oficina, con opciones que se eligen al capturar. En el PDF y
  el Word solo sale lo elegido. No cita artículos de ley; antes de firmarlo con clientes lo revisa
  el abogado (regla de formatos de AGENTS.md).
*/

const field = (section: string, key: string, label: string, type: FormatoField["type"] = "text", required = true): FormatoField => ({ section, key, label, type, required });
const choice = (section: string, key: string, label: string, options: string[][]): FormatoField => ({ ...field(section, key, label, "choice"), options: options.map(([value, label]) => ({ value, label })) });
const SI_NO = [["no", "No"], ["si", "Sí"]];
const PERSONA = [["fisica", "Persona física"], ["moral", "Empresa (persona moral)"]];
const s = ["01 / Arrendador", "02 / Arrendatario", "03 / Inmueble y uso", "04 / Plazo y renta", "05 / Depósito y garantía", "06 / Servicios, reparaciones y seguros", "07 / Terminación y firma"];

export const arrendamientoFields: FormatoField[] = [
  field(s[0], "folio", "Folio del expediente"),
  choice(s[0], "arrendadorTipo", "El arrendador es", PERSONA),
  field(s[0], "arrendador", "Nombre o razón social del arrendador"),
  field(s[0], "arrendadorNacionalidad", "Nacionalidad del arrendador"),
  field(s[0], "arrendadorIdentificacion", "Identificación del arrendador"),
  field(s[0], "arrendadorRfc", "RFC del arrendador"),
  field(s[0], "arrendadorActa", "Acta constitutiva del arrendador", "long"),
  field(s[0], "arrendadorRepresentante", "Representante del arrendador"),
  field(s[0], "arrendadorPoder", "Poder del representante del arrendador", "long"),
  choice(s[0], "arrendadorCaracter", "El arrendador firma como", [["propietario", "Propietario"], ["facultado", "Facultado por el propietario"]]),
  field(s[0], "tituloPropiedad", "Escritura o título de propiedad", "long"),
  field(s[0], "datosRegistrales", "Datos de inscripción en el Registro Público"),
  choice(s[0], "caracterFacultado", "Carácter del arrendador", [["apoderado", "Apoderado"], ["usufructuario", "Usufructuario"], ["administrador", "Administrador"]]),
  field(s[0], "documentoFacultades", "Documento que le da facultades", "long"),
  field(s[0], "propietarioNombre", "Nombre del propietario"),
  field(s[0], "arrendadorDomicilio", "Domicilio del arrendador para notificaciones", "long"),
  field(s[0], "arrendadorCorreo", "Correo del arrendador"),

  choice(s[1], "arrendatarioTipo", "El arrendatario es", PERSONA),
  field(s[1], "arrendatario", "Nombre o razón social del arrendatario"),
  field(s[1], "arrendatarioNacionalidad", "Nacionalidad del arrendatario"),
  field(s[1], "arrendatarioIdentificacion", "Identificación del arrendatario"),
  field(s[1], "arrendatarioRfc", "RFC del arrendatario"),
  field(s[1], "arrendatarioActa", "Acta constitutiva del arrendatario", "long"),
  field(s[1], "arrendatarioRepresentante", "Representante del arrendatario"),
  field(s[1], "arrendatarioPoder", "Poder del representante del arrendatario", "long"),
  field(s[1], "arrendatarioDomicilio", "Domicilio del arrendatario para notificaciones", "long"),
  field(s[1], "arrendatarioCorreo", "Correo del arrendatario"),
  choice(s[1], "porCuentaDeOtro", "¿Renta por cuenta de otra persona?", SI_NO),
  field(s[1], "beneficiario", "Persona por cuya cuenta renta"),

  field(s[2], "inmueble", "Domicilio del inmueble", "long"),
  field(s[2], "superficieTerreno", "Superficie de terreno (m²)", "number"),
  field(s[2], "superficieConstruccion", "Superficie de construcción (m²)", "number"),
  field(s[2], "claveCatastral", "Clave catastral"),
  field(s[2], "accesorios", "Lo que se renta con el inmueble (estacionamiento, bodega, muebles) o «ninguno»", "long"),
  choice(s[2], "condominio", "¿Está en condominio?", SI_NO),
  choice(s[2], "uso", "Uso del inmueble", [["habitacion", "Casa habitación"], ["comercial", "Comercial u oficina"]]),
  field(s[2], "ocupantesMaximo", "Máximo de personas que lo habitan", "number"),
  field(s[2], "giro", "Giro o actividad", "long"),
  choice(s[2], "mascotas", "¿Se permiten mascotas?", SI_NO),
  field(s[2], "mascotasMaximo", "Máximo de mascotas", "number"),

  field(s[3], "plazo", "Plazo (por ejemplo, «un año»)"),
  field(s[3], "fechaInicio", "Inicio del arrendamiento", "date"),
  field(s[3], "fechaTermino", "Término del arrendamiento", "date"),
  field(s[3], "diasAvisoRenovacion", "Días de aviso para no renovar", "number"),
  field(s[3], "rentaMensual", "Renta mensual en MXN", "money"),
  choice(s[3], "causaIva", "¿La renta causa IVA?", SI_NO),
  field(s[3], "diaPago", "Día del mes para pagar la renta", "number"),
  choice(s[3], "primeraProporcional", "¿Inicia a mitad de mes?", SI_NO),
  choice(s[3], "retencion", "¿El arrendatario retiene impuestos de la renta?", SI_NO),
  choice(s[3], "actualizacion", "Actualización de la renta", [["inpc", "Por inflación (INPC)"], ["porcentaje", "Porcentaje fijo"]]),
  field(s[3], "periodoActualizacion", "Cada cuánto se actualiza (por ejemplo, «doce meses»)"),
  field(s[3], "fechaPrimeraActualizacion", "Primera actualización", "date"),
  field(s[3], "porcentajeActualizacion", "Porcentaje de actualización", "number"),
  field(s[3], "interesMoratorio", "Interés moratorio mensual en porcentaje", "number"),

  field(s[4], "deposito", "Depósito en MXN", "money"),
  field(s[4], "depositoMeses", "Meses de renta que equivale el depósito", "number"),
  field(s[4], "diasDevolucionDeposito", "Días para devolver el depósito", "number"),
  choice(s[4], "garantia", "Garantía", [["fiador", "Fiador"], ["obligado", "Obligado solidario"], ["ninguna", "Solo el depósito"]]),
  field(s[4], "garante", "Nombre del fiador u obligado solidario"),
  field(s[4], "garanteIdentificacion", "Identificación del fiador u obligado solidario"),
  field(s[4], "garanteDomicilio", "Domicilio del fiador u obligado solidario", "long"),
  choice(s[4], "fiadorConInmueble", "¿El fiador responde con un inmueble?", SI_NO),
  field(s[4], "garanteInmueble", "Domicilio del inmueble del fiador", "long"),
  field(s[4], "garanteTitulo", "Escritura o título del inmueble del fiador", "long"),

  field(s[5], "serviciosArrendatario", "Servicios que paga el arrendatario", "long"),
  field(s[5], "serviciosArrendador", "Otros pagos a cargo del arrendador, o «ninguno»", "long"),
  field(s[5], "diasReparacion", "Días para que el arrendador haga una reparación", "number"),
  field(s[5], "montoReparacionMenor", "Monto de una reparación menor a cargo del arrendatario", "money"),
  choice(s[5], "seguroRc", "¿El arrendatario contrata seguro de responsabilidad civil?", SI_NO),
  field(s[5], "sumaAsegurada", "Suma asegurada del seguro de responsabilidad civil", "money"),
  choice(s[5], "seguroInmueble", "¿El arrendador asegura el inmueble?", SI_NO),

  choice(s[6], "terminacion", "Salida anticipada del arrendatario", [["pena", "Con penalidad"], ["plazo_minimo", "Sin penalidad después de un plazo mínimo"]]),
  field(s[6], "diasAvisoTerminacion", "Días de aviso para salir antes", "number"),
  field(s[6], "mesesMinimos", "Meses mínimos antes de poder salir sin penalidad", "number"),
  field(s[6], "mesesPena", "Meses de renta de penalidad", "number"),
  field(s[6], "rentasRescision", "Rentas sin pagar que permiten rescindir", "number"),
  field(s[6], "porcentajeRetencion", "Recargo diario por no entregar a tiempo, en porcentaje", "number"),
  field(s[6], "ciudadJurisdiccion", "Ciudad de los tribunales"),
  field(s[6], "ciudadFirma", "Ciudad de firma"),
  field(s[6], "fechaFirma", "Fecha de firma", "date"),
  field(s[6], "numeroTantos", "Número de tantos", "number"),
];

/** Campos que solo aplican según lo elegido. */
export function mostrarCampoArrendamiento(key: string, d: Record<string, unknown>): boolean {
  const moralDor = d.arrendadorTipo === "moral", moralTario = d.arrendatarioTipo === "moral";
  if (["arrendadorNacionalidad", "arrendadorIdentificacion"].includes(key)) return !moralDor;
  if (["arrendadorActa", "arrendadorRepresentante", "arrendadorPoder"].includes(key)) return moralDor;
  if (["tituloPropiedad", "datosRegistrales"].includes(key)) return d.arrendadorCaracter !== "facultado";
  if (["caracterFacultado", "documentoFacultades", "propietarioNombre"].includes(key)) return d.arrendadorCaracter === "facultado";
  if (["arrendatarioNacionalidad", "arrendatarioIdentificacion"].includes(key)) return !moralTario;
  if (["arrendatarioActa", "arrendatarioRepresentante", "arrendatarioPoder"].includes(key)) return moralTario;
  if (key === "beneficiario") return d.porCuentaDeOtro === "si";
  if (key === "ocupantesMaximo") return d.uso !== "comercial";
  if (key === "giro") return d.uso === "comercial";
  if (key === "mascotasMaximo") return d.mascotas === "si";
  if (key === "porcentajeActualizacion") return d.actualizacion === "porcentaje";
  if (["garante", "garanteIdentificacion", "garanteDomicilio"].includes(key)) return d.garantia === "fiador" || d.garantia === "obligado";
  if (key === "fiadorConInmueble") return d.garantia === "fiador";
  if (["garanteInmueble", "garanteTitulo"].includes(key)) return d.garantia === "fiador" && d.fiadorConInmueble === "si";
  if (key === "sumaAsegurada") return d.seguroRc === "si";
  if (key === "mesesMinimos") return d.terminacion === "plazo_minimo";
  return true;
}

const fechaValida = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const entero = (value: unknown, min: number, max: number) => value === undefined || value === null || value === "" || (Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max);
const correo = (value: unknown) => value === undefined || value === null || value === "" || (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()));

/** Reglas de congruencia; un dato vacío no es error aquí (sale como línea en blanco, RP-77). */
export function validarArrendamiento(d: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (fechaValida(d.fechaInicio) && fechaValida(d.fechaTermino) && d.fechaTermino <= d.fechaInicio) errors.push("El término debe ser posterior al inicio");
  if (!entero(d.diaPago, 1, 31)) errors.push("Día de pago entre 1 y 31");
  for (const [key, label] of [["porcentajeActualizacion", "Porcentaje de actualización"], ["interesMoratorio", "Interés moratorio"], ["porcentajeRetencion", "Recargo diario"]] as const)
    if (d[key] !== undefined && d[key] !== "" && (typeof d[key] !== "number" || d[key] < 0 || d[key] > 100)) errors.push(`${label} entre 0 y 100`);
  for (const [key, label, min] of [["ocupantesMaximo", "Máximo de ocupantes", 1], ["mascotasMaximo", "Máximo de mascotas", 1], ["rentasRescision", "Rentas para rescindir", 1], ["numeroTantos", "Número de tantos", 2], ["diasAvisoRenovacion", "Días de aviso para no renovar", 0], ["diasDevolucionDeposito", "Días para devolver el depósito", 0], ["diasReparacion", "Días para reparar", 0], ["diasAvisoTerminacion", "Días de aviso para salir antes", 0], ["mesesMinimos", "Meses mínimos", 0], ["mesesPena", "Meses de penalidad", 0], ["depositoMeses", "Meses de depósito", 0]] as const)
    if (!entero(d[key], min, 9999)) errors.push(`${label} en número entero`);
  if (!correo(d.arrendadorCorreo)) errors.push("Correo del arrendador");
  if (!correo(d.arrendatarioCorreo)) errors.push("Correo del arrendatario");
  if (typeof d.rentaMensual === "number" && d.rentaMensual === 0) errors.push("Renta mensual mayor que cero");
  return errors;
}
