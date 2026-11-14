"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Search, X } from "@/components/admin/icons";
import { apiRequest, db, errorMessage, upsert, useCollection, useSession } from "@/lib/admin/store";
import { normalizedText } from "@/lib/admin/workspace";
import { PERSON_STATUS_LABEL } from "@/lib/admin/person-status";
import { commandsFor, filterCommands, pushRecent, typingTarget } from "@/lib/admin/commands";
import { isTaskOpen } from "@/lib/tasks";
import { usePersonStatus } from "./use-person-status";
import { usePreferences, savePanel } from "./preferences-store";
import { ShortcutsHelp, useSingleKeyShortcuts } from "./shortcuts";
import { ADMIN_NAV, MAIN_NAV, QUICK_CREATE, TOOLS_NAV } from "./guided-nav";
import { Button, Kbd } from "@/components/admin/kit";

import s from "./guided-nav.module.css";

/*
  Barra de comandos (RP-10, UX-03; antes «Buscador rápido»): un botón en la barra superior (y en el
  encabezado del celular) que abre la ventana; Ctrl K (⌘K) la abre desde cualquier pantalla y «/»
  también, si los atajos de una tecla están encendidos. Busca personas, inmuebles, tareas y folios;
  además crea, lleva a cualquier sección permitida y marca tareas como hechas (con el mismo control
  de versión que la ficha). Sin escribir, muestra los últimos 5 registros abiertos (Recientes).
  Las flechas recorren los resultados. La ventana no anima al abrir con el teclado.
*/

type Result = { id: string; label: string; detail: string; text: string; href: string; taskId?: string };

