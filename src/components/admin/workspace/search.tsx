"use client";
import * as React from "react";
import Link from "next/link";
import { Search, X } from "@/components/admin/icons";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { normalizedText } from "@/lib/admin/workspace";
import { Button, Kbd } from "@/components/admin/kit";
import { QUICK_CREATE } from "./guided-nav";
import s from "./guided-nav.module.css";

/*
  Buscador rápido: un botón en la barra superior (y en el encabezado del celular) que abre la
  ventana; Ctrl K la abre desde cualquier pantalla. Busca personas, inmuebles, tareas y folios
  y ofrece crear rápidamente. La ventana no anima al abrir con el teclado.
*/

export function WorkspaceSearch({ label = "Buscar persona, inmueble o folio", variant = "icon", hotkey = variant === "field" }: { label?: string; variant?: "field" | "icon"; hotkey?: boolean } = {}) {
  const titleId = React.useId();
  const [opened, setOpened] = React.useState(false);
  const properties = useCollection(db.propiedades, opened),
    leads = useCollection(db.leads, opened),
    clients = useCollection(db.clientes, opened),
    tasks = useCollection(db.tareas, opened);
  const dialog = React.useRef<HTMLDialogElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const [query, setQuery] = React.useState("");
  const [dossiers, setDossiers] = React.useState<{ id: string; folio: string; cliente_id?: string }[]>([]);
  const [error, setError] = React.useState("");
  const open = React.useCallback(() => {
    if (dialog.current?.open) return;
    setOpened(true);
    dialog.current?.showModal();
    setError("");
    apiRequest<{ expedientes: { id: string; folio: string; cliente_id?: string }[] }>("/api/admin/expedientes")
      .then(result => setDossiers(result.expedientes ?? []))
      .catch(() => setError("No se pudieron buscar operaciones. Los demás resultados siguen disponibles."));
  }, []);
  // Ctrl K (o ⌘K) abre la búsqueda desde cualquier pantalla; solo el botón de la barra superior escucha, para abrir una sola ventana.
  React.useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); open(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, open]);
  const results = [
    ...properties.map(p => ({ id: `p:${p.slug}`, label: p.titulo, detail: `Inmueble · ${p.codigo}`, text: `${p.titulo} ${p.codigo} ${p.zona}`, href: `/admin/propiedades/${p.slug}/editar` })),
    ...leads.filter(l => !l.clienteId).map(l => ({ id: `l:${l.id}`, label: l.nombre, detail: "Prospecto", text: `${l.nombre} ${l.telefono} ${l.email ?? ""}`, href: `/admin/leads/${l.id}` })),
    ...clients.map(c => ({ id: `c:${c.id}`, label: c.nombre, detail: "Cliente", text: `${c.nombre} ${c.telefono} ${c.email ?? ""}`, href: `/admin/clientes/${c.id}` })),
    ...tasks.map(t => ({ id: `t:${t.id}`, label: t.titulo, detail: "Tarea", text: t.titulo, href: `/admin/tareas/${t.id}` })),
    ...dossiers.map(e => ({ id: `e:${e.id}`, label: clients.find(c => c.id === e.cliente_id)?.nombre ?? e.folio, detail: `Operación · ${e.folio}`, text: `${e.folio} ${clients.find(c => c.id === e.cliente_id)?.nombre ?? ""}`, href: `/admin/operaciones/${encodeURIComponent(e.id)}` })),
  ].filter(item => normalizedText(item.text).includes(normalizedText(query)));
  const close = () => dialog.current?.close();
  const stores = [db.propiedades, db.leads, db.clientes, db.tareas];
  return <>
    {variant === "field"
      ? <button ref={trigger} type="button" className={s.searchIcon} aria-label="Buscar en el panel" title={`${label} (Ctrl K)`} onClick={open}><Search size={20} aria-hidden="true" /></button>
      : <button ref={trigger} type="button" className={s.searchIcon} aria-label="Buscar en el panel" title={label} onClick={open}><Search size={20} aria-hidden="true" /></button>}
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => { trigger.current?.focus(); setQuery(""); }} className={s.palette}>
      <div className={s.paletteHead}>
        <Search size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
        <h2 id={titleId} className="sr-only">Buscar en el panel</h2>
        <input autoFocus type="search" aria-label="Buscar personas, inmuebles o folios" placeholder="Nombre, teléfono, código o folio" value={query} onChange={e => setQuery(e.target.value)} />
        <Button variant="ghost" iconOnly onClick={close} aria-label="Cerrar búsqueda"><X size={20} aria-hidden="true" /></Button>
      </div>
      <div className={s.paletteBody}>
        {opened && stores.some(store => store.state().status === "loading" || store.state().status === "idle") && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">Buscando en tus módulos…</p>}
        {opened && stores.some(store => store.state().status === "error") && <p role="alert" className="px-3 py-2 text-sm">La búsqueda está incompleta. No se pudo consultar alguno de los módulos.</p>}
        {error && <p role="status" className="px-3 py-2 text-sm">{error}</p>}
        {query.trim() ? <>
          <p className={s.paletteTitle} role="status">{results.length} resultados{results.length > 30 ? " · primeros 30" : ""}</p>
          <ul>{results.slice(0, 30).map(item => <li key={item.id}><Link onClick={close} href={item.href} className={s.result}>
            <span className="min-w-0 flex-1 break-words font-medium">{item.label}</span><span className={s.resultKind}>{item.detail}</span>
          </Link></li>)}</ul>
        </> : <>
          <p className={s.paletteTitle}>Crear rápidamente</p>
          <div className={s.quick}>{QUICK_CREATE.map(item => <Link key={item.href} href={item.href} onClick={() => { close(); window.dispatchEvent(new CustomEvent("fortius:quick-create", { detail: item.action })); }}><item.icon size={18} aria-hidden={true} />{item.label}</Link>)}</div>
        </>}
      </div>
      <p className={s.paletteFoot}><span><Kbd>Esc</Kbd> cierra</span><span><Kbd>Ctrl K</Kbd> abre desde cualquier pantalla</span></p>
    </dialog>
  </>;
}
