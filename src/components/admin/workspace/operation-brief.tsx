"use client";
import Link from "next/link";
import { Building2, ArrowUpRight } from "lucide-react";
import { Badge, btnGhost, btnPrimary } from "@/components/admin/ui";
import { db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { isTaskOpen } from "@/lib/tasks";
import { stageLabel, requiredReviews, nextWorkflowStage, reviewComplete } from "@/lib/formatos/operation-workflow";
import { EXPEDIENTE_DOCUMENTOS, EXPEDIENTE_ETAPAS } from "@/lib/formatos/expediente-operations";
import type { ExpedienteOperativo } from "@/components/admin/expediente-operation-panel";

type Operation=ExpedienteOperativo & {folio:string;cliente_id:string;propiedad_slug:string|null;operacion:string};
export function OperationBrief({operation,onReview}:{operation:Operation;onReview:()=>void}){
  const clients=useCollection(db.clientes),properties=useCollection(db.propiedades),advisers=useCollection(db.asesores),tasks=useCollection(db.tareas);
  const client=clients.find(item=>item.id===operation.cliente_id);
  const property=properties.find(item=>item.slug===operation.propiedad_slug);
  const adviser=advisers.find(item=>item.id===operation.asesor_id);
  const next=tasks.filter(task=>task.expedienteId===operation.id&&isTaskOpen(task)).sort((a,b)=>(a.vence||"9999").localeCompare(b.vence||"9999"))[0];
  const pending=operation.flujo?requiredReviews(operation.flujo.ruta,nextWorkflowStage(operation.etapa??"captacion")??operation.etapa??"captacion").filter(k=>!reviewComplete(operation.flujo!,k,operationalDate())):Object.entries(EXPEDIENTE_DOCUMENTOS).filter(([key])=>(operation.checklist?.[key as keyof typeof EXPEDIENTE_DOCUMENTOS]??"pendiente")==="pendiente");
  const query=new URLSearchParams({nueva:"1",expediente:operation.id,clienteId:operation.cliente_id});
  if(operation.propiedad_slug)query.set("propiedadSlug",operation.propiedad_slug);
  return <section className="admin-card admin-operation-brief" aria-label="Resumen de operación">
    <div className="admin-operation-identity"><span className="admin-operation-symbol"><Building2 size={24} aria-hidden="true"/></span><div><p>{operation.folio} · {operation.operacion}</p><h2>{property?.titulo??(operation.propiedad_slug?"Inmueble no disponible":"Sin inmueble vinculado")}</h2>{property?.zona&&<small>{property.zona}</small>}</div><Badge>{operation.flujo?stageLabel(operation.etapa??"captacion",operation.flujo.ruta):EXPEDIENTE_ETAPAS[operation.etapa??"captacion"]}</Badge></div>
    <dl className="admin-operation-context">
      <div><dt>Cliente</dt><dd>{client?<Link href={`/admin/clientes/${encodeURIComponent(client.id)}`}>{client.nombre}</Link>:"Cliente no disponible"}</dd></div>
      <div><dt>Responsable</dt><dd>{adviser?.nombre??"Responsable no disponible"}</dd></div>
      <div><dt>Fecha objetivo</dt><dd>{operation.fecha_objetivo?operation.fecha_objetivo.split("-").reverse().join("/"):"Sin fecha objetivo"}</dd></div>
    </dl>
    <div className="admin-operation-next" aria-label="Tu siguiente paso"><div><h3>Tu siguiente paso</h3>{next?<Link href={`/admin/tareas/${encodeURIComponent(next.id)}`}><strong>{next.titulo}</strong><small>{next.vence?`Fecha límite: ${next.vence}`:"Sin fecha límite"}</small></Link>:<p>Sin próxima tarea registrada</p>}</div>{operation.operacion==="venta"?<button type="button" className={btnPrimary} onClick={onReview}>Continuar <ArrowUpRight size={16}/></button>:<Link className={btnPrimary} href={`/admin/tareas?${query}`}>Crear próxima tarea <ArrowUpRight size={16}/></Link>}</div>
    <div hidden={operation.operacion==="venta"} className="admin-operation-gaps"><div><h3>Por completar</h3><ul>{!operation.propiedad_slug&&<li>Vincular el inmueble.</li>}{!operation.fecha_objetivo&&<li>Registrar una fecha objetivo.</li>}{!next&&<li>Acordar y registrar la próxima tarea.</li>}<li>{pending.length} {operation.flujo?"requisitos del próximo paso por revisar":pending.length===1?"requisito documental pendiente de recepción":"requisitos documentales pendientes de recepción"}.</li></ul><p>{operation.flujo?"Consulta sus soportes, vigencia y pendientes en la guía.":"La recepción registrada se revisa por separado en Actividad."}</p></div><button type="button" className={btnGhost} onClick={onReview}>Revisar requisitos</button></div>
  </section>;
}
