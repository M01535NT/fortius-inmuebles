import { calcularIntermediacion } from "../intermediacion";
import { INTERMEDIACION_CLAUSES } from "../intermediacion-text";
import { importePromesaLetra } from "../promesa";
import { BLANK, dinero, fecha, filas, v, type Block, type Documento } from "./modelo";

/*
  09 · Contrato de intermediación inmobiliaria para venta, con el texto, las condiciones
  particulares y las cláusulas de la plantilla (Metodología/09...docx), en estilo contrato.
  Su PDF sigue bloqueado hasta cotejar el modelo registrado; este documento sirve para el Word.
*/

type Data = Record<string, unknown>;
const lines = (items: string[]) => items.length ? items.join("\n") : BLANK;
const days = (from: unknown, to: unknown) => typeof from === "string" && typeof to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)
  ? `${Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5) + 1} días naturales` : BLANK;
const LEAD = /^((?:[A-ZÁÉÍÓÚÑ]+ )*[A-ZÁÉÍÓÚÑ]+(?: BIS)?\. [^.]+\.)\s+/;

export function intermediacionDocumento(d: Data): Documento {
  const clientes = filas(d.clientesContrato);
  const calc = calcularIntermediacion(d);
  const representante = d.comparecePrestador === "representante";
  const aviso = [d.medioAvisoPrivacidad, d.fechaAvisoPrivacidad ? fecha(d.fechaAvisoPrivacidad) : "", d.referenciaAvisoPrivacidad].filter(x => typeof x === "string" && x.trim()).join(", ");
  const clauses: Block[] = [];
  INTERMEDIACION_CLAUSES.forEach(text => {
    const filled = text.replace("[MEDIO Y FECHA DEL AVISO]", aviso || BLANK);
    const match = filled.match(LEAD);
    if (match) {
      // Las cláusulas se agrupan bajo «Cláusulas», como en la plantilla (se repite antes de cuarta, quinta y novena).
      if (/^(QUINTA|NOVENA)\./.test(match[1])) clauses.push({ kind: "center", text: "Cláusulas" });
      clauses.push({ kind: "clause", lead: match[1], text: filled.slice(match[0].length) });
    } else clauses.push({ kind: "p", text: filled });
  });
  let pena = BLANK;
  try { if (typeof d.penaMaxima === "number") pena = importePromesaLetra(d.penaMaxima, "MXN"); } catch { /* importe fuera de rango: queda la línea */ }
  const blocks: Block[] = [
    { kind: "p", text: `CONTRATO DE PRESTACIÓN DE SERVICIOS DE INTERMEDIACIÓN INMOBILIARIA PARA VENTA que celebran ${clientes.length ? clientes.map(c => v(c.nombre)).join(" y ") : BLANK}, por propio derecho o mediante la representación indicada en las condiciones particulares, en adelante el CLIENTE, y ${v(d.prestador)}, en adelante el PRESTADOR, por propio derecho o mediante la representación indicada en las condiciones particulares. Ambas partes acuerdan lo siguiente:` },
    { kind: "center", text: "Condiciones particulares" },
    { kind: "fields", widths: [2232, 7992], rows: [
      ["CLIENTE", lines(clientes.map(c => `${v(c.nombre)} · RFC: ${v(c.rfc)}`))],
      ["Representación", lines(clientes.map(c => `Representante, si aplica: ${v(c.representante)}${c.calidadRepresentante ? ` (${String(c.calidadRepresentante)})` : ""} · Documento y facultades: ${v(c.facultades)}`))],
      ["Domicilio y contacto", lines(clientes.map(c => `${v(c.domicilio)} · ${v(c.correo)}${c.telefono ? ` · ${String(c.telefono)}` : ""}`))],
      ["PRESTADOR", `${v(d.prestador)} · RFC: ${v(d.rfcPrestador)} · Marca: Fortius Inmuebles`],
      ["Representación", representante ? `${v(d.representantePrestador)} · ${v(d.calidadRepresentante)} · ${v(d.facultadesPrestador)}` : "Por propio derecho"],
      ["Domicilio y contacto", `${v(d.domicilioPrestador)} · ${v(d.telefonoPrestador)} / ${v(d.correoPrestador)}`],
      ["Inmueble / folio interno", `${v(d.idInmueble)} / Domicilio completo: ${v(d.inmueble)} · Folio real: ${v(d.folioReal)} · Clave catastral: ${v(d.claveCatastral)}`],
      ["Identidad y derecho", `${v(d.tipoInmueble)}, ${v(d.destino)}; ${v(d.superficie)}; accesorios: ${v(d.accesorios)} / Titular y derecho documentado: ${v(d.derecho)} · Instrumento y fecha: ${v(d.titulo)}`],
      ["Situación informada", `Gravámenes, adeudos, ocupación y demás antecedentes informados: ${v(d.gravamenes)}; ocupación: ${v(d.ocupacion)}; restricciones: ${v(d.restricciones)}. Documentos, fechas y pendientes de comprobación: ${v(d.condicionesEncargo)}.`],
      ["Precio autorizado", `Moneda: MXN · Importe: ${dinero(d.precioAutorizado)}. IVA de venta incluido, si aplica: ${dinero(d.ivaVenta)}.`],
      ["Modalidad y vigencia", `Modalidad (exclusiva o no exclusiva): ${d.modalidad === "exclusiva" ? "Exclusiva" : d.modalidad === "no_exclusiva" ? "No exclusiva" : BLANK} · Plazo: ${days(d.inicio, d.fin)} · Del ${fecha(d.inicio)} al ${fecha(d.fin)}, sin renovación automática.`],
      ["Comisión", `${typeof d.comisionPorcentaje === "number" ? d.comisionPorcentaje : BLANK} % sobre la base de la cláusula cuarta; IVA: ${typeof d.ivaComisionTasa === "number" ? `${d.ivaComisionTasa} %` : BLANK}. Total estimado al precio autorizado: ${calc.total === null ? BLANK : dinero(calc.total, "MXN")}.`],
      ["Pena máxima", `Moneda: MXN · Importe máximo: ${dinero(d.penaMaxima)} (${pena}). Naturaleza: compensación convencional por ruptura del encargo; no constituye gasto comprobado ni anticipo. Reducción, reciprocidad y límites: cláusula novena.`],
      ["Prospectos / anexos", `Protección posterior: ${typeof d.proteccionDias === "number" ? (d.proteccionDias === 0 ? "No se pacta" : `${d.proteccionDias} días naturales`) : BLANK}. Excepciones previas: ${d.excepcionesEstado === "ninguna" ? "Ninguna" : lines(filas(d.excepcionesProspectos).map(r => `${v(r.persona)} (${v(r.referencia)})`))}. Anexos incorporados: ${d.anexosEstado === "ninguno" ? "Ninguno" : lines(filas(d.anexosContrato).map(r => `${v(r.documento)}, ${fecha(r.fecha)}, versión ${v(r.version)}`))}.`],
    ] },
    { kind: "center", text: "Declaraciones" },
    { kind: "p", text: "El CLIENTE comprende a todas las personas identificadas que contratan; cada una declara la titularidad o facultades descritas, informa la situación del inmueble y entregará los documentos que las sustenten. El PRESTADOR declara contar con las facultades y autorizaciones consignadas, que deberá acreditar. Ambas partes reconocen como integrantes de este contrato las condiciones particulares y los anexos expresamente identificados; ninguna declaración sustituye la comprobación documental." },
    { kind: "center", text: "Cláusulas" },
    ...clauses,
    { kind: "center", text: "Firmas" },
    { kind: "p", text: `Leído este contrato, las partes lo firman en ${v(d.lugar)}, Baja California, el ${fecha(d.fecha)}.` },
    { kind: "signatures", parties: [
      { role: "CLIENTE", name: clientes.length ? clientes.map(c => `${v(c.firmante ?? c.nombre)}${c.calidadFirma ? `, ${String(c.calidadFirma)}` : ""}`).join("\n") : BLANK },
      { role: "PRESTADOR", name: `${v(d.firmantePrestador ?? d.prestador)}${d.calidadFirmaPrestador ? `, ${String(d.calidadFirmaPrestador)}` : ""}` },
    ] },
  ];
  return { title: "Contrato de intermediación inmobiliaria para venta", subject: `Formato 09 · ${v(d.folio)}`, estilo: "contrato", blocks };
}
