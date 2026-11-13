import { FORMATOS } from "./catalog";
import { conditionNote } from "@/lib/intake/condition";
import type { OperationalInterview } from "@/lib/intake/interview";
import { EXPEDIENTE_OPERACIONES } from "./expediente-operations";
import { TIPO_INMUEBLE_DESDE_ENTREVISTA, VALOR_DEFAULTS } from "./valor-fields";
import { SITE_TERMS } from "@/data/site-terms";
import { privacyAddress } from "@/data/privacy-notice";
import { prestadorDel09, type DatosFortius } from "@/lib/backend/datos-fortius";

type Context = {
 expediente: { folio: string; unidad?: string; operacion?: string; flujo?: { ruta?: string } | null };
 persona?: { nombre?: string; telefono?: string; email?: string };
 asesor?: { nombre?: string };
 inmueble?: { direccionAproximada?: string; zona?: string; slug?: string; codigo?: string };
 entrevista?: Pick<OperationalInterview,"id"|"version"|"intencion"|"respuestas">;
 /** FCH-03: datos de Fortius capturados en Configuración; lo vacío no se propone. */
 empresa?: DatosFortius;
};
/** Propose declarations to a new draft only. Never attest ownership, approve
 * money/consent or overwrite an existing/issued document. */
const hoyTijuana = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export function prefillFormato(formatoId: string, context: Context): Record<string,string|number> {
 const {expediente,persona,asesor,inmueble,entrevista,empresa}=context, a=entrevista?.respuestas??{};
 const name=persona?.nombre??"", owner=entrevista?.intencion==="vender"||entrevista?.intencion==="arrendar";
 const amount=a.presupuestoEstado==="conocido"&&Number(a.importe)>0?Number(a.importe):undefined;
 // COR-01: quien vende o renta y aún no aclara su relación se propone como propietario «por confirmar».
 const ownerUnclear=owner&&(!a.relacion||a.relacion==="por_aclarar");
 const proposed: Record<string,string|number|undefined> = {
  folio:expediente.folio, asesor:asesor?.nombre, titular:name, entrevistado:name,
  propietario:owner&&["propietario","copropietario"].includes(a.relacion)||ownerUnclear?name:undefined,
  comprador:entrevista?.intencion==="comprar"?name:undefined,
  telefono:persona?.telefono, correo:persona?.email,
  inmueble:expediente.unidad||inmueble?.direccionAproximada||a.ubicacion,
  idInmueble:inmueble?.codigo||inmueble?.slug, colonia:inmueble?.zona||a.zona,
  operacion:(EXPEDIENTE_OPERACIONES as Record<string,string>)[expediente.operacion??""],
  fechaEntrevista:a.fecha, origenContacto:a.origenContacto, relacion:a.relacion,
  tipoTitular:a.relacion==="representante"?"representante":expediente.flujo?.ruta==="compra"?"comprador":expediente.flujo?.ruta==="arrendatario"?"arrendatario":owner?"propietario":"otro",
  tipoInmueble:formatoId==="07"?TIPO_INMUEBLE_DESDE_ENTREVISTA[a.tipoInmueble]:a.tipoInmueble, zonas:a.zona, indispensables:a.necesidades,
  motivo:a.objetivo, motivoVenta:a.objetivo, objetivo:a.objetivo, plazo:a.plazo, precioDeseado:amount, moneda:a.moneda, monedaPrecio:a.moneda,
  fuentePrecio:entrevista ? `Declaración en entrevista ${entrevista.id} · versión ${entrevista.version}; no es precio autorizado ni opinión de valor` : undefined,
  estadoCivilActual:a.estadoCivil, conyuge:a.conyuge, fechaMatrimonio:a.fechaMatrimonio, lugarMatrimonio:a.lugarMatrimonio,
  acceso:a.acceso, formaPago:a.financiamiento,
  avisoPrivacidad:a.privacidad==="presentado"?"si":undefined,
  expectativas:a.objetivo, observaciones:a.detalleAlertas,
  // COR-15: lo que contó en la llamada pasa a «Notas del asesor» de la 02.
  motivoSiguiente:[a.condiciones?.trim(),conditionNote(a)].filter(Boolean).join("\n\n")||undefined,fechaSeguimiento:a.siguienteFecha,responsableSeguimiento:asesor?.nombre,
  // CAP-05: ocupación y crédito que dijo en la llamada; el asesor los confirma en la 02.
  // CAP-06: el problema también pasa a la 02, y «lo ocupa alguien sin permiso» es la ocupación «Ocupado sin permiso».
  ...(formatoId==="02"?{ocupacion:a.problema==="ocupado_sin_permiso"&&(!a.ocupacion||["otro","por_aclarar"].includes(a.ocupacion))?"sin_permiso":a.ocupacion==="por_aclarar"?undefined:a.ocupacion,gravamen:a.creditoInmueble,problema:a.problema}:{}),
  // Levantamiento (04A–04G): se hace el mismo día de la entrevista y lo elabora el asesor; ambos se pueden corregir.
  ...(/^04[A-G]$/.test(formatoId)?{fechaVisita:hoyTijuana(),elaboro:asesor?.nombre}:{}),
  // Plan (10): se elabora hoy; lo demás lo proponen el levantamiento, el 07 y el 09 al crearlo.
  ...(formatoId==="10"?{fecha:hoyTijuana()}:{}),
  // Aviso (01): responsable y domicilio de Configuración (FCH-03) cuando ya se capturaron; si no, los del aviso
  // publicado en el sitio. La fecha de emisión, hoy.
  ...(formatoId==="01"?{responsable:empresa?.razonSocial||SITE_TERMS.responsible,domicilioResponsable:empresa?.domicilio||privacyAddress,contactoPrivacidad:SITE_TERMS.responsible,correoPrivacidad:SITE_TERMS.email,fechaEmision:hoyTijuana()}:{}),
  // Contrato 09: el prestador (Fortius) sale de Configuración; solo lo capturado, nada inventado (FCH-03).
  // Si ya hay representante, comparece por él (persona moral) y firma con su cargo.
  // Arrendamiento (20): el propietario que renta es el arrendador; el plazo de la entrevista es otro dato (cuándo quiere rentar).
  ...(formatoId==="20"?{plazo:undefined,arrendador:owner&&["propietario","copropietario"].includes(a.relacion)?name:undefined,arrendadorCorreo:owner&&["propietario","copropietario"].includes(a.relacion)?persona?.email:undefined}:{}),
  ...(formatoId==="09"&&empresa?{...prestadorDel09(empresa),...(empresa.representante?{comparecePrestador:"representante",calidadFirmaPrestador:empresa.calidadRepresentante||undefined}:{})}:{}),
 };
 const result: Record<string,string|number> = {};
 for(const field of FORMATOS.find(f=>f.id===formatoId)?.fields??[]) {
  const value=proposed[field.key];
  if(value===undefined||value===""||field.options&&!field.options.some(o=>o.value===value))continue;
  result[field.key]=value;
 }
 const porConfirmar=ownerUnclear&&result.propietario!==undefined?["propietario"]:[];
 if(entrevista)result.origenDatos=JSON.stringify({entrevistaId:entrevista.id,version:entrevista.version,intencion:entrevista.intencion,calidad:"Declaraciones iniciales; comprobar en la actividad correspondiente",campos:Object.keys(result),...(porConfirmar.length?{porConfirmar}:{})});
 // Textos que la plantilla de la opinión de valor trae escritos (empresa, contacto, objeto, supuestos…).
 if(formatoId==="07")for(const [key,value] of Object.entries(VALOR_DEFAULTS))if(result[key]===undefined)result[key]=value;
 return result;
}
