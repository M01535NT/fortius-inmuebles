import { FORMATOS } from "./catalog";
import type { OperationalInterview } from "@/lib/intake/interview";
import { EXPEDIENTE_OPERACIONES } from "./expediente-operations";
import { TIPO_INMUEBLE_DESDE_ENTREVISTA, VALOR_DEFAULTS } from "./valor-fields";

type Context = {
 expediente: { folio: string; unidad?: string; operacion?: string; flujo?: { ruta?: string } | null };
 persona?: { nombre?: string; telefono?: string; email?: string };
 asesor?: { nombre?: string };
 inmueble?: { direccionAproximada?: string; zona?: string; slug?: string };
 entrevista?: Pick<OperationalInterview,"id"|"version"|"intencion"|"respuestas">;
};
/** Propose declarations to a new draft only. Never attest ownership, approve
 * money/consent or overwrite an existing/issued document. */
export function prefillFormato(formatoId: string, context: Context): Record<string,string|number> {
 const {expediente,persona,asesor,inmueble,entrevista}=context, a=entrevista?.respuestas??{};
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
  idInmueble:inmueble?.slug, colonia:inmueble?.zona||a.zona,
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
  motivoSiguiente:a.siguienteAccion,fechaSeguimiento:a.siguienteFecha,responsableSeguimiento:asesor?.nombre,
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
