"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Save, FileDown, History, Plus, RotateCcw } from "@/components/admin/icons";
import { getApp, isRetired, FINANCIAL_APPS, COMMERCIAL_APPS } from "@/lib/apps/catalog";
import { ofertasDesdePropuestas, prefillFromUrl } from "@/lib/apps/contexto";
import { appRunSchema } from "@/lib/apps/contracts";
import type { AppContext, AppInput, AppResult, AppRun } from "@/lib/apps/types";
import { apiRequest, db, errorMessage, useCollection, useSession, loadAllDossiers } from "@/lib/admin/store";
import { LinkPicker } from "@/components/admin/workspace/link-picker";
import { PageHeader, inputClass } from "@/components/admin/ui";
import { Button, Notice } from "@/components/admin/kit";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { getFinancialDefaults } from "@/lib/apps/financial";
import { getCommercialDefaults } from "@/lib/apps/commercial";
import { FinancialEditor } from "./financial-editor";
import { CommercialEditor } from "./commercial-editor";
import { DocumentEditor } from "./document-editor";
import { AppResultView } from "./result";
import styles from "./apps.module.css";
import { humanDateTime } from "@/lib/utils";
type Dossier={id:string;folio:string;cliente_id:string;propiedad_slug:string|null};
function defaults(slug:string):AppInput{return FINANCIAL_APPS.has(slug)?getFinancialDefaults(slug):COMMERCIAL_APPS.has(slug)?getCommercialDefaults(slug):{};}
export function AppWorkspace({slug}:{slug:string}){const session=useSession();return <WorkspaceSession key={session?.id??"anonymous"} slug={slug}/>;}
function WorkspaceSession({slug}:{slug:string}){
 const app=getApp(slug)!;const search=useSearchParams();
 const retired=isRetired(app)&&!(slug==="informe-propietario"&&search.get("expedienteId"));
 // HER-05: abierta desde el inmueble, el prospecto o la operación, trae puestos los datos que el sistema ya sabe.
 const [input,setInput]=useState<AppInput>(()=>({...defaults(slug),...prefillFromUrl(slug,search).input})),[result,setResult]=useState<AppResult|null>(null),[context,setContext]=useState<AppContext>(()=>prefillFromUrl(slug,search).context),[title,setTitle]=useState(app.title as string),[run,setRun]=useState<AppRun|null>(null);
 const [dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState(""),[runs,setRuns]=useState<AppRun[]>([]),[versions,setVersions]=useState<AppRun[]>([]),[dossiers,setDossiers]=useState<Dossier[]>([]),[deleted,setDeleted]=useState(false),[next,setNext]=useState<number|null>(null),[historyOpen,setHistoryOpen]=useState(retired),[dossierError,setDossierError]=useState("");
 const clientes=useCollection(db.clientes),propiedades=useCollection(db.propiedades);
 const draftId=useRef<string|null>(null);const generation=useRef(0);const dirtyRef=useRef(false);
 useEffect(()=>{dirtyRef.current=dirty;},[dirty]);
 const [editorKey,setEditorKey]=useState(0),[editorBusy,setEditorBusy]=useState(false);
 const loadHistory=useCallback(async(offset=0)=>{const response=await apiRequest<{runs:AppRun[];nextOffset:number|null}>(`/api/admin/apps/runs?slug=${slug}&offset=${offset}&deleted=${deleted}`);setRuns(old=>offset?[...old,...response.runs]:response.runs);setNext(response.nextOffset);},[slug,deleted]);
 useEffect(()=>{let active=true;apiRequest<{runs:AppRun[];nextOffset:number|null}>(`/api/admin/apps/runs?slug=${slug}&offset=0&deleted=${deleted}`).then(response=>{if(active){setRuns(response.runs);setNext(response.nextOffset);}}).catch(e=>{if(active)setError(errorMessage(e));});return()=>{active=false;};},[slug,deleted]);
 useEffect(()=>{let active=true;async function load(){try{const all=await loadAllDossiers<Dossier>();if(!active)return;setDossiers(all);const requested=search.get("expedienteId");if(requested){const e=all.find(x=>x.id===requested);if(e)setContext({expedienteId:e.id,clienteId:e.cliente_id,...(e.propiedad_slug?{inmuebleId:e.propiedad_slug}:{})});else setDossierError("La operación solicitada no está disponible.");}}catch(e){if(active)setDossierError(errorMessage(e));}}void load();return()=>{active=false;};},[search]);
 // A one-time import synchronizes an external sessionStorage draft with this editor.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(slug!=="inversiones"||search.get("importar")!=="rehabilitacion")return;try{const raw=sessionStorage.getItem("fortius.apps.inversiones.transfer.v1");if(!raw)return;const transfer=JSON.parse(raw);const parsed=appRunSchema.safeParse({slug,title:app.title,input:transfer.input,result:null,context:transfer.context??{}});if(transfer.version===1&&transfer.source==="rehabilitacion"&&parsed.success){setInput(parsed.data.input);setContext(parsed.data.context);setDirty(true);setNotice("Presupuesto recibido. Revisa fechas, ingresos y financiamiento antes de calcular.");sessionStorage.removeItem("fortius.apps.inversiones.transfer.v1");}}catch{setError("No se pudo recuperar el presupuesto para inversión.");}},[slug,search,app.title]);
 // «?abrir=<id>»: abre un trabajo guardado desde la ficha del inmueble o de la operación donde se hizo.
 useEffect(()=>{const id=search.get("abrir");if(!id)return;let active=true;const epoch=++generation.current;apiRequest<{run:AppRun}>(`/api/admin/apps/runs/${encodeURIComponent(id)}`).then(({run:saved})=>{if(!active||epoch!==generation.current||saved.slug!==slug)return;setEditorKey(k=>k+1);setRun(saved);setInput(saved.input);setResult(saved.result);setContext(saved.context);setTitle(saved.title);setDirty(false);}).catch(e=>{if(active)setError(errorMessage(e));});return()=>{active=false;};},[search,slug]);
 // Comparador abierto desde «Visitas y ofertas»: lee las propuestas de compra (14) de la operación, sin recapturar.
 useEffect(()=>{const requested=search.get("expedienteId");if(slug!=="ofertas"||!requested)return;let active=true;apiRequest<{documentos:{id:string;formato_id:string;data:Record<string,unknown>}[]}>(`/api/admin/expedientes/${encodeURIComponent(requested)}/formatos`).then(({documentos})=>{if(!active||dirtyRef.current)return;const rows=ofertasDesdePropuestas(documentos);if(!rows.length)return;setInput(old=>Array.isArray(old.rows)&&old.rows.length?old:{...old,rows});setEditorKey(k=>k+1);setDirty(true);setNotice(rows.length===1?"Se cargó la propuesta de compra registrada en la operación. Captura el anticipo, los gastos y el saldo del crédito.":`Se cargaron las ${rows.length} propuestas de compra registradas en la operación. Captura el anticipo, los gastos y el saldo del crédito.`);}).catch(()=>{if(active)setNotice("No se pudieron leer las propuestas de la operación. Puedes capturar las ofertas a mano.");});return()=>{active=false;};},[slug,search]);
 useEffect(()=>{const unload=(e:BeforeUnloadEvent)=>{if(dirtyRef.current){e.preventDefault();e.returnValue="";}};let bypass=false;const click=async(e:MouseEvent)=>{const link=(e.target as Element).closest?.("a[href]") as HTMLAnchorElement|null;if(bypass||!dirtyRef.current||!link||link.target==="_blank"||link.hasAttribute("download")||link.href===location.href||!link.href.startsWith(location.origin))return;e.preventDefault();e.stopPropagation();if(await confirmAction("Hay cambios sin guardar. ¿Quieres salir de esta herramienta?")){bypass=true;link.click();bypass=false;}};window.addEventListener("beforeunload",unload);document.addEventListener("click",click,true);return()=>{window.removeEventListener("beforeunload",unload);document.removeEventListener("click",click,true);};},[]);
 useEffect(()=>{const token=generation;return()=>{token.current++;};},[]);
 const change=(value:AppInput)=>{setInput(value);setResult(null);setDirty(true);setNotice("");};
 const finish=(value:AppResult)=>{setResult(value);setDirty(true);setNotice("Resultado preparado. Guarda el trabajo para conservarlo.");};
 async function save(){draftId.current??=crypto.randomUUID();setBusy(true);setError("");try{const response=await apiRequest<{run:AppRun}>("/api/admin/apps/runs","POST",{slug,title,input,result,context,...(run?{id:run.id,version:run.version}:{id:draftId.current})});setRun(response.run);setDirty(false);setNotice("Trabajo guardado.");await loadHistory();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 async function open(saved:AppRun){if(dirty&&!await confirmAction("¿Abrir este trabajo y descartar los cambios sin guardar?"))return;setBusy(true);setError("");const epoch=++generation.current;try{const response=await apiRequest<{run:AppRun}>(`/api/admin/apps/runs/${saved.id}`);if(epoch!==generation.current)return;setEditorKey(k=>k+1);setRun(response.run);setInput(response.run.input);setResult(response.run.result);setContext(response.run.context);setTitle(response.run.title);setDirty(false);setVersions([]);setNotice("Trabajo recuperado.");}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 async function create(){if(dirty&&!await confirmAction("¿Comenzar un trabajo nuevo y descartar los cambios sin guardar?"))return;generation.current++;draftId.current=null;setEditorKey(k=>k+1);setRun(null);setInput(defaults(slug));setResult(null);setTitle(app.title);setContext({});setDirty(false);setVersions([]);setNotice("");setError("");}
 async function remove(saved:AppRun){if(!await confirmAction(deleted?"¿Restaurar este trabajo?":"¿Mover este trabajo a Eliminados? Podrás recuperarlo."))return;setBusy(true);try{await apiRequest(`/api/admin/apps/runs/${saved.id}`,"PATCH",{version:saved.version,deleted:!deleted});if(saved.id===run?.id){generation.current++;draftId.current=null;setVersions([]);setRun(null);setDirty(true);}await loadHistory();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 async function exportResult(format:"pdf"|"csv"){if(!run||dirty)return;setBusy(true);setError("");try{const response=await fetch(`/api/admin/apps/runs/${run.id}/export?format=${format}`,{cache:"no-store"});if(!response.ok){const e=await response.json();throw new Error(e.error??"No se pudo descargar");}const url=URL.createObjectURL(await response.blob());const a=document.createElement("a");a.href=url;a.download=`fortius-${slug}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 const contextLocked=!!run||!!input.storagePath||!!input.original||(Array.isArray(input.originals)&&input.originals.length>0);
 const props={slug,input,onChange:change,onResult:finish,context,onBusyChange:setEditorBusy};
 const busyAny=busy||editorBusy;
 return <div className={styles.workspace} data-ready={result?"":undefined}>
 <Link href="/admin/herramientas" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium underline-offset-4 hover:underline"><ArrowLeft size={16} aria-hidden="true"/>Más</Link>
 <PageHeader title={app.title} description={app.description} actions={<>
   <Button disabled={busyAny} onClick={create}><Plus size={17} aria-hidden="true"/>Nuevo</Button>
   <Button aria-expanded={historyOpen} onClick={()=>setHistoryOpen(!historyOpen)}><History size={17} aria-hidden="true"/>Mis trabajos</Button>
   <Button variant={result?"primary":"secondary"} disabled={busyAny||!dirty||input.ocrHasUnsavedChanges===true} onClick={save}><Save size={17} aria-hidden="true"/>{busy?"Guardando…":"Guardar"}</Button>
 </>}/>
 {retired&&<Notice tone="info" title="Esta herramienta ya no está en el catálogo">{"home" in app?`${app.home} `:""}Aquí sigues pudiendo consultar y descargar los trabajos que ya guardaste.</Notice>}
 {error&&<div role="alert" className={styles.notice}>{error}<button type="button" className="ml-3 min-h-11 underline underline-offset-4" onClick={()=>loadHistory().then(()=>setError("")).catch(e=>setError(errorMessage(e)))}>Reintentar carga</button></div>}
 {notice&&<p role="status" className={styles.notice}>{notice}</p>}
 {input.ocrHasUnsavedChanges===true&&<p className={styles.notice}>Guarda primero la revisión del texto para conservar tus correcciones.</p>}
 <fieldset disabled={busyAny} className={styles.meta}><label className={styles.field}>Nombre del trabajo<input className={inputClass} value={title} maxLength={160} onChange={e=>{setTitle(e.target.value);setDirty(true);}}/></label>{slug!=="documentos"&&<div className={styles.field}><LinkPicker id="app-vinculo" kinds={["expediente"]} disabled={contextLocked} clientes={clientes} propiedades={propiedades} operations={dossiers}
   value={{expedienteId:context.expedienteId,clienteId:context.clienteId,propiedadSlug:context.inmuebleId}}
   hint={contextLocked?"Inicia un trabajo nuevo para cambiar el vínculo.":context.expedienteId||context.clienteId||context.inmuebleId?undefined:"Opcional. Sin vínculo, es un trabajo independiente."}
   status={dossierError?<small role="alert">{dossierError}</small>:undefined}
   onChange={(_next,dossier)=>{setContext(dossier?{expedienteId:dossier.id,clienteId:dossier.cliente_id,...(dossier.propiedad_slug?{inmuebleId:dossier.propiedad_slug}:{})}:{});setDirty(true);setResult(null);}}/></div>}{context.inmuebleId&&!context.expedienteId&&<p className={styles.saved}>Para el inmueble: <strong>{propiedades.find(p=>p.slug===context.inmuebleId)?.titulo??context.inmuebleId}</strong>. El trabajo guardado aparece en su ficha.</p>}<p className={styles.saved}>{dirty?"Cambios sin guardar":run?`Guardado · ${humanDateTime(run.updatedAt)}`:"Llena los datos y prepara tu resultado."}</p></fieldset>
 {historyOpen&&<section className={styles.history} aria-labelledby="app-history-title"><div className={styles.toolbar}><h2 id="app-history-title" className="text-lg font-semibold">{deleted?"Eliminados":"Trabajos guardados"}</h2><Button variant="ghost" disabled={busyAny} onClick={()=>setDeleted(!deleted)}>{deleted?"Ver activos":"Ver eliminados"}</Button></div>
   {runs.map(item=><div className={styles.historyRow} key={item.id}><div className="min-w-0"><strong className="break-words">{item.title}</strong><p className="text-sm text-muted-foreground">{humanDateTime(item.updatedAt)}</p></div><div className="flex gap-2">{!deleted&&<Button disabled={busyAny} onClick={()=>open(item)}>Abrir</Button>}<Button variant="ghost" disabled={busyAny} onClick={()=>remove(item)}>{deleted?"Restaurar":"Eliminar"}</Button></div></div>)}
   {!runs.length&&<p className="py-4 text-sm text-muted-foreground">{deleted?"No hay trabajos eliminados.":"Todavía no guardas trabajos de esta herramienta. Usa «Guardar» cuando tengas un resultado."}</p>}
   {next!==null&&<Button variant="ghost" className="self-start" onClick={()=>loadHistory(next).catch(e=>setError(errorMessage(e)))}>Cargar más</Button>}
   {run&&<Button variant="ghost" className="self-start" onClick={async()=>{try{const epoch=generation.current;const target=run.id;const v=await apiRequest<{versions:AppRun[]}>(`/api/admin/apps/runs/${run.id}/versions`);if(epoch===generation.current)setVersions(v.versions.filter(version=>version.id===target));}catch(e){setError(errorMessage(e));}}}>Ver cambios anteriores de este trabajo</Button>}
   {versions.some(v=>v.id===run?.id)&&<div className="flex flex-wrap gap-2">{versions.filter(v=>v.id===run?.id).map(v=><Button key={v.version} disabled={busyAny} onClick={async()=>{if(v.id!==run?.id)return;if(dirty&&!await confirmAction("¿Cambiar lo que tienes en pantalla por esta copia anterior?"))return;setEditorKey(k=>k+1);setInput(v.input);setResult(v.result);setTitle(v.title);setDirty(true);setNotice(`Se cargó la copia del ${humanDateTime(v.updatedAt).toLowerCase()}. Guarda para conservarla como la más reciente.`);}}><RotateCcw size={14} aria-hidden="true"/>{humanDateTime(v.updatedAt)}</Button>)}</div>}
 </section>}
 <fieldset disabled={busy} className={styles.editor}>{FINANCIAL_APPS.has(slug)?<FinancialEditor key={editorKey} {...props}/>:COMMERCIAL_APPS.has(slug)?<CommercialEditor key={editorKey} {...props}/>:<DocumentEditor key={editorKey} {...props}/>}</fieldset>
 {result&&<><AppResultView result={result}/><div className={styles.toolbar}>{slug!=="conversor"&&<Button disabled={!run||dirty||busy} onClick={()=>exportResult("pdf")}><FileDown size={17} aria-hidden="true"/>Descargar PDF</Button>}<Button disabled={!run||dirty||busy} onClick={()=>exportResult("csv")}>Descargar CSV</Button>{dirty&&<small className="text-sm text-muted-foreground">Guarda el resultado para descargarlo.</small>}</div></>}
 </div>;
}
