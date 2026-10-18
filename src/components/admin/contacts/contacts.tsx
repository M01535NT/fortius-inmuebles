"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Plus, Search, X } from "@/components/admin/icons";
import { Avatar, Button, Card, EmptyBox, Pill, TabPanel, Tabs } from "@/components/admin/kit";
import { AsyncForm, inputClass, selectClass } from "@/components/admin/ui";
import { LeadFields, readLeadFields } from "@/components/admin/lead-fields";
import { ClienteEditor } from "@/components/admin/cliente-editor";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { useQuickCreate } from "@/components/admin/workspace/quick-create";
import { duplicateContacts } from "@/lib/admin/workspace";
import { operationalDate } from "@/lib/admin/operational-date";
import { clientRows, leadRows, matches, type ContactRow } from "@/lib/admin/contacts-view";
import { LEAD_ESTADOS, LEAD_ESTADO_LABELS, db, uid, upsert, useCollection, type Lead, type LeadEstado } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import { ContactPreview } from "./contact-preview";
import s from "./contacts.module.css";

/*
  Contactos (boceto aprobado por el titular, 17/10/2026). Pestañas Prospectos y Clientes en
  «?tab=»; una sola lista de personas con sus iniciales, lo que buscan, la zona y el
  presupuesto, y el siguiente paso con su fecha; en computadora se lee en columnas. El estado
  del prospecto, la conversión y la edición se hacen en la ficha de cada persona. En
  computadora, a la derecha se ve la vista previa de la persona señalada (con el puntero o el
  teclado); los «inmuebles que coinciden» del boceto no existen todavía en el sistema (EXT-01).
*/

type Tab = "prospectos" | "clientes";
type Filter = LeadEstado | "todos" | "convertidos";

