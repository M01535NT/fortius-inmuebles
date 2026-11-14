"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileDown, Plus, Search, UserPlus, X, EMPTY_ART } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Card, EmptyBox, Pill } from "@/components/admin/kit";
import f from "@/components/admin/form.module.css";
import { inputClass } from "@/components/admin/ui";
import { ClienteEditor } from "@/components/admin/cliente-editor";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { duplicateContacts } from "@/lib/admin/workspace";
import { operationalDate } from "@/lib/admin/operational-date";
import { clientRows, dayGroups, leadRows, matches, waitingSince, type ContactRow, type PersonOperation, type Waiting } from "@/lib/admin/contacts-view";
import { apiRequest, db, settingsStore, upsert, useCollection, useSession, useSingleton } from "@/lib/admin/store";
import { BulkBar, SelectBox, SelectToggle, useSelection, type BulkAction, type Selection } from "@/components/admin/workspace/bulk";
import { toCsv } from "@/lib/admin/bulk";
import { saveBlob } from "@/lib/admin/download-word";
import { firstResponseHours } from "@/lib/admin/today";
import { leadStage, LEAD_STAGE_LABELS } from "@/lib/admin/person-view";
import { processStageText, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { cn } from "@/lib/utils";
import { ContactPreview } from "./contact-preview";
import { useConditions } from "@/lib/admin/conditions";
import { PERSON_STATUS_LABEL } from "@/lib/admin/person-status";
import { usePersonStatus } from "@/components/admin/workspace/use-person-status";
import s from "./contacts.module.css";

/*
  Contactos (boceto aprobado por el titular, 17/10/2026). Pestañas Prospectos y Clientes en
  una sola lista de personas (LV-08, DEC-36: sin pestañas Prospectos y Clientes; la etapa va como chip y como filtro; «?tab=clientes» sigue filtrando); una lista de personas con sus iniciales, lo que buscan, la zona y el
  presupuesto, y el siguiente paso con su fecha; en computadora se lee en columnas. El estado
  del prospecto, la conversión y la edición se hacen en la ficha de cada persona. En
  computadora, a la derecha se ve la vista previa de la persona señalada (con el puntero o el
  teclado); los «inmuebles que coinciden» del boceto no existen todavía en el sistema (EXT-01).
*/

type Filter = "todas" | "nuevos" | "seguimiento" | "clientes" | "descartados";
const FILTERS: Array<{ id: Filter; label: string }> = [{ id: "todas", label: "Todas" }, { id: "nuevos", label: "Nuevos" }, { id: "seguimiento", label: "En seguimiento" }, { id: "clientes", label: "Clientes" }, { id: "descartados", label: "Descartados" }];

export function ContactsScreen() {
  const params = useSearchParams(), router = useRouter();
  const leads = useCollection(db.leads), clients = useCollection(db.clientes), tasks = useCollection(db.tareas), events = useCollection(db.eventos);
  const today = operationalDate();
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>(() => params.get("tab") === "clientes" ? "clientes" : "todas");
  // «Agregar» solo captura aquí al cliente directo (vista Clientes); a una persona nueva la atiende el asistente único (SIM-17).
  const [adding, setAdding] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  // Operaciones activas: el siguiente paso de quien tiene una sale de ella, no del perfil (C40).
  const [operations, setOperations] = React.useState<PersonOperation[]>([]);
  React.useEffect(() => {
    let alive = true;
    apiRequest<{ expedientes?: Array<{ id: string; cliente_id?: string; etapa?: WorkflowStage; flujo?: OperationWorkflow | null }> }>("/api/admin/expedientes")
      .then(r => { if (alive) setOperations((r.expedientes ?? []).filter(d => d.etapa !== "cerrado" && d.flujo?.estado !== "descartada").map(d => ({ id: d.id, clienteId: d.cliente_id, stage: processStageText(d.etapa, d.flujo, today) || "curso" }))); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [today]);
  const searchInput = React.useRef<HTMLInputElement>(null);
  // COR-14: la condición que el propietario mencionó en la llamada.
  const conditions = useConditions();
  // COR-10: prospecto o cliente se calcula por la firma del contrato, no por estar en la tabla de clientes.
  const status = usePersonStatus();
  const signedClient = (id: string) => { const st = status.ofClient(id); return st === "cliente" || st === "cliente_anterior"; };

  // Direcciones anteriores de «Nuevo prospecto» (?nuevo=1): llevan al asistente único.
  React.useEffect(() => { if (params.get("nuevo") === "1") router.replace("/admin/operaciones/nueva"); }, [params, router]);
  React.useEffect(() => { if (searching) searchInput.current?.focus(); }, [searching]);

  const open = leads.filter(l => !l.clienteId);
  const estadoDe = (id: string) => leads.find(l => l.id === id)?.estado;
  const inFilter = (kind: "lead" | "cliente", id: string) => {
    if (filter === "todas") return true;
    if (filter === "clientes") return kind === "cliente" && signedClient(id);
    // Quien tiene registro de cliente sin firmar sigue en el seguimiento de prospectos.
    if (kind === "cliente") return filter === "seguimiento" && status.ofClient(id) === "prospecto";
    const estado = estadoDe(id);
    // Tres etapas visibles (DEC-46): los estados intermedios cuentan como «En seguimiento»; «cerrado», estado anterior, va con los descartados.
    const stage = leadStage(estado);
    return kind === "lead" && (filter === "nuevos" ? stage === "nuevo" : filter === "seguimiento" ? stage === "seguimiento" : stage === "descartado" || stage === "cerrado");
  };
  const counts = Object.fromEntries(FILTERS.map(item => [item.id, item.id === "todas" ? open.length + clients.length : item.id === "clientes" ? clients.filter(c => signedClient(c.id)).length : open.filter(l => { const stage = leadStage(l.estado); return item.id === "nuevos" ? stage === "nuevo" : item.id === "seguimiento" ? stage === "seguimiento" : stage === "descartado" || stage === "cerrado"; }).length + (item.id === "seguimiento" ? clients.filter(c => status.ofClient(c.id) === "prospecto").length : 0)])) as Record<Filter, number>;
  const rows = [
    ...leadRows(open, tasks, events, today).filter(r => { const l = open.find(x => x.id === r.id)!; return matches(query, l.nombre, l.telefono, l.email, l.zona, l.tipoPropiedad, l.mensaje, l.perfil?.requisitos, r.wants); }),
    ...clientRows(clients, tasks, events, today, operations).filter(r => { const c = clients.find(x => x.id === r.id)!; return matches(query, c.nombre, c.telefono, c.email, c.zona, c.tipoPropiedad, r.wants); }),
  ].filter(r => inFilter(r.kind, r.id)).sort((x, y) => x.sort.localeCompare(y.sort) || x.name.localeCompare(y.name, "es"));
  const duplicates = filter === "clientes" ? 0 : leads.filter(l => duplicateContacts(l, leads).length > 0).length;
  // Lista del día (CRM-01): agrupada mientras no se busca y la vista es de trabajo diario.
  const settings = useSingleton(settingsStore);
  const limitHours = firstResponseHours(settings);
  const now = new Date();
  const waiting = (row: ContactRow) => { if (row.kind !== "lead") return null; const lead = open.find(l => l.id === row.id); return lead ? waitingSince(lead, now, limitHours) : null; };
  const grouped = !query.trim() && (filter === "todas" || filter === "nuevos" || filter === "seguimiento");
  const groups = grouped ? dayGroups(rows, today, waiting) : [{ id: "todas" as const, label: "", rows }];
  const ordered = groups.flatMap(group => group.rows);
  const previewRow = ordered.find(r => r.id === selected) ?? ordered[0];
  // RP-12 (UX-03): reasignar varias personas a la vez; exportar es solo del administrador (datos personales).
  const session = useSession();
  const advisers = useCollection(db.asesores);
  const keyOf = (row: Pick<ContactRow, "kind" | "id">) => `${row.kind}:${row.id}`;
  const selection = useSelection(ordered.map(keyOf));
  const adviserName = (id?: string) => advisers.find(a => a.id === id)?.nombre ?? (id ? "Responsable no disponible" : "Sin asignar");
  async function reassign(key: string, asesorId: string): Promise<"aplicado" | "sin-cambio"> {
    const cut = key.indexOf(":"), kind = key.slice(0, cut), id = key.slice(cut + 1);
    const value = asesorId || undefined;
    if (kind === "lead") {
      const latest = db.leads.list().find(l => l.id === id);
      if (!latest) throw new Error("Ya no aparece en tus contactos.");
      if ((latest.asesorId ?? "") === asesorId) return "sin-cambio";
      await upsert(db.leads, { ...latest, asesorId: value }, db.leads.version(id), { resolve: false });
    } else {
      const latest = db.clientes.list().find(c => c.id === id);
      if (!latest) throw new Error("Ya no aparece en tus contactos.");
      if ((latest.asesorId ?? "") === asesorId) return "sin-cambio";
      await upsert(db.clientes, { ...latest, asesorId: value }, db.clientes.version(id), { resolve: false });
    }
    return "aplicado";
  }
  const stageText = (row: ContactRow) => { if (row.kind === "cliente") { const st = status.ofClient(row.id); return st ? PERSON_STATUS_LABEL[st] : "Contacto"; } return status.ofLead({ id: row.id }) === "contraparte" ? PERSON_STATUS_LABEL.contraparte : LEAD_STAGE_LABELS[leadStage(estadoDe(row.id))]; };
  const bulkActions: BulkAction[] = [
    { id: "responsable", label: "Reasignar a…", verb: "Se reasignaron", options: [{ value: "", label: "Sin asignar" }, ...advisers.map(a => ({ value: a.id, label: a.nombre }))], apply: reassign },
    ...(session?.role === "admin" ? [{ id: "exportar", label: "Exportar", icon: <FileDown size={16} aria-hidden="true" />, run: (keys: string[]) => {
      const list = ordered.filter(r => keys.includes(keyOf(r)));
      const person = (r: ContactRow) => r.kind === "lead" ? leads.find(l => l.id === r.id) : clients.find(c => c.id === r.id);
      const data = list.map(r => { const p = person(r); return [r.name, r.phone ?? "", p?.email ?? "", stageText(r), r.zone ?? "", r.wants ?? "", adviserName(p?.asesorId)]; });
      saveBlob(new Blob([toCsv(["Nombre", "Teléfono", "Correo", "Etapa", "Zona", "Busca", "Responsable"], data)], { type: "text/csv;charset=utf-8" }), `Fortius-Contactos-${today}.csv`);
    } } satisfies BulkAction] : []),
  ];


  const searchField = <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar nombre o teléfono</span><input ref={searchInput} type="search" className={inputClass} placeholder="Buscar nombre o teléfono" value={query} onChange={e => setQuery(e.target.value)} /></label>;

  return <GuidedPage title="Contactos" subtitle={<span className="hidden sm:inline">Las personas con las que hablamos y lo que buscan.</span>} actions={<>
    <div className="hidden lg:block">{searchField}</div>
    <div className="flex gap-2 lg:hidden">
      <Button iconOnly variant="ghost" aria-label={searching ? "Cerrar búsqueda" : "Buscar"} aria-expanded={searching} onClick={() => { setSearching(v => !v); if (searching) setQuery(""); }}>{searching ? <X size={20} aria-hidden="true" /> : <Search size={20} aria-hidden="true" />}</Button>
      {filter === "clientes" ? <Button iconOnly data-tour="contactos-agregar" aria-label="Agregar cliente" aria-expanded={adding} onClick={() => setAdding(v => !v)}><Plus size={20} aria-hidden="true" /></Button>
        : <ButtonLink iconOnly data-tour="contactos-agregar" aria-label="Agregar contacto" href="/admin/operaciones/nueva"><Plus size={20} aria-hidden="true" /></ButtonLink>}
    </div>
    <div className="hidden lg:block">{filter === "clientes"
      ? <Button variant={adding ? "secondary" : "primary"} data-tour="contactos-agregar" aria-expanded={adding} onClick={() => setAdding(v => !v)}>{adding ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{adding ? "Cerrar" : "Agregar cliente"}</Button>
      : <ButtonLink variant="primary" data-tour="contactos-agregar" href="/admin/operaciones/nueva"><Plus size={16} aria-hidden="true" />Agregar contacto</ButtonLink>}</div>
  </>}>
    {searching && <div className="mb-4 lg:hidden">{searchField}</div>}
    {filter === "clientes" && adding && <section className={cn(f.window, "mb-5")} aria-label="Nuevo cliente">
      <div className={f.windowHead}>
        <div className={f.windowTitle}><span className={f.windowIcon}><UserPlus size={22} aria-hidden="true" /></span><div><h2>Nuevo cliente</h2><p>Para registrar a un propietario directamente. Será cliente cuando firme su contrato.</p></div></div>
        <Button variant="ghost" iconOnly aria-label="Cerrar captura" onClick={() => setAdding(false)}><X size={20} aria-hidden="true" /></Button>
      </div>
      <ClienteEditor key="nuevo" title={false} onDone={() => setAdding(false)} />
    </section>}
    <div className={s.tabsRow}>
      {rows.length > 0 && <div className="ml-auto"><SelectToggle selection={selection} noun="contactos" /></div>}
      <div className={s.chips} role="group" aria-label="Mostrar personas" data-tour="contactos-filtros">{FILTERS.map(item => <button key={item.id} type="button" className={s.chipBtn} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setAdding(false); }}>{item.label}<span className={s.chipCount}>{counts[item.id]}</span></button>)}</div>
    </div>
    <div className="mt-5 min-w-0">
      {rows.length === 0 ? <EmptyBox art={{ icon: EMPTY_ART.contactos, kind: query.trim() || filter !== "todas" ? "buscar" : "empezar" }} title={query.trim() || filter !== "todas" ? "Nadie coincide con la búsqueda" : "Todavía no hay contactos"} steps={query.trim() || filter !== "todas" ? undefined : ["Registra a quien llamó o escribió con «Agregar contacto».", "Anota qué busca y cuándo vuelves a hablarle.", "Cuando quiera avanzar, abre su operación desde su ficha."]} action={query.trim() || filter !== "todas" ? undefined : <ButtonLink href="/admin/operaciones/nueva">Agregar contacto</ButtonLink>}>
        {query.trim() || filter !== "todas" ? "Prueba con otro nombre, teléfono o estado." : "Aquí están las personas que buscan a Fortius y los clientes, con lo que sigue con cada una. Las que escriben desde el sitio llegan solas."}
      </EmptyBox> : <div className={s.frame} data-tour="contactos-lista">
        <ContactList groups={groups} waiting={waiting} limitHours={limitHours} onPreview={setSelected} conditionOf={row => conditions.ofPerson(row.kind, row.id)?.text} stageOf={stageText} selection={selection} keyOf={keyOf} />
        {previewRow && <ContactPreview key={previewRow.id} row={previewRow} lead={previewRow.kind === "lead" ? leads.find(l => l.id === previewRow.id) : undefined} client={previewRow.kind === "cliente" ? clients.find(c => c.id === previewRow.id) : undefined} tasks={tasks} events={events} today={today} />}
      </div>}
      {rows.length > 0 && <BulkBar selection={selection} targets={ordered.map(r => ({ id: keyOf(r), label: r.name }))} actions={bulkActions} noun={{ one: "persona seleccionada", many: "personas seleccionadas", empty: "Elige personas en la lista" }} />}
      {duplicates > 0 && <p className="mt-4 text-sm text-muted-foreground">{duplicates === 1 ? "1 prospecto podría estar repetido" : `${duplicates} prospectos podrían estar repetidos`}: revisa su ficha antes de abrir una operación.</p>}
    </div>
  </GuidedPage>;
}

function Due({ row }: { row: ContactRow }) {
  return row.when ? <Pill size="sm" tone={row.late ? "alert" : "muted"}>{row.when}</Pill> : null;
}

/** Barra de la primera atención: cuánto lleva esperando contra el plazo (la marca es el plazo). */
function WaitClock({ wait, limitHours }: { wait: Waiting; limitHours: number }) {
  const span = limitHours * 2;
  return <span className={cn(s.clock, wait.late && s.clockLate)}>
    <span className={s.meter} aria-hidden="true"><span style={{ width: `${Math.min(100, (wait.hours / span) * 100)}%` }} /><i /></span>
    <span>{wait.hours < 1 ? "Menos de 1 h" : `${wait.hours} h`} sin respuesta · plazo {limitHours} h</span>
  </span>;
}

function ContactList({ groups, waiting, limitHours, onPreview, stageOf, conditionOf, selection, keyOf }: { groups: Array<{ id: string; label: string; rows: ContactRow[] }>; waiting: (row: ContactRow) => Waiting | null; limitHours: number; onPreview: (id: string) => void; stageOf: (row: ContactRow) => string; conditionOf: (row: ContactRow) => string | undefined; selection: Selection; keyOf: (row: ContactRow) => string }) {
  // Una sola lista «Contactos»; cada grupo del día es un renglón con su título y sus personas.
  return <Card as="div" className={s.listCard}>
    <ul className={s.list} aria-label="Contactos">{groups.map(group => {
      const head = group.label ? `contactos-${group.id}` : undefined;
      return <li key={group.id} className={s.group}>
        {group.label && <h2 id={head} className={s.groupHead}>{group.label}<span className={s.groupCount}>{group.rows.length}</span></h2>}
        <ul className={s.list} aria-label={group.label || undefined}>{group.rows.map(row => {
          const wait = waiting(row);
          const body = <>
            <Avatar name={row.name} size={44} />
            <span className={s.person}><strong>{row.name}</strong><span className={s.meta}>{row.phone}</span></span>
            <span className={s.wants}><span className="[overflow-wrap:anywhere]"><Pill size="sm" tone={stageOf(row) === "Cliente" ? "success" : "muted"}>{stageOf(row)}</Pill> {conditionOf(row) && <><Pill size="sm" tone="warn">{conditionOf(row)}</Pill> </>}{row.wants}</span>{(row.zone || row.budget) && <span className={s.meta}>{[row.zone, row.budget].filter(Boolean).join(" · ")}</span>}</span>
            <span className={s.step}>{wait ? <WaitClock wait={wait} limitHours={limitHours} /> : row.step && <><span className={cn("lg:hidden whitespace-nowrap", s.meta)}>Sigue:</span><span className={cn(!row.when && "text-muted-foreground")}>{row.step}</span></>}</span>
            <span className={s.end}>{wait ? <Pill size="sm" tone={wait.late ? "alert" : "warn"}>{wait.late ? "Pasó el plazo" : "Por atender"}</Pill> : <Due row={row} />}</span>
            <ChevronRight size={18} aria-hidden="true" className={cn(s.chevron, "hidden lg:block", selection.on && "invisible")} />
          </>;
          // En modo selección la fila elige a la persona en lugar de abrir su ficha.
          if (selection.on) return <li key={row.id} className={cn("flex items-center pl-3", selection.selected.has(keyOf(row)) && "bg-muted")}><SelectBox selection={selection} id={keyOf(row)} label={row.name} /><div className={cn(s.item, "min-w-0 flex-1 cursor-pointer")} onClick={() => selection.toggle(keyOf(row))}>{body}</div></li>;
          return <li key={row.id}><Link href={row.href} className={s.item} onMouseEnter={() => onPreview(row.id)} onFocus={() => onPreview(row.id)}>{body}</Link></li>;
        })}</ul>
      </li>;
    })}</ul>
  </Card>;
}