export function WorkspaceSearch({ label = "Buscar persona, inmueble o folio", variant = "icon", hotkey = variant === "field" }: { label?: string; variant?: "field" | "icon"; hotkey?: boolean } = {}) {
  const titleId = React.useId();
  const session = useSession();
  const pathname = usePathname();
  const [opened, setOpened] = React.useState(false);
  const properties = useCollection(db.propiedades, opened),
    leads = useCollection(db.leads, opened),
    clients = useCollection(db.clientes, opened),
    tasks = useCollection(db.tareas, opened);
  const status = usePersonStatus();
  const prefs = usePreferences();
  const { value: singleKeys } = useSingleKeyShortcuts();
  const dialog = React.useRef<HTMLDialogElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [dossiers, setDossiers] = React.useState<{ id: string; folio: string; cliente_id?: string }[]>([]);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [help, setHelp] = React.useState(false);
  const open = React.useCallback(() => {
    if (dialog.current?.open) return;
    setOpened(true);
    dialog.current?.showModal();
    setError(""); setDone("");
    apiRequest<{ expedientes: { id: string; folio: string; cliente_id?: string }[] }>("/api/admin/expedientes")
      .then(result => setDossiers(result.expedientes ?? []))
      .catch(() => setError("No se pudieron buscar operaciones. Los demás resultados siguen disponibles."));
  }, []);
  // Ctrl K (o ⌘K) abre desde cualquier pantalla; «/» y «?» solo fuera de campos y si los atajos de una
  // tecla están encendidos (RP-11). Solo el botón de la barra superior escucha, para abrir una sola ventana.
  React.useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); open(); return; }
      if (!singleKeys || event.ctrlKey || event.metaKey || event.altKey || typingTarget(event.target) || document.querySelector("dialog[open]")) return;
      if (event.key === "/") { event.preventDefault(); open(); }
      else if (event.key === "?") { event.preventDefault(); setHelp(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, open, singleKeys]);
  // Recientes (N03): cada registro que se abre queda al frente; se guarda con las preferencias del usuario.
  const recent = React.useMemo(() => prefs?.panel?.recientes ?? [], [prefs]);
  // Una página se intenta guardar una sola vez por visita: si el servidor falla, la lista regresa y,
  // sin esta marca, el efecto volvería a intentarlo sin fin.
  const attempted = React.useRef("");
  React.useEffect(() => {
    if (!hotkey || !session || !prefs || !pathname || recent[0] === pathname || attempted.current === pathname) return;
    const next = pushRecent(recent, pathname);
    if (!next.length || next[0] !== pathname) return;
    attempted.current = pathname;
    void savePanel(session.id, { recientes: next }).catch(() => undefined);
  }, [hotkey, session, prefs, pathname, recent]);

  const clientName = (id?: string) => clients.find(c => c.id === id)?.nombre;
  const all: Result[] = [
    ...properties.map(p => ({ id: `p:${p.slug}`, label: p.titulo, detail: `Inmueble · ${p.codigo}`, text: `${p.titulo} ${p.codigo} ${p.zona}`, href: `/admin/propiedades/${p.slug}/editar` })),
    ...leads.filter(l => !l.clienteId).map(l => ({ id: `l:${l.id}`, label: l.nombre, detail: PERSON_STATUS_LABEL[status.ofLead(l) ?? "prospecto"], text: `${l.nombre} ${l.telefono} ${l.email ?? ""}`, href: `/admin/leads/${l.id}` })),
    ...clients.map(c => ({ id: `c:${c.id}`, label: c.nombre, detail: (s => s ? PERSON_STATUS_LABEL[s] : "Contacto")(status.ofClient(c.id)), text: `${c.nombre} ${c.telefono} ${c.email ?? ""}`, href: `/admin/clientes/${c.id}` })),
    ...tasks.map(t => ({ id: `t:${t.id}`, label: t.titulo, detail: isTaskOpen(t) ? "Tarea" : "Tarea hecha", text: t.titulo, href: `/admin/tareas/${t.id}`, taskId: isTaskOpen(t) ? t.id : undefined })),
    ...dossiers.map(e => ({ id: `e:${e.id}`, label: clientName(e.cliente_id) ?? e.folio, detail: `Operación · ${e.folio}`, text: `${e.folio} ${clientName(e.cliente_id) ?? ""}`, href: `/admin/operaciones/${encodeURIComponent(e.id)}` })),
  ];
  const results = all.filter(item => normalizedText(item.text).includes(normalizedText(query)));
  // Solo lo que hoy se puede ver: un reciente que ya no aparece en tus módulos no se muestra.
  const recents = recent.map(href => all.find(item => item.href === href)).filter((item): item is Result => !!item);
  const commands = filterCommands(commandsFor(session?.role, { quick: QUICK_CREATE, nav: [...MAIN_NAV, TOOLS_NAV], admin: ADMIN_NAV }), query).slice(0, 6);
  const close = () => dialog.current?.close();
  const stores = [db.propiedades, db.leads, db.clientes, db.tareas];

  async function complete(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || busy) return;
    setBusy(taskId); setDone(""); setError("");
    try { await upsert(db.tareas, { ...task, estado: "completada" }, db.tareas.version(task.id)); setDone(`Completaste «${task.titulo}».`); }
    catch (cause) { setError(`No se pudo marcar como hecha: ${errorMessage(cause)}`); }
    finally { setBusy(""); }
  }
  // Las flechas recorren los resultados y las acciones; desde la búsqueda, ↓ entra a la lista.
  function arrows(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const options = [...(list.current?.querySelectorAll<HTMLElement>("[data-option]") ?? [])];
    if (!options.length) return;
    event.preventDefault();
    const at = options.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (at < 0 ? 0 : Math.min(at + 1, options.length - 1)) : at <= 0 ? -1 : at - 1;
    if (next < 0) dialog.current?.querySelector<HTMLInputElement>("input[type=search]")?.focus(); else options[next].focus();
  }
  const row = (item: Result) => <li key={item.id} className="flex items-center gap-1">
    <Link data-option onClick={close} href={item.href} className={`${s.result} min-w-0 flex-1`}>
      <span className="min-w-0 flex-1 break-words font-medium">{item.label}</span><span className={s.resultKind}>{item.detail}</span>
    </Link>
    {item.taskId && <Button data-option variant="ghost" iconOnly disabled={busy === item.taskId} onClick={() => void complete(item.taskId!)} aria-label={`Marcar como hecha: ${item.label}`} title="Marcar como hecha"><Check size={18} aria-hidden="true" /></Button>}
  </li>;

  return <>
    {variant === "field"
      ? <button ref={trigger} type="button" data-tour="buscar" className={s.searchIcon} aria-label="Buscar en el panel" title={`${label} (Ctrl K)`} onClick={open}><Search size={20} aria-hidden="true" /></button>
      : <button ref={trigger} type="button" data-tour="buscar" className={s.searchIcon} aria-label="Buscar en el panel" title={label} onClick={open}><Search size={20} aria-hidden="true" /></button>}
    <dialog ref={dialog} aria-labelledby={titleId} onClose={() => { trigger.current?.focus(); setQuery(""); setDone(""); }} onKeyDown={arrows} className={s.palette}>
      <div className={s.paletteHead}>
        <Search size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
        <h2 id={titleId} className="sr-only">Buscar en el panel</h2>
        <input autoFocus type="search" aria-label="Buscar personas, inmuebles o folios, o escribir qué quieres hacer" placeholder="Nombre, folio o lo que quieres hacer" value={query} onChange={e => setQuery(e.target.value)} />
        <Button variant="ghost" iconOnly onClick={close} aria-label="Cerrar búsqueda"><X size={20} aria-hidden="true" /></Button>
      </div>
      <div ref={list} className={s.paletteBody}>
        {opened && stores.some(store => store.state().status === "loading" || store.state().status === "idle") && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">Buscando en tus módulos…</p>}
        {opened && stores.some(store => store.state().status === "error") && <p role="alert" className="px-3 py-2 text-sm">La búsqueda está incompleta. No se pudo consultar alguno de los módulos.</p>}
        {error && <p role="alert" className="px-3 py-2 text-sm text-destructive">{error}</p>}
        {done && <p role="status" className="px-3 py-2 text-sm">{done}</p>}
        {query.trim() ? <>
          {commands.length > 0 && <>
            <p className={s.paletteTitle}>Acciones</p>
            <ul aria-label="Acciones">{commands.map(command => <li key={command.id}><Link data-option onClick={close} href={command.href} className={s.result}>
              <span className="min-w-0 flex-1 break-words font-medium">{command.label}</span><span className={s.resultKind}>{command.detail}</span>
            </Link></li>)}</ul>
          </>}
          <p className={s.paletteTitle} role="status">{results.length} resultados{results.length > 30 ? " · primeros 30" : ""}</p>
          <ul aria-label="Resultados">{results.slice(0, 30).map(row)}</ul>
        </> : recents.length ? <>
          <p className={s.paletteTitle}>Recientes</p>
          <ul aria-label="Recientes">{recents.map(row)}</ul>
        </> : <>
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Escribe un nombre, teléfono, código o folio, o lo que quieres hacer («nueva tarea», «ir a reportes»).</p>
        </>}
      </div>
      <p className={s.paletteFoot}><span><Kbd>↑ ↓</Kbd> recorre</span><span><Kbd>Esc</Kbd> cierra</span><span><Kbd>Ctrl K</Kbd> abre desde cualquier pantalla</span><button type="button" className="underline underline-offset-2" onClick={() => setHelp(true)}>Atajos</button></p>
    </dialog>
    {hotkey && <ShortcutsHelp open={help} onClose={() => setHelp(false)} />}
  </>;
}
