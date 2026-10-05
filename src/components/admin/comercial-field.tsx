"use client";
import {inputClass,selectClass,textareaClass} from "./ui";
import {useId} from "react";
export function CommercialField({label,value,onChange,type="text",options,readOnly=false,hint,max}:{label:string;value:string|number|null;onChange:(value:string)=>void;type?:"text"|"date"|"number"|"long";options?:readonly string[];readOnly?:boolean;hint?:string;max?:number}){
 const id=useId();const description=hint?id+"-hint":undefined;
 return <div className="grid min-w-0 content-start gap-1.5 text-sm font-medium"><label htmlFor={id}>{label}</label>{options?<select id={id} aria-describedby={description} className={selectClass} value={value??""} onChange={e=>onChange(e.target.value)} disabled={readOnly}>{options.map(o=><option key={o} value={o}>{o||"Por confirmar"}</option>)}</select>:type==="long"?<textarea id={id} aria-describedby={description} rows={3} maxLength={4000} className={textareaClass} value={value??""} onChange={e=>onChange(e.target.value)} readOnly={readOnly}/>:<input id={id} aria-describedby={description} className={inputClass} type={type} step={type==="number"?"any":undefined} min={type==="number"?0:undefined} max={max} maxLength={4000} value={value??""} onChange={e=>onChange(e.target.value)} readOnly={readOnly}/>} {hint?<span id={description} className="text-xs font-normal leading-relaxed text-muted-foreground">{hint}</span>:null}</div>;
}
export const commercialNumber=(value:string)=>value===""?null:Number(value);
export const commercialMoney=(value:number|null)=>value===null?"Pendiente":new Intl.NumberFormat("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
