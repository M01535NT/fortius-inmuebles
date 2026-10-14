"use client";
import * as React from "react";
import Link from "next/link";
import { Check, ArrowRight, ClipboardCheck } from "lucide-react";
import { apiRequest, db, useCollection, useSession, upsert, uid } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { btnGhost, btnPrimary, inputClass, selectClass, textareaClass } from "./ui";
import { emptyWorkflow, nextWorkflowStage, operationWorkflowSchema, requiredReviews, reviewComplete, stageLabel, workflowBlockers, WORKFLOW_REQUIREMENTS, WORKFLOW_ROUTES, WORKFLOW_STAGES, WORKFLOW_STATES, REVIEW_STATES, type OperationWorkflow, type RequirementKey, type WorkflowStage } from "@/lib/formatos/operation-workflow";

type GuidedOperation = { id:string; version:number; asesor_id:string; cliente_id?:string; etapa?:WorkflowStage; propiedad_slug?:string|null; fecha_objetivo?:string|null; checklist?:Record<string,string>; flujo?:OperationWorkflow|null };
export function OperationWorkflowPanel<T extends GuidedOperation>({expediente,onSaved,onDirtyChange}:{expediente:T;onSaved:(value:T)=>void;onDirtyChange:(value:boolean)=>void}) {
 const session=useSession();
 const properties=useCollection(db.propiedades), tasks=useCollection(db.tareas);
 const [flow,setFlow]=React.useState(()=>expediente.flujo??emptyWorkflow());
 const [property,setProperty]=React.useState(expediente.propiedad_slug??"");
 const [date,setDate]=React.useState(expediente.fecha_objetivo??"");
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState(""),[notice,setNotice]=React.useState("");
 const [counterparts,setCounterparts]=React.useState<Array<{id:string;folio:string;cliente_id?:string;propiedad_slug:string|null;flujo?:OperationWorkflow|null}>>([]);
 const [counterpartError,setCounterpartError]=React.useState("");
 const [taskTitle,setTaskTitle]=React.useState(""),[taskDate,setTaskDate]=React.useState("");
 const [returnStage,setReturnStage]=React.useState<WorkflowStage|"">("");
 const stage=expediente.etapa??"captacion", next=nextWorkflowStage(stage), today=operationalDate();
 const contextChanged=property!==(expediente.propiedad_slug??"") || !!expediente.flujo && (flow.ruta!==expediente.flujo.ruta || flow.contraparteId!==expediente.flujo.contraparteId || flow.contraparteExterna!==expediente.flujo.contraparteExterna);
 const dirty=JSON.stringify(flow)!==JSON.stringify(expediente.flujo??emptyWorkflow()) || property!==(expediente.propiedad_slug??"") || date!==(expediente.fecha_objetivo??"") || !!taskTitle || !!taskDate;
 React.useEffect(()=>{onDirtyChange(dirty||busy);},[dirty,busy,onDirtyChange]);
 React.useEffect(()=>{let active=true;apiRequest<{expedientes:typeof counterparts}>("/api/admin/expedientes").then(r=>{if(!Array.isArray(r.expedientes))throw new Error("Respuesta inválida");if(active)setCounterparts(r.expedientes);}).catch(()=>{if(active)setCounterpartError("No se pudieron consultar las contrapartes internas. Reintenta al abrir la operación o registra la referencia externa.");});return()=>{active=false;};},[]);
 const blockers=next?workflowBlockers(flow,next,{...expediente,propiedad_slug:property||null},tasks,today):[];
 if(contextChanged&&next)blockers.unshift("Guarda el nuevo contexto y vuelve a revisar sus soportes antes de avanzar.");
 const required=Array.from(new Set([...requiredReviews(flow.ruta,next??stage),...Object.keys(flow.requisitos) as RequirementKey[]]));
 const openTasks=tasks.filter(t=>t.expedienteId===expediente.id && !["completada","cancelada"].includes(t.estado));
 async function createAction() {
  if(busy||!taskTitle.trim()||!taskDate)return;
  if(contextChanged){setError("Guarda el inmueble y el contexto nuevos antes de crear su tarea.");return;}
  setBusy(true);setError("");setNotice("");
  try {
   await upsert(db.tareas,{id:uid(),titulo:taskTitle.trim(),descripcion:"Próxima acción de la operación",categoria:"documentacion",estado:"pendiente",prioridad:"normal",pasos:[],asesorId:expediente.asesor_id,expedienteId:expediente.id,clienteId:expediente.cliente_id,propiedadSlug:expediente.propiedad_slug??"",vence:taskDate},null);
   setTaskTitle("");setTaskDate("");setNotice("Próxima tarea creada. La captura de la guía se conserva.");
  }catch(cause){setError(cause instanceof Error?cause.message:"No se pudo crear la próxima tarea.");}finally{setBusy(false);}
 }
 function protectNavigation(event:React.MouseEvent) {if(dirty||busy){event.preventDefault();setError("Guarda la captura de la guía antes de abrir otra página.");}}

 const compatible=counterparts.filter(e=>e.id!==expediente.id&&e.propiedad_slug===property&&e.flujo?.ruta!==flow.ruta&&!!e.flujo&&e.flujo.estado==="activa"&&e.cliente_id!==expediente.cliente_id);
 const availableProperties=properties.filter(p=>flow.ruta==="compra"||session?.role==="admin"||p.asesorId===expediente.asesor_id);
 function review(key:RequirementKey,patch:Partial<NonNullable<OperationWorkflow["requisitos"][RequirementKey]>>) {setFlow(old=>({...old,requisitos:{...old.requisitos,[key]:{estado:"pendiente",soporte:"",...old.requisitos[key],...patch}}}));}
 async function save(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(busy)return;
  const submitter=(event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;
  const target=(submitter?.value||stage) as WorkflowStage;
  const parsed=operationWorkflowSchema.safeParse(flow);
  if(!parsed.success){setError("Revisa las fechas, referencias y datos de la guía.");return;}
  setBusy(true);setError("");setNotice("");
  try {
   const r=await apiRequest<{expediente:T}>(`/api/admin/expedientes/${expediente.id}/operacion`,"PUT",{version:expediente.version,etapa:target,fechaObjetivo:date||null,checklist:expediente.checklist??{},flujo:parsed.data,propiedadSlug:property||null});
   onSaved(r.expediente);setFlow(r.expediente.flujo??emptyWorkflow());setProperty(r.expediente.propiedad_slug??"");setDate(r.expediente.fecha_objetivo??"");setReturnStage("");
   setNotice(target===stage?"Guía guardada. Las revisiones conservan su soporte y responsable.":`Avance registrado: ${stageLabel(target,flow.ruta)}.`);
   const reload=await Promise.allSettled([db.tareas.load(),db.propiedades.load()]);
   if(reload.some(item=>item.status==="rejected"))setError("La guía se guardó. No se pudo refrescar el inventario o las tareas; vuelve a cargar antes del siguiente avance.");
  } catch(cause) {setError(cause instanceof Error?cause.message:"No se pudo guardar la guía.");} finally {setBusy(false);}
 }
 return <div id="exp-guia" tabIndex={-1} className="mt-5 space-y-5 scroll-mt-24" aria-label="Guía de la operación">
  <div className="flex flex-wrap items-center gap-3"><ClipboardCheck size={24} className="text-primary-ink" aria-hidden="true"/><div><h4 className="display-soft text-xl">Tu siguiente paso</h4><p className="text-sm text-muted-foreground">{stageLabel(stage,flow.ruta)} · {WORKFLOW_STATES[flow.estado]}</p></div></div>
  <ol className="flex gap-2 overflow-x-auto pb-2" aria-label="Pasos de la operación">{WORKFLOW_STAGES.map((s,i)=><li key={s} aria-current={s===stage?"step":undefined} className={`min-w-28 rounded-md border px-3 py-2 text-sm ${s===stage?"border-primary bg-primary/10 text-primary-ink":"border-border text-muted-foreground"}`}><span className="block text-xs">{i<WORKFLOW_STAGES.indexOf(stage)?<Check size={14} aria-label="Etapa previa"/>:`Paso ${i+1}`}</span><strong>{stageLabel(s,flow.ruta)}</strong></li>)}</ol>
  {!expediente.flujo&&<p className="rounded-md border border-border bg-secondary/30 p-3 text-sm">Este expediente conserva su etapa actual. Guarda la ruta para adoptar la guía; antes de avanzar se comprobarán sus requisitos anteriores.</p>}
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{notice&&<p role="status" className="text-sm">{notice}</p>}
  <form onSubmit={save} className="space-y-5"><fieldset disabled={busy} className="min-w-0 space-y-5">
   <div className="grid min-w-0 gap-3 sm:grid-cols-2">
    <label className="text-sm">Ruta de la operación<select className={selectClass} value={flow.ruta} onChange={e=>setFlow(old=>({...old,ruta:e.target.value as OperationWorkflow["ruta"]}))}>{Object.entries(WORKFLOW_ROUTES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    <label className="text-sm">Situación de la operación<select className={selectClass} value={flow.estado} onChange={e=>setFlow(old=>({...old,estado:e.target.value as OperationWorkflow["estado"]}))}>{Object.entries(WORKFLOW_STATES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
    <label className="text-sm">Inmueble de esta operación<select className={selectClass} value={property} onChange={e=>setProperty(e.target.value)}><option value="">Sin vincular todavía</option>{property&&!availableProperties.some(p=>p.slug===property)&&<option value={property}>Inmueble vinculado no disponible</option>}{availableProperties.map(p=><option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}</select></label>
    <label className="text-sm">Fecha objetivo de la operación<input type="date" value={date} className={inputClass} onChange={e=>setDate(e.target.value)}/></label>
   </div>
   <label className="block text-sm">Motivo de pausa, regularización, descarte o retroceso<textarea rows={2} maxLength={1000} className={textareaClass} required={flow.estado!=="activa"||!!returnStage} value={flow.motivo} onChange={e=>setFlow(old=>({...old,motivo:e.target.value}))}/></label>
   <details className="rounded-md border border-border p-3" open={WORKFLOW_STAGES.indexOf(stage)>=3||undefined}><summary className="cursor-pointer font-medium">Vendedor y comprador · contraparte</summary><p className="mt-2 text-sm text-muted-foreground">Relaciona una operación disponible del mismo inmueble, o identifica y documenta una contraparte externa. El vínculo conserva los permisos de cada expediente.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Operación contraparte<select className={selectClass} value={flow.contraparteId??""} onChange={e=>setFlow(old=>({...old,contraparteId:e.target.value||undefined,contraparteExterna:undefined}))}><option value="">Sin vínculo interno</option>{flow.contraparteId&&!compatible.some(e=>e.id===flow.contraparteId)&&<option value={flow.contraparteId}>Vínculo actual · verificar compatibilidad</option>}{compatible.map(e=><option key={e.id} value={e.id}>{e.folio} · {e.flujo?.ruta==="captacion"?"Propietario":"Comprador"}</option>)}</select></label><label className="text-sm">Contraparte externa y soporte<textarea rows={2} maxLength={1000} disabled={!!flow.contraparteId} className={textareaClass} value={flow.contraparteExterna??""} onChange={e=>setFlow(old=>({...old,contraparteExterna:e.target.value||undefined}))}/></label></div>{counterpartError&&<p className="mt-2 text-sm text-muted-foreground">{counterpartError}</p>}</details>
   <section className="rounded-md border border-border bg-secondary/20 p-4" aria-label="Próxima acción"><h4 className="font-semibold">Próxima acción con fecha y responsable</h4>{openTasks.length?<ul className="mt-2 space-y-2 text-sm">{openTasks.slice(0,3).map(t=><li key={t.id}><Link className="text-primary-ink underline" onClick={protectNavigation} href={`/admin/tareas/${encodeURIComponent(t.id)}`}>{t.titulo}</Link><span> · {t.vence??"Sin fecha"}</span></li>)}</ul>:<p className="mt-2 text-sm text-muted-foreground">Sin tarea abierta. El archivo final requiere resolver los pendientes, sin crear una tarea artificial.</p>}{stage!=="cerrado"&&<div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Próxima tarea<input maxLength={160} className={inputClass} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label><label className="text-sm">Fecha de la próxima tarea<input type="date" className={inputClass} value={taskDate} onChange={e=>setTaskDate(e.target.value)}/></label><button type="button" className={btnGhost} disabled={!taskTitle.trim()||!taskDate||contextChanged} onClick={()=>void createAction()}>Agendar próxima acción</button></div>}</section>
   <div><h4 className="font-semibold">{next?`Requisitos para ${stageLabel(next,flow.ruta)}`:"Revisiones de la operación"}</h4><p className="mt-1 text-sm text-muted-foreground">Recibido no equivale a revisado. Registra el soporte, su versión y el resultado de la revisión competente. Esta guía no emite dictámenes.</p><div className="mt-3 space-y-3">{required.map(key=>{const definition=WORKFLOW_REQUIREMENTS[key],r=flow.requisitos[key];return <details key={key} className="rounded-md border border-border bg-background p-3" open={!reviewComplete(flow,key,today)||undefined}><summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium"><span>{definition.label}</span><span className="shrink-0 text-xs text-muted-foreground">{REVIEW_STATES[r?.estado??"pendiente"]}</span></summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Estado de {definition.label}<select className={selectClass} value={r?.estado??"pendiente"} onChange={e=>review(key,{estado:e.target.value as NonNullable<typeof r>["estado"]})}>{Object.entries(REVIEW_STATES).filter(([k])=>k!=="no_aplica"||"noAplica" in definition).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>{"vigencia" in definition&&<label className="text-sm">Vigencia de {definition.label}<input type="date" className={inputClass} value={r?.vigenteHasta??""} onChange={e=>review(key,{vigenteHasta:e.target.value||undefined})}/></label>}<label className="text-sm sm:col-span-2">Soporte de {definition.label}<textarea rows={2} maxLength={1000} className={textareaClass} value={r?.soporte??""} placeholder="Documento, versión, fecha, responsable de la revisión y resultado" onChange={e=>review(key,{soporte:e.target.value})}/></label></div><p className="mt-2 text-xs text-muted-foreground">Formato relacionado: {definition.formato}{r?.registradoEl?` · Registro: ${operationalDate(new Date(r.registradoEl))}`:""}</p></details>;})}</div></div>
   {next&&<div className="rounded-md border border-border p-3 text-sm" aria-live="polite"><strong>{blockers.length?`${blockers.length} pendientes antes de avanzar`:"Requisitos registrados; puedes solicitar el avance."}</strong>{blockers.length>0&&<ul className="mt-2 list-disc space-y-1 pl-5">{blockers.map((b,i)=><li key={i}>{b}</li>)}</ul>}</div>}
   <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 rounded-md border border-border bg-card p-3"><button type="submit" className={btnGhost} disabled={!dirty && !!expediente.flujo}>Guardar guía</button>{next&&<button type="submit" value={next} className={btnPrimary} disabled={blockers.length>0}>Avanzar a {stageLabel(next,flow.ruta)} <ArrowRight size={16}/></button>}</div>
   {WORKFLOW_STAGES.indexOf(stage)>0&&<details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Corregir etapa anterior</summary><label className="mt-3 block text-sm">Volver a etapa<select className={selectClass} value={returnStage} onChange={e=>setReturnStage(e.target.value as WorkflowStage|"")}><option value="">Selecciona</option>{WORKFLOW_STAGES.slice(0,WORKFLOW_STAGES.indexOf(stage)).map(s=><option key={s} value={s}>{stageLabel(s,flow.ruta)}</option>)}</select></label><button type="submit" value={returnStage} disabled={!returnStage||flow.motivo.trim().length<3} className={btnGhost+" mt-3"}>Registrar retroceso con motivo</button></details>}
  </fieldset></form>
 </div>;
}
