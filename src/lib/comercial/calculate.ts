import Decimal from "decimal.js";
import { validDate } from "./schema";
import type { ComercialBookData,CommercialRow,CommercialTotals,ComercialResult,Segment } from "./types";
const round=(d:Decimal)=>d.toDecimalPlaces(2,Decimal.ROUND_HALF_UP).toNumber();
const sum=(values:(number|null)[]):number|null=>values.some(v=>v===null)?null:round(values.reduce<Decimal>((s,v)=>s.plus(v!),new Decimal(0)));
const day=(v:string)=>Date.parse(v+"T00:00:00Z")/86400000;
export const todayBC=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Tijuana",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export function calculateComercial(b:ComercialBookData,today=todayBC()):ComercialResult {
 const c=b.config, corte=c.modoCorte === "Diario" ? today : c.fechaCorte;
 const config:string[]=[];
 if(!validDate(corte))config.push("Definir fecha de corte válida");
 const weightsOK=(weights:(number|null)[])=>!weights.some(n=>n===null) && weights.reduce<Decimal>((s,n)=>s.plus(n!),new Decimal(0)).eq(100);
 if(c.umbral===null)config.push("Definir umbral de priorización");
 if(c.diasAviso===null)config.push("Definir días de aviso");
 if(!weightsOK(c.pesosInmueble))config.push("Los pesos de inmuebles deben sumar 100%");
 if(!weightsOK(c.pesosComprador))config.push("Los pesos de compradores deben sumar 100%");
 const ids=new Set(b.oportunidades.map(o=>o.id));
 const filas:CommercialRow[]=b.oportunidades.map(o=>{
  const controls:string[]=[]; const g=o.gestion;
  if(!o.nombre)controls.push("Falta nombre"); if(o.tipo==="Por definir")controls.push("Definir tipo"); if(!o.fuente)controls.push("Falta fuente");
  const weights=o.segmento==="Inmueble"?c.pesosInmueble:c.pesosComprador;
  const score=o.niveles.some(v=>v===null)||!weightsOK(weights)?null:o.niveles.reduce((s,n,i)=>s.plus(new Decimal(n!).mul(weights[i]!)),new Decimal(0)).toNumber();
  const classification=score===null||c.umbral===null?"Sin evaluar":score>c.umbral?"Prioritario":"Revisar";
  if(score===null)controls.push("Evaluación pendiente");
  if(o.valor===null || o.valor<=0)controls.push("Valor o presupuesto pendiente");
  if(o.comision===null)controls.push("Comisión pendiente");
  const baseValid=g.operacion==="Venta";
  if(!baseValid)controls.push(g.operacion==="Por definir"?"Definir operación":"Revisar base del honorario: el modelo valor por porcentaje sólo cubre venta");
  const potential=baseValid && o.valor!==null && o.valor>0 && o.comision!==null?round(new Decimal(o.valor).mul(o.comision).div(100)):null;
  const weighted=potential!==null && score!==null ? (o.segmento==="Comprador"?round(new Decimal(potential).mul(score).div(100)):potential):null;
  const prioritized=weighted===null||c.umbral===null?null:classification==="Prioritario"?weighted:0;
  const tc=o.moneda==="MXN"?1:o.moneda==="USD" && c.tc && validDate(c.fechaTc) && c.fechaTc<=corte && c.fuenteTc?c.tc:null;
  if(tc===null)controls.push("Conversión a MXN pendiente");
  const convert=(v:number|null)=>v!==null && tc!==null?round(new Decimal(v).mul(tc)):null;
  const closed=g.etapa.startsWith("Cerrado "); const days=validDate(g.compromiso)&&validDate(corte)?day(g.compromiso)-day(corte):null;
  const alerta=closed?"Cerrado":g.tarea==="Completado"?"Programar siguiente":g.tarea==="Cancelado"?"Reprogramar":days===null?"Sin compromiso":days<0?"Vencido":!g.responsable?"Sin responsable":!g.accion?"Sin acción":c.diasAviso===null?"Aviso pendiente":days<=c.diasAviso?"Próximo":"En plazo";
  if(!g.responsable)controls.push("Falta responsable"); if(!g.compromiso && !closed)controls.push("Falta compromiso"); if(g.etapa==="Por definir")controls.push("Definir etapa"); if(!g.unidad)controls.push("Definir unidad");
  if(g.relacionado)controls.push(g.relacionado===o.id || !ids.has(g.relacionado)?"Revisar ID relacionado":"Revisar posible doble honorario");
  if(o.segmento==="Comprador" && /^(comprador|cliente|proyecto)\s*\d*$/i.test(o.nombre))controls.push("Identificar comprador o proyecto");
  return {id:o.id,segmento:o.segmento,puntuacion:score,clasificacion:classification,tc,potencial:potential,ponderado:weighted,priorizado:prioritized,valorMXN:convert(o.valor),potencialMXN:convert(potential),ponderadoMXN:convert(weighted),priorizadoMXN:convert(prioritized),abiertoMXN:closed?0:convert(prioritized),participacion:null,dias:days,alerta,controles:controls};
 });
 const totals=(rows:CommercialRow[]):CommercialTotals=>({valor:sum(rows.map(o=>o.valorMXN)),potencial:sum(rows.map(o=>o.potencialMXN)),ponderado:sum(rows.map(o=>o.ponderadoMXN)),priorizado:sum(rows.map(o=>o.priorizadoMXN)),abierto:sum(rows.map(o=>o.abiertoMXN))});
 const total=totals(filas); if(total.valor!==null && total.valor>0)for(const r of filas)r.participacion=r.valorMXN!==null?new Decimal(r.valorMXN).div(total.valor).mul(100).toDecimalPlaces(4).toNumber():null;
 const eventCorrections=new Map(b.eventos.filter(e=>e.anterior).map(e=>[e.anterior,e.id]));
 const documentCorrections=new Map(b.documentos.filter(d=>d.anterior).map(d=>[d.anterior,d.id]));
 const eventos=b.eventos.map(e=>{const controls:string[]=[]; if(!ids.has(e.oportunidad))controls.push("Oportunidad inexistente"); if(!e.fecha)controls.push("Falta fecha"); else if(e.fecha>corte)controls.push("Fecha posterior al corte"); if(!e.detalle || !e.responsable)controls.push("Completar detalle y responsable"); if(e.actividad==="Oferta" && !(e.importe!==null && e.importe>0))controls.push("Oferta sin importe positivo"); if(e.importe!==null && !e.moneda)controls.push("Falta moneda del importe"); if(e.base==="Comprobado" && !e.evidencia)controls.push("Falta evidencia"); return {id:e.id,controles:controls,vigente:!eventCorrections.has(e.id),sustituidoPor:eventCorrections.get(e.id)??null};});
 const documentos=b.documentos.map(d=>{const controls:string[]=[]; if(!ids.has(d.oportunidad))controls.push("Oportunidad inexistente"); if(!d.nombre)controls.push("Falta documento"); if(d.fecha>corte)controls.push("Fecha posterior al corte");
  if(d.aplicabilidad==="Por definir")controls.push("Definir aplicabilidad");
  else if(d.aplicabilidad==="No aplica") {if(!d.observacion || !d.responsable || !d.fecha)controls.push("Justificar no aplica");}
  else if(["Pendiente","Solicitado"].includes(d.estado))controls.push("Pendiente de recepción");
  else {if(!d.fuente || !d.responsable || !d.fecha)controls.push("Completar revisión"); if(d.estado==="Recibido")controls.push("Pendiente de revisión"); if(d.estado==="Rechazado")controls.push(d.observacion?"Requiere corrección":"Explicar rechazo");}
  return {id:d.id,controles:controls,vigente:!documentCorrections.has(d.id),sustituidoPor:documentCorrections.get(d.id)??null};
 });
 const controles=[...config]; if(filas.some(o=>o.controles.length))controles.push("Hay oportunidades con datos o controles pendientes"); if(eventos.some(e=>e.vigente && e.controles.length))controles.push("Hay eventos pendientes"); if(documentos.some(d=>d.vigente && d.controles.length))controles.push("Hay documentos pendientes");
 if(b.origen.estado==="Sin configurar")controles.push("Conciliación de origen sin configurar");
 else if(b.origen.estado==="No aplica" && !b.origen.motivo)controles.push("Justificar conciliación no aplicable");
 else if(b.origen.estado==="Configurado") {
  if(!b.origen.fuente)controles.push("Falta fuente de conciliación");
  for(const segment of ["Inmueble","Comprador"] as Segment[]){const rows=filas.filter(o=>o.segmento===segment);const origin=b.origen[segment];const actual={conteo:rows.length,valor:sum(b.oportunidades.filter(o=>o.segmento===segment).map(o=>o.valor)),potencial:sum(rows.map(o=>o.potencial)),priorizado:sum(rows.map(o=>o.priorizado))};
   for(const key of ["conteo","valor","potencial","priorizado"] as const)if(origin[key]===null || actual[key]===null || new Decimal(origin[key]!).minus(actual[key]!).abs().gt(1e-8))controles.push(`Conciliar ${segment}: ${key}`);
  }
 }
 return {corte,configuracionErrors:config,filas,totals:total,segmentos:{Inmueble:totals(filas.filter(o=>o.segmento==="Inmueble")),Comprador:totals(filas.filter(o=>o.segmento==="Comprador"))},controles,eventos,documentos};
}
