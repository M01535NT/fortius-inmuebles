import { formatoById } from "../catalog";
import { promesaParagraphs } from "../promesa";
import { PROMESA_ORIGINAL } from "../promesa-text";
import { BLANK, a, dinero, fecha, m, v, type Block, type Documento } from "./modelo";

/*
  14 · Propuesta de compra y respuesta del propietario (dos cartas) y 15 · Promesa de
  compraventa, con el texto y el diseño de sus plantillas. La promesa usa las 26
  cláusulas cotejadas del panel; si faltan datos, quedan las líneas para completarse.
*/

type Data = Record<string, unknown>;
const f = (value: unknown) => fecha(value);
const money = (value: unknown) => typeof value === "number" ? dinero(value) : BLANK;
const opcion = (key: string, value: unknown) => formatoById("14").fields.find(x => x.key === key)?.options?.find(o => o.value === value)?.label ?? v(value);

export function ofertaDocumento(d: Data): Documento {
  const credito = typeof d.credito === "number" && d.credito > 0;
  const registrada = d.estadoRespuesta === "registrada";
  const decision = registrada ? opcion("decisionPropietario", d.decisionPropietario).toLowerCase() : BLANK;
  const blocks: Block[] = [
    { kind: "title", text: "Propuesta de compra" },
    { kind: "right", text: `${v(d.lugarPropuesta)} a ${f(d.fechaPropuesta)} · Folio ${v(d.folio)}` },
    { kind: "label", text: `${v(d.propietario).toUpperCase()}\nPresente` },
    { kind: "p", text: `Soy ${v(d.comprador)}${d.representacionComprador ? `, ${m(d.representacionComprador)}` : ""}. Le propongo adquirir ${m(d.derechoAdquirir)} sobre el inmueble ubicado en ${v(d.inmueble)}, identificado con ${v(d.folioInmueble)}.` },
    { kind: "label", text: "Precio propuesto" },
    { kind: "p", strong: true, text: `${money(d.precioPropuesto)} ${v(d.moneda)} · ${m(d.impuestosPrecio)}` },
    { kind: "p", text: `Bienes y accesorios incluidos: ${m(d.bienesIncluidos)}. Excluidos: ${m(d.bienesExcluidos)}.` },
    { kind: "label", text: "Pago y condiciones" },
    { kind: "p", text: `Propongo cubrir el precio con ${money(d.recursosPropios)} de recursos propios y ${money(d.credito)} mediante ${credito ? `crédito de ${v(d.institucionCredito)} (${m(d.estadoCredito)})` : "crédito, si aplica"}. La suma de ambos importes coincide con el precio propuesto. Calendario: ${m(d.calendarioPagos)}.` },
    { kind: "p", text: `La operación quedaría sujeta a ${m(d.condiciones)} a más tardar el día ${f(d.fechaCondiciones)}. Propongo formalizar el contrato pertinente el día ${f(d.fechaFormalizacion)} y recibir el inmueble el ${f(d.fechaEntrega)}. Gastos a cargo del comprador: ${m(d.gastosComprador)}; a cargo del propietario: ${m(d.gastosPropietario)}.` },
    { kind: "label", text: "Respuesta y alcance" },
    { kind: "p", text: `Agradeceré su respuesta hasta el ${f(d.fechaLimitePropuesta)}, a las ${v(d.horaLimitePropuesta)}${d.zonaHoraria ? ` (${a(d.zonaHoraria)})` : ""}. Una respuesta posterior requerirá confirmar que mantengo esta propuesta; el silencio no expresa conformidad.` },
    { kind: "p", text: "Estas bases sirven sólo para negociar. No asumo aquí la obligación de comprar ni de celebrar un contrato futuro. Cualquier compromiso requerirá un instrumento independiente firmado por personas con facultades. Esta carta no pacta apartado, depósito, pena ni entrega de posesión." },
    { kind: "p", text: "Atentamente," },
    { kind: "signatures", line: true, parties: [{ role: "", name: v(d.comprador) }] },

    { kind: "pagebreak" },
    { kind: "title", text: "Respuesta del propietario" },
    { kind: "caption", text: "Contestación a la propuesta de compra" },
    { kind: "right", text: `${registrada ? v(d.lugarRespuesta) : BLANK}, ${registrada ? f(d.fechaRespuesta) : BLANK} · Propuesta folio ${v(d.folio)}` },
    { kind: "label", text: `${v(d.comprador).toUpperCase()}\nPresente` },
    { kind: "p", text: `Recibí su propuesta de fecha ${f(d.fechaPropuesta)} respecto del inmueble ubicado en ${v(d.inmueble)}, identificado con ${v(d.folioInmueble)}. Respondo en mi carácter de ${registrada ? m(d.caracterPropietario) : "propietario"}.` },
    { kind: "label", text: "Mi respuesta" },
    { kind: "p", text: `He decidido ${decision}, por ${registrada ? m(d.motivoRespuesta) : BLANK}.` },
    ...(registrada && d.decisionPropietario === "contraoferta" ? [{ kind: "p", text: `Contraoferta: precio de ${money(d.precioContraoferta)} ${v(d.monedaContraoferta)}, ${m(d.impuestosContraoferta)}. Cambios: ${m(d.cambiosContraoferta)}. Agradeceré su respuesta hasta el ${f(d.fechaLimiteContraoferta)}, a las ${v(d.horaLimiteContraoferta)}.` } as Block] : []),
    ...(registrada && d.confirmacionVigencia ? [{ kind: "p", text: `Confirmación de vigencia por el comprador: ${m(d.confirmacionVigencia)}.` } as Block] : []),
    { kind: "p", text: "Esta respuesta, aun si es favorable, conserva el alcance de negociación de la propuesta y no obliga por sí sola a vender ni a celebrar un contrato futuro. Cualquier compromiso requerirá el instrumento correspondiente." },
    { kind: "p", text: "Atentamente," },
    { kind: "signatures", line: true, parties: [{ role: "", name: v(d.propietario) }] },
  ];
  return { title: "Propuesta de compra", subject: `Formato 14 · ${v(d.folio)}`, estilo: "contrato", blocks };
}

export function promesaDocumento(d: Data): Documento {
  let paragraphs: string[];
  try { paragraphs = promesaParagraphs(d); }
  catch { paragraphs = PROMESA_ORIGINAL.map(text => text.replace(/\[[^\]]+\]/g, BLANK)); }
  const firmas = paragraphs.slice(-2);
  const blocks: Block[] = [];
  for (const text of paragraphs.slice(0, -2)) {
    if (["Declaraciones", "Cláusulas", "Firmas"].includes(text)) blocks.push({ kind: "bar", text, raw: true, center: true });
    else if (/^I{1,3}\. (PARTE|AMBAS)/.test(text)) blocks.push({ kind: "label", text, size: 10 });
    else if (/^\d{2}\s/.test(text)) blocks.push({ kind: "h3", text: text.replace(/\s+/, " ") });
    else blocks.push({ kind: "p", text });
  }
  blocks.push({ kind: "signatures", line: true, parties: firmas.map(name => ({ role: "", name })) });
  return { title: "Contrato de promesa bilateral de compraventa", subject: `Formato 15 · ${v(d.folio)}`, blocks };
}
