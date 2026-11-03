"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus, Search, UserPlus, X } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Card, EmptyBox, Pill } from "@/components/admin/kit";
import f from "@/components/admin/form.module.css";
import { AsyncForm, inputClass } from "@/components/admin/ui";
import { LeadFields, readLeadFields } from "@/components/admin/lead-fields";
import { ClienteEditor } from "@/components/admin/cliente-editor";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { duplicateContacts } from "@/lib/admin/workspace";
import { operationalDate } from "@/lib/admin/operational-date";
import { clientRows, leadRows, matches, type ContactRow, type PersonOperation } from "@/lib/admin/contacts-view";
import { LEAD_ESTADO_LABELS, apiRequest, db, uid, upsert, useCollection, type Lead } from "@/lib/admin/store";
import { processStageText, type OperationWorkflow, type WorkflowStage } from "@/lib/formatos/operation-workflow";
import { cn } from "@/lib/utils";
import { ContactPreview } from "./contact-preview";
import { useConditions } from "@/lib/admin/conditions";
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
const SEGUIMIENTO = new Set(["contactado", "en-evaluacion", "activo"]);

export function ContactsScreen() {
  const params = useSearchParams(), router = useRouter();
  const leads = useCollection(db.leads), clients = useCollection(db.clientes), tasks = useCollection(db.tareas), events = useCollection(db.eventos);
  const today = operationalDate();
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>(() => params.get("tab") === "clientes" ? "clientes" : "todas");
  const [adding, setAdding] = React.useState(() => params.get("nuevo") === "1");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  // COR-15: una sola entrada para la llamada. Quien vende u ofrece en renta va a Nueva operación.
  const [seeks, setSeeks] = React.useState(false);
  const nameInput = React.useRef<HTMLInputElement>(null);
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

  function openLeadCapture() {
    if (filter === "clientes") setFilter("todas");
    setAdding(true);
  }
  useQuickCreate("prospecto", openLeadCapture);
  React.useEffect(() => { if (adding && seeks && filter !== "clientes") nameInput.current?.focus(); }, [adding, seeks, filter]);
  React.useEffect(() => { if (searching) searchInput.current?.focus(); }, [searching]);

  const open = leads.filter(l => !l.clienteId);
  const estadoDe = (id: string) => leads.find(l => l.id === id)?.estado;
  const inFilter = (kind: "lead" | "cliente", id: string) => {
    if (filter === "todas") return true;
    if (filter === "clientes") return kind === "cliente";
    const estado = kind === "lead" ? estadoDe(id) : undefined;
    return kind === "lead" && (filter === "nuevos" ? estado === "nuevo" : filter === "seguimiento" ? !!estado && SEGUIMIENTO.has(estado) : estado === "descartado");
  };
  const counts = Object.fromEntries(FILTERS.map(item => [item.id, item.id === "todas" ? open.length + clients.length : item.id === "clientes" ? clients.length : open.filter(l => item.id === "nuevos" ? l.estado === "nuevo" : item.id === "seguimiento" ? SEGUIMIENTO.has(l.estado) : l.estado === "descartado").length])) as Record<Filter, number>;
  const rows = [
    ...leadRows(open, tasks, events, today).filter(r => { const l = open.find(x => x.id === r.id)!; return matches(query, l.nombre, l.telefono, l.email, l.zona, l.tipoPropiedad, l.mensaje, l.perfil?.requisitos, r.wants); }),
    ...clientRows(clients, tasks, events, today, operations).filter(r => { const c = clients.find(x => x.id === r.id)!; return matches(query, c.nombre, c.telefono, c.email, c.zona, c.tipoPropiedad, r.wants); }),
  ].filter(r => inFilter(r.kind, r.id)).sort((x, y) => x.sort.localeCompare(y.sort) || x.name.localeCompare(y.name, "es"));
  const duplicates = filter === "clientes" ? 0 : leads.filter(l => duplicateContacts(l, leads).length > 0).length;
  const previewRow = rows.find(r => r.id === selected) ?? rows[0];

  async function captureLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const lead: Lead = { id: uid(), ...readLeadFields(form), origen: "manual", estado: "nuevo", creadoEl: new Date().toISOString(), notas: [] };
    setSaving(true);
    try {
      await upsert(db.leads, lead, null);
      form.reset(); setAdding(false);
      router.push(`/admin/leads/${lead.id}`);
    } finally { setSaving(false); }
  }

  const searchField = <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar nombre o teléfono</span><input ref={searchInput} type="search" className={inputClass} placeholder="Buscar nombre o teléfono" value={query} onChange={e => setQuery(e.target.value)} /></label>;

  return <GuidedPage title="Contactos" subtitle={<span className="hidden sm:inline">Las personas con las que hablamos y lo que buscan.</span>} actions={<>
    <div className="hidden lg:block">{searchField}</div>
    <div className="flex gap-2 lg:hidden">
      <Button iconOnly variant="ghost" aria-label={searching ? "Cerrar búsqueda" : "Buscar"} aria-expanded={searching} onClick={() => { setSearching(v => !v); if (searching) setQuery(""); }}>{searching ? <X size={20} aria-hidden="true" /> : <Search size={20} aria-hidden="true" />}</Button>
      <Button iconOnly data-tour="contactos-agregar" aria-label="Agregar contacto" aria-expanded={adding} onClick={() => setAdding(v => !v)}><Plus size={20} aria-hidden="true" /></Button>
    </div>
    <div className="hidden lg:block"><Button variant={adding ? "secondary" : "primary"} data-tour="contactos-agregar" aria-expanded={adding} onClick={() => setAdding(v => !v)}>{adding ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{adding ? "Cerrar" : "Agregar contacto"}</Button></div>
  </>}>
    {searching && <div className="mb-4 lg:hidden">{searchField}</div>}
    {/* La captura del prospecto solo se oculta al cerrarla, para no perder lo escrito. */}
    {filter !== "clientes" && <div hidden={!adding} className="mb-5"><section className={f.window} aria-label="Nuevo prospecto">
      <div className={f.windowHead}>
        <div className={f.windowTitle}><span className={f.windowIcon}><UserPlus size={22} aria-hidden="true" /></span><div><h2>Nuevo prospecto</h2><p>{seeks ? "Al guardarlo se abre su ficha para seguirlo." : "¿Qué quiere hacer?"}</p></div></div>
        <Button variant="ghost" iconOnly aria-label="Cerrar captura" onClick={() => setAdding(false)}><X size={20} aria-hidden="true" /></Button>
      </div>
      <div role="group" aria-label="¿Qué quiere hacer?" className="flex flex-wrap gap-2">
        <ButtonLink href="/admin/operaciones/nueva?intencion=vender">Vender su inmueble</ButtonLink>
        <ButtonLink href="/admin/operaciones/nueva?intencion=arrendar">Ofrecer su inmueble en renta</ButtonLink>
        <ButtonLink href="/admin/operaciones/nueva?intencion=invertir">Invertir</ButtonLink>
        <Button aria-pressed={seeks} onClick={() => setSeeks(true)}>Busca comprar o rentar</Button>
      </div>
      {!seeks && <p className="text-sm text-muted-foreground">Si vende, ofrece en renta o invierte, se abre Nueva operación para capturar la llamada completa.</p>}
      <AsyncForm hidden={!seeks} onSubmit={captureLead} className={cn("flex min-w-0 flex-col gap-4", !seeks && "hidden")} aria-label="Nuevo prospecto">
        <LeadFields nombreRef={nameInput} />
        <div className={f.windowFoot}><Button type="submit" variant="primary" disabled={saving}>{saving ? "Guardando…" : "Guardar prospecto"}</Button><Button variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div>
      </AsyncForm>
    </section></div>}
    {filter === "clientes" && adding && <section className={cn(f.window, "mb-5")} aria-label="Nuevo cliente">
      <div className={f.windowHead}>
        <div className={f.windowTitle}><span className={f.windowIcon}><UserPlus size={22} aria-hidden="true" /></span><div><h2>Nuevo cliente</h2><p>Para alguien que ya es cliente sin pasar por prospecto.</p></div></div>
        <Button variant="ghost" iconOnly aria-label="Cerrar captura" onClick={() => setAdding(false)}><X size={20} aria-hidden="true" /></Button>
      </div>
      <ClienteEditor key="nuevo" title={false} onDone={() => setAdding(false)} />
    </section>}
    <div className={s.tabsRow}>
      <div className={s.chips} role="group" aria-label="Mostrar personas" data-tour="contactos-filtros">{FILTERS.map(item => <button key={item.id} type="button" className={s.chipBtn} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setAdding(false); }}>{item.label}<span className={s.chipCount}>{counts[item.id]}</span></button>)}</div>
    </div>
    <div className="mt-5 min-w-0">
      {rows.length === 0 ? <EmptyBox title={query.trim() || filter !== "todas" ? "Nadie coincide con la búsqueda" : "Todavía no hay contactos"}>
        {query.trim() || filter !== "todas" ? "Prueba con otro nombre, teléfono o estado." : true ? "Llegan solos desde los formularios del sitio, o agrégalos con «Agregar contacto»." : "Un prospecto se vuelve cliente desde su ficha, o agrégalo con «Agregar contacto»."}
      </EmptyBox> : <div className={s.frame} data-tour="contactos-lista">
        <ContactList rows={rows} onPreview={setSelected} conditionOf={row => conditions.ofPerson(row.kind, row.id)?.text} stageOf={row => row.kind === "cliente" ? "Cliente" : LEAD_ESTADO_LABELS[estadoDe(row.id) ?? "nuevo"]} />
        {previewRow && <ContactPreview key={previewRow.id} row={previewRow} lead={previewRow.kind === "lead" ? leads.find(l => l.id === previewRow.id) : undefined} client={previewRow.kind === "cliente" ? clients.find(c => c.id === previewRow.id) : undefined} tasks={tasks} events={events} today={today} />}
      </div>}
      {duplicates > 0 && <p className="mt-4 text-sm text-muted-foreground">{duplicates === 1 ? "1 prospecto podría estar repetido" : `${duplicates} prospectos podrían estar repetidos`}: revisa su ficha antes de abrir una operación.</p>}
    </div>
  </GuidedPage>;
}

