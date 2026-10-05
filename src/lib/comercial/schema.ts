import { z } from "zod";
import { ACTIVITIES,APPLICABILITY,BASES,DOCUMENT_STATES,EVENT_STATES,OPERATIONS,PRIORITIES,PROPERTY_TYPES,STAGES,TASKS,type ComercialBookData } from "./types";
const text = z.string().trim().max(4000);
const id = z.string().trim().min(1).max(80).regex(/^[\p{L}\p{N}_-]+$/u);
export function validDate(v:string):boolean { const d=new Date(v+"T00:00:00Z"); return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(d.getTime()) && d.toISOString().slice(0,10) === v; }
const date = z.string().refine(v => v === "" || (v.length === 10 && !isNaN(Date.parse(v)) && validDate(v)), "Fecha inválida");
const amount=z.number().min(0).max(1e12).nullable(); const percentage=z.number().min(0).max(100);
const currency=z.enum(["","MXN","USD"]);
const gestion=z.object({etapa:z.enum(STAGES),responsable:text,registro:date,ultima:date,accion:text,compromiso:date,cierre:date,prioridad:z.enum(PRIORITIES),tarea:z.enum(TASKS),operacion:z.enum(OPERATIONS),unidad:text,expediente:z.union([z.literal(""),z.uuid()]),relacionado:z.string().trim().max(80),observaciones:text}).strict();
const opportunity=z.object({id,segmento:z.enum(["Inmueble","Comprador"]),nombre:text,tipo:z.enum(PROPERTY_TYPES),valor:amount,moneda:currency,comision:percentage.nullable(),niveles:z.array(z.union([z.literal(0),z.literal(1),z.null()])).max(6),fuente:text,gestion}).strict().refine(o => o.niveles.length === (o.segmento === "Inmueble" ? 4 : 6),"Número de criterios inválido");
const event=z.object({id,oportunidad:z.string().trim().max(80),fecha:date,actividad:z.enum(ACTIVITIES),detalle:text,importe:amount,moneda:currency,estado:z.enum(EVENT_STATES),responsable:text,evidencia:text,base:z.enum(BASES),anterior:z.string().trim().max(80)}).strict();
const document=z.object({id,oportunidad:z.string().trim().max(80),nombre:text,aplicabilidad:z.enum(APPLICABILITY),estado:z.enum(DOCUMENT_STATES),fuente:text,fecha:date,responsable:text,observacion:text,anterior:z.string().trim().max(80)}).strict();
const source=z.object({conteo:z.number().int().min(0).max(1000).nullable(),valor:amount,potencial:amount,priorizado:amount}).strict();
export const comercialDataSchema=z.object({config:z.object({modoCorte:z.enum(["Fijo","Diario"]),fechaCorte:date,umbral:percentage.nullable(),diasAviso:z.number().int().min(0).max(365).nullable(),pesosInmueble:z.array(percentage.nullable()).length(4),pesosComprador:z.array(percentage.nullable()).length(6),definicionesInmueble:z.array(text).length(4),definicionesComprador:z.array(text).length(6),tc:z.number().gt(0).max(10000).nullable(),fechaTc:date,fuenteTc:text}).strict(),oportunidades:z.array(opportunity).max(1000),eventos:z.array(event).max(3000),documentos:z.array(document).max(3000),origen:z.object({estado:z.enum(["Sin configurar","Configurado","No aplica"]),fuente:text,motivo:text,Inmueble:source,Comprador:source}).strict()}).strict().superRefine((b,ctx)=>{
 for(const key of ["oportunidades","eventos","documentos"] as const) {
  const seen=new Map<string,{oportunidad?:string}>();
  b[key].forEach((row,index)=>{if(seen.has(row.id))ctx.addIssue({code:"custom",path:[key,index,"id"],message:"ID repetido"});
   if("anterior" in row && row.anterior && (row.anterior === row.id || !seen.has(row.anterior) || seen.get(row.anterior)?.oportunidad !== row.oportunidad))ctx.addIssue({code:"custom",path:[key,index,"anterior"],message:"El anterior debe preceder y pertenecer a la misma oportunidad"});
   seen.set(row.id,"oportunidad" in row ? row : {});
  });
 }
});
export function canonicalJson(value:unknown):string { if(Array.isArray(value))return `[${value.map(canonicalJson).join(",")}]`; if(value && typeof value === "object") return `{${Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`; return JSON.stringify(value); }
export function validateComercialTransition(previous:ComercialBookData,next:ComercialBookData):string[] {
 const errors:string[]=[];
 for(const o of previous.oportunidades) if(!next.oportunidades.some(n=>n.id===o.id && n.segmento===o.segmento))errors.push(`Conservar ID y segmento de ${o.id}`);
 for(const key of ["eventos","documentos"] as const)for(const row of previous[key])if(!next[key].some(n=>n.id===row.id && canonicalJson(n)===canonicalJson(row)))errors.push(`Conservar ${key}: ${row.id}`);
 return errors;
}
