"use client";
import * as React from "react";
import Link from "next/link";
import { FileText, ArrowUpRight } from "lucide-react";
import { EmptyState, Badge, btnGhost, inputClass, selectClass } from "@/components/admin/ui";
import { apiRequest } from "@/lib/admin/store";
import { FORMATOS } from "@/lib/formatos/catalog";

type DocumentRow={id:string;expedienteId:string;folio:string;formatoId:string;version:number;actualizadoEl:string};
type DocumentIndex={documentos:DocumentRow[];total:number;nextOffset:number|null};
export function DocumentBrowser(){
  const [folioDraft,setFolioDraft]=React.useState("");
  const [formatDraft,setFormatDraft]=React.useState("");
  const [filters,setFilters]=React.useState({folio:"",formato:""});
  const [offset,setOffset]=React.useState(0);
  const [previous,setPrevious]=React.useState<number[]>([]);
  const [retry,setRetry]=React.useState(0);
  const [result,setResult]=React.useState<DocumentIndex>({documentos:[],total:0,nextOffset:null});
  const [state,setState]=React.useState<"loading"|"ready"|"error">("loading");
  const [error,setError]=React.useState("");
  React.useEffect(()=>{
    let active=true;
    const params=new URLSearchParams({limit:"40",offset:String(offset),folio:filters.folio,formato:filters.formato});
    apiRequest<DocumentIndex>(`/api/admin/documentos?${params}`).then(value=>{if(active){setResult(value);setState("ready");}}).catch(cause=>{if(active){setError(cause instanceof Error?cause.message:"No se pudieron consultar los documentos.");setState("error");}});
    return()=>{active=false;};
  },[filters,offset,retry]);
  function refresh(){setState("loading");setError("");setRetry(value=>value+1);}
  function search(event:React.FormEvent){event.preventDefault();setState("loading");setError("");setOffset(0);setPrevious([]);setFilters({folio:folioDraft.trim(),formato:formatDraft});}
  function page(next:number,history:number[]){setState("loading");setError("");setPrevious(history);setOffset(next);}
  return <section className="admin-card" aria-label="Documentos de las operaciones">
    <div className="admin-card-heading"><h2>Documentos por expediente</h2><span className="text-sm text-muted-foreground">Acceso privado del equipo</span></div>
    <form onSubmit={search} className="admin-document-filters">
      <label>Buscar por folio<input className={inputClass} type="search" value={folioDraft} maxLength={80} onChange={event=>setFolioDraft(event.target.value)} placeholder="Ej. EXP-2026-001"/></label>
      <label>Formato<select className={selectClass} value={formatDraft} onChange={event=>setFormatDraft(event.target.value)}><option value="">Todos los formatos</option>{FORMATOS.filter(format=>!format.globalRoute).map(format=><option key={format.id} value={format.id}>{format.id} · {format.title}</option>)}</select></label>
      <button type="submit" className={btnGhost}>Buscar documentos</button>
    </form>
    {state==="loading"?<p role="status" className="p-5">Consultando documentos…</p>:state==="error"?<div className="p-5"><p role="alert">{error}</p><div className="mt-3 flex flex-wrap gap-2"><button className={btnGhost} type="button" onClick={refresh}>Reintentar</button>{offset>0&&<button className={btnGhost} type="button" onClick={()=>page(0,[])}>Volver al inicio</button>}</div></div>:<>
      <p className="px-5 pb-3 text-sm text-muted-foreground" role="status">{result.total} {result.total===1?"documento":"documentos"} · {result.documentos.length} en esta página</p>
      {!result.documentos.length?<div className="p-5 pt-0"><EmptyState title="No hay documentos con estos criterios." hint="Cambia los filtros o abre un expediente para preparar un borrador."/></div>:<ul className="admin-document-list">{result.documentos.map(document=>{
        const name=FORMATOS.find(format=>format.id===document.formatoId)?.title??`Formato ${document.formatoId}`;
        const href=`/admin/operaciones?expediente=${encodeURIComponent(document.expedienteId)}&documento=${encodeURIComponent(document.id)}#exp-documentos`;
        return <li key={document.id}><FileText size={22} aria-hidden="true"/><div><h3>{name}</h3><p>{document.folio} · Formato {document.formatoId}</p><small>Actualizado {new Date(document.actualizadoEl).toLocaleDateString("es-MX",{timeZone:"America/Tijuana"})}</small></div><Badge>Borrador v{document.version}</Badge><Link className={btnGhost} href={href} aria-label={`Abrir documento ${name} de ${document.folio}`}>Abrir <ArrowUpRight size={16}/></Link></li>;
      })}</ul>}
      {(previous.length>0||result.nextOffset!==null)&&<nav className="admin-document-pagination" aria-label="Páginas de documentos"><button type="button" className={btnGhost} disabled={!previous.length} onClick={()=>page(previous.at(-1)??0,previous.slice(0,-1))}>Anterior</button><span>Página {previous.length+1}</span><button type="button" className={btnGhost} disabled={result.nextOffset===null} onClick={()=>{if(result.nextOffset!==null)page(result.nextOffset,[...previous,offset]);}}>Siguiente</button></nav>}
    </>}
  </section>;
}