function Due({ row }: { row: ContactRow }) {
  return row.when ? <Pill size="sm" tone={row.late ? "alert" : "muted"}>{row.when}</Pill> : null;
}

function ContactList({ rows, onPreview, stageOf, conditionOf }: { rows: ContactRow[]; onPreview: (id: string) => void; stageOf: (row: ContactRow) => string; conditionOf: (row: ContactRow) => string | undefined }) {
  return <Card as="div" className={s.listCard}>
    <ul className={s.list} aria-label="Contactos">{rows.map(row => <li key={row.id}><Link href={row.href} className={s.item} onMouseEnter={() => onPreview(row.id)} onFocus={() => onPreview(row.id)}>
      <Avatar name={row.name} size={44} />
      <span className={s.person}><strong>{row.name}</strong><span className={s.meta}>{row.phone}</span></span>
      <span className={s.wants}><span className="[overflow-wrap:anywhere]"><Pill size="sm" tone={row.kind === "cliente" ? "success" : "muted"}>{stageOf(row)}</Pill> {conditionOf(row) && <><Pill size="sm" tone="warn">{conditionOf(row)}</Pill> </>}{row.wants}</span>{(row.zone || row.budget) && <span className={s.meta}>{[row.zone, row.budget].filter(Boolean).join(" · ")}</span>}</span>
      <span className={s.step}>{row.step && <><span className={cn("lg:hidden whitespace-nowrap", s.meta)}>Sigue:</span><span className={cn(!row.when && "text-muted-foreground")}>{row.step}</span></>}</span>
      <span className={s.end}><Due row={row} /></span>
      <ChevronRight size={18} aria-hidden="true" className={cn(s.chevron, "hidden lg:block")} />
    </Link></li>)}</ul>
  </Card>;
}
