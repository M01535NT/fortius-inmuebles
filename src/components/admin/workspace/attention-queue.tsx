"use client";
import Link from "next/link";
import { Badge } from "@/components/admin/ui";
import { db, useCollection } from "@/lib/admin/store";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen } from "@/lib/tasks";
import { formatDate } from "@/lib/utils";

export function AttentionQueue({ today }: { today: string }) {
  const leads=useCollection(db.leads), clients=useCollection(db.clientes), tasks=useCollection(db.tareas), advisers=useCollection(db.asesores);
  const contacts=projectFollowups(leads,clients).filter(contact=>contact.fecha<=today);
  const dueTasks=tasks.filter(task=>isTaskOpen(task)&&task.vence&&task.vence<=today).sort((a,b)=>(a.vence??"").localeCompare(b.vence??"")||a.titulo.localeCompare(b.titulo,"es"));
  const convertedIds=new Set(clients.map(client=>client.leadId).filter(Boolean));
  const withoutDate=[
    ...clients.filter(client=>!client.perfil?.proximoContacto).map(client=>({id:`cliente:${client.id}`,name:client.nombre,href:`/admin/clientes/${encodeURIComponent(client.id)}`})),
    ...leads.filter(lead=>!lead.clienteId&&!convertedIds.has(lead.id)&&!["cerrado","descartado"].includes(lead.estado)&&!lead.perfil?.proximoContacto).map(lead=>({id:`lead:${lead.id}`,name:lead.nombre,href:`/admin/leads/${encodeURIComponent(lead.id)}`})),
  ];
  return <section className="admin-attention-overview admin-card" aria-label="Prioridades de hoy">
    <div className="admin-card-heading"><h2>Prioridades de hoy</h2><span className="text-sm text-muted-foreground">Contactos y tareas del equipo</span></div>
    <div className="admin-priority-grid">
      <div><h3>Contactos por atender <Badge tone={contacts.length ? "amber" : "neutral"}>{contacts.length}</Badge></h3>
        {contacts.length ? <ul>{contacts.slice(0,4).map(contact=><li key={contact.id}><Link href={contact.href}><strong>{contact.personName}</strong><small>{contact.fecha===today ? "Hoy" : `Pendiente desde ${formatDate(contact.fecha)}`} · {advisers.find(adviser=>adviser.id===contact.asesorId)?.nombre??"Sin asignar"}</small></Link></li>)}</ul> : <p>Sin contactos previstos para hoy ni atrasados.</p>}
        {contacts.length>4 && <details><summary>Ver {contacts.length-4} contactos más</summary><ul>{contacts.slice(4).map(contact=><li key={contact.id}><Link href={contact.href}>{contact.personName}<small>{contact.fecha}</small></Link></li>)}</ul></details>}
      </div>
      <div><h3>Tareas para hoy o vencidas <Badge tone={dueTasks.length ? "amber" : "neutral"}>{dueTasks.length}</Badge></h3>
        {dueTasks.length ? <ul>{dueTasks.slice(0,4).map(task=><li key={task.id}><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`}><strong>{task.titulo}</strong><small>{task.vence===today ? "Hoy" : `Vencida · ${task.vence}`}</small></Link></li>)}</ul> : <p>Sin tareas previstas para hoy ni vencidas.</p>}
        {dueTasks.length>4 && <details><summary>Ver {dueTasks.length-4} {dueTasks.length===5 ? "tarea más" : "tareas más"}</summary><ul>{dueTasks.slice(4).map(task=><li key={task.id}><Link href={`/admin/tareas/${encodeURIComponent(task.id)}`}>{task.titulo}<small>{task.vence===today ? "Hoy" : `Vencida · ${task.vence}`}</small></Link></li>)}</ul></details>}
      </div>
      <div><h3>Sin próximo contacto <Badge>{withoutDate.length}</Badge></h3><p>Personas sin una fecha de contacto registrada.</p>
        {!!withoutDate.length && <details><summary>Revisar {withoutDate.length} {withoutDate.length===1 ? "ficha" : "fichas"}</summary><ul>{withoutDate.map(person=><li key={person.id}><Link href={person.href}>{person.name}</Link></li>)}</ul></details>}
      </div>
    </div>
  </section>;
}