export function ContactsScreen() {
  const params = useSearchParams(), router = useRouter(), pathname = usePathname();
  const tab: Tab = params.get("tab") === "clientes" ? "clientes" : "prospectos";
  const leads = useCollection(db.leads), clients = useCollection(db.clientes), tasks = useCollection(db.tareas), events = useCollection(db.eventos);
  const today = operationalDate();
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("todos");
  const [adding, setAdding] = React.useState(() => params.get("nuevo") === "1");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const nameInput = React.useRef<HTMLInputElement>(null);
  const searchInput = React.useRef<HTMLInputElement>(null);

  function choose(next: Tab) {
    setAdding(false);
    router.replace(next === "prospectos" ? pathname : `${pathname}?tab=${next}`, { scroll: false });
  }
  function openLeadCapture() {
    if (tab !== "prospectos") router.replace(pathname, { scroll: false });
    setAdding(true);
  }
  useQuickCreate("prospecto", openLeadCapture);
  React.useEffect(() => { if (adding && tab === "prospectos") nameInput.current?.focus(); }, [adding, tab]);
  React.useEffect(() => { if (searching) searchInput.current?.focus(); }, [searching]);

  const open = leads.filter(l => !l.clienteId);
  const leadList = leads.filter(l => filter === "convertidos" ? !!l.clienteId : !l.clienteId && (filter === "todos" || l.estado === filter));
  const rows = tab === "prospectos"
    ? leadRows(leadList, tasks, events, today).filter(r => { const l = leadList.find(x => x.id === r.id)!; return matches(query, l.nombre, l.telefono, l.email, l.zona, l.tipoPropiedad, l.mensaje, l.perfil?.requisitos, r.wants); })
    : clientRows(clients, tasks, events, today).filter(r => { const c = clients.find(x => x.id === r.id)!; return matches(query, c.nombre, c.telefono, c.email, c.zona, c.tipoPropiedad, r.wants); });
  const duplicates = tab === "prospectos" ? leads.filter(l => duplicateContacts(l, leads).length > 0).length : 0;
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
      <Button iconOnly aria-label="Agregar contacto" aria-expanded={adding} onClick={() => setAdding(v => !v)}><Plus size={20} aria-hidden="true" /></Button>
    </div>
    <div className="hidden lg:block"><Button variant={adding ? "secondary" : "primary"} aria-expanded={adding} onClick={() => setAdding(v => !v)}>{adding ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{adding ? "Cerrar" : "Agregar contacto"}</Button></div>
  </>}>
    {searching && <div className="mb-4 lg:hidden">{searchField}</div>}
    {/* La captura del prospecto solo se oculta al cerrarla, para no perder lo escrito. */}
    {tab === "prospectos" && <div hidden={!adding}><Card as="div" className="mb-5 p-4 sm:p-6">
      <AsyncForm onSubmit={captureLead} className="flex min-w-0 flex-col gap-4" aria-label="Nuevo prospecto">
        <h2 className="m-0 text-lg">Nuevo prospecto</h2>
        <LeadFields nombreRef={nameInput} />
        <div className="flex flex-wrap gap-3"><Button type="submit" variant="primary" disabled={saving}>{saving ? "Guardando…" : "Guardar prospecto"}</Button><Button variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button></div>
      </AsyncForm>
    </Card></div>}
    {tab === "clientes" && adding && <Card as="div" className="mb-5 p-4 sm:p-6"><ClienteEditor key="nuevo" onDone={() => setAdding(false)} /></Card>}
    <div className={s.tabsRow}>
      <Tabs idPrefix="contactos" label="Tipo de contacto" value={tab} onChange={choose} items={[{ id: "prospectos", label: "Prospectos", count: open.length }, { id: "clientes", label: "Clientes", count: clients.length }]} />
      {tab === "prospectos" && <label className={s.filter}><span className="sr-only">Mostrar prospectos</span><select className={selectClass} value={filter} onChange={e => setFilter(e.target.value as Filter)}>
        <option value="todos">Todos los estados</option>
        {LEAD_ESTADOS.map(e => <option key={e} value={e}>{LEAD_ESTADO_LABELS[e]}</option>)}
        <option value="convertidos">Ya son clientes</option>
      </select></label>}
    </div>
    <TabPanel idPrefix="contactos" id={tab} className="mt-5 min-w-0">
      {rows.length === 0 ? <EmptyBox title={query.trim() || filter !== "todos" ? "Nadie coincide con la búsqueda" : tab === "prospectos" ? "Todavía no hay prospectos" : "Todavía no hay clientes"}>
        {query.trim() || filter !== "todos" ? "Prueba con otro nombre, teléfono o estado." : tab === "prospectos" ? "Llegan solos desde los formularios del sitio, o agrégalos con «Agregar contacto»." : "Un prospecto se vuelve cliente desde su ficha, o agrégalo con «Agregar contacto»."}
      </EmptyBox> : <div className={s.frame}>
        <ContactList rows={rows} onPreview={setSelected} />
        {previewRow && <ContactPreview key={previewRow.id} row={previewRow} lead={previewRow.kind === "lead" ? leads.find(l => l.id === previewRow.id) : undefined} client={previewRow.kind === "cliente" ? clients.find(c => c.id === previewRow.id) : undefined} tasks={tasks} events={events} today={today} />}
      </div>}
      {duplicates > 0 && <p className="mt-4 text-sm text-muted-foreground">{duplicates === 1 ? "1 prospecto podría estar repetido" : `${duplicates} prospectos podrían estar repetidos`}: revisa su ficha antes de abrir una operación.</p>}
    </TabPanel>
  </GuidedPage>;
}

function Due({ row }: { row: ContactRow }) {
  return row.when ? <Pill size="sm" tone={row.late ? "alert" : "muted"}>{row.when}</Pill> : <Pill size="sm" tone="muted">Sin fecha</Pill>;
}

function ContactList({ rows, onPreview }: { rows: ContactRow[]; onPreview: (id: string) => void }) {
  return <Card as="div" className={s.listCard}>
    <div className={s.head} aria-hidden="true"><span>Persona</span><span>Lo que busca</span><span>Siguiente paso</span><span>Fecha</span></div>
    <ul className={s.list} aria-label="Contactos">{rows.map(row => <li key={row.id}><Link href={row.href} className={s.item} onMouseEnter={() => onPreview(row.id)} onFocus={() => onPreview(row.id)}>
      <Avatar name={row.name} size={44} />
      <span className={s.person}><strong>{row.name}</strong><span className={s.meta}>{row.phone}</span></span>
      <span className={s.wants}><span className="[overflow-wrap:anywhere]">{row.wants}</span><span className={s.meta}>{[row.zone, row.budget].filter(Boolean).join(" · ")}</span></span>
      <span className={s.step}><span className={cn("lg:hidden", s.meta)}>Sigue:</span><span className={cn(!row.when && "text-muted-foreground")}>{row.step}</span></span>
      <span className={s.end}><Due row={row} /></span>
      <ChevronRight size={18} aria-hidden="true" className={cn(s.chevron, "hidden lg:block")} />
    </Link></li>)}</ul>
  </Card>;
}
