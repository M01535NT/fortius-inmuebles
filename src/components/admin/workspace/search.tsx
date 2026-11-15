"use client";
import * as React from "react";
import { Command } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { Check, Search, X } from "@/components/admin/icons";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, db, errorMessage, upsert, useCollection, useSession } from "@/lib/admin/store";
import { normalizedText } from "@/lib/admin/workspace";
import { PERSON_STATUS_LABEL } from "@/lib/admin/person-status";
import { commandsFor, filterCommands, pushRecent, typingTarget } from "@/lib/admin/commands";
import { isTaskOpen } from "@/lib/tasks";
import { usePersonStatus } from "./use-person-status";
import { usePreferences, savePanel } from "./preferences-store";
import { ShortcutsHelp, useSingleKeyShortcuts } from "./shortcuts";
import { ADMIN_NAV, MAIN_NAV, QUICK_CREATE, TOOLS_NAV } from "./guided-nav";
import { Kbd } from "@/components/admin/kit";

import s from "./guided-nav.module.css";

/*
  Barra de comandos (RP-10, UX-03) sobre cmdk dentro de una ventana de Radix (DEC-52). Ctrl K (⌘K)
  la abre desde cualquier pantalla y «/» también, si los atajos de una tecla están encendidos. Busca
  personas, inmuebles, tareas y folios; además crea, lleva a cualquier sección permitida y marca
  tareas como hechas (con el mismo control de versión que la ficha). Sin escribir, muestra los
  últimos 5 registros abiertos (Recientes). Las flechas recorren las opciones y Enter elige.
  No anima al abrir: se usa muchas veces al día y debe sentirse inmediata.
*/

type Result = { id: string; label: string; detail: string; text: string; href: string; taskId?: string };

/** Hay una ventana abierta (Radix o nativa): los atajos de una tecla no actúan detrás de ella. */
export const dialogOpen = () => !!document.querySelector("dialog[open], [role=dialog][data-state=open], [role=alertdialog]");

export function WorkspaceSearch({ label = "Buscar persona, inmueble o folio", variant = "icon", hotkey = variant === "field" }: { label?: string; variant?: "field" | "icon"; hotkey?: boolean } = {}) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [opened, setOpened] = React.useState(false);
  const properties = useCollection(db.propiedades, opened),
    leads = useCollection(db.leads, opened),
    clients = useCollection(db.clientes, opened),
    tasks = useCollection(db.tareas, opened);
  const status = usePersonStatus();
  const prefs = usePreferences();
  const { value: singleKeys } = useSingleKeyShortcuts();
  const [query, setQuery] = React.useState("");
  const [dossiers, setDossiers] = React.useState<{ id: string; folio: string; cliente_id?: string }[]>([]);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [help, setHelp] = React.useState(false);
  const show = React.useCallback(() => {
    setOpen(true); setOpened(true); setError(""); setDone("");
    apiRequest<{ expedientes: { id: string; folio: string; cliente_id?: string }[] }>("/api/admin/expedientes")
      .then(result => setDossiers(result.expedientes ?? []))
      .catch(() => setError("No se pudieron buscar operaciones. Los demás resultados siguen disponibles."));
  }, []);
  const onOpenChange = (next: boolean) => { if (next) show(); else { setOpen(false); setQuery(""); setDone(""); } };
  // Ctrl K (o ⌘K) abre desde cualquier pantalla; «/» y «?» solo fuera de campos y si los atajos de una
  // tecla están encendidos (RP-11). Solo el buscador de la barra escucha, para abrir una sola ventana.
  React.useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); show(); return; }
      if (!singleKeys || event.ctrlKey || event.metaKey || event.altKey || typingTarget(event.target) || dialogOpen()) return;
      if (event.key === "/") { event.preventDefault(); show(); }
      else if (event.key === "?") { event.preventDefault(); setHelp(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, show, singleKeys]);
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
  // El filtro es el del panel (sin acentos ni mayúsculas), no el de cmdk: cmdk solo dibuja y recorre.
  const results = all.filter(item => normalizedText(item.text).includes(normalizedText(query)));
  // Solo lo que hoy se puede ver: un reciente que ya no aparece en tus módulos no se muestra.
  const recents = recent.map(href => all.find(item => item.href === href)).filter((item): item is Result => !!item);
  const commands = filterCommands(commandsFor(session?.role, { quick: QUICK_CREATE, nav: [...MAIN_NAV, TOOLS_NAV], admin: ADMIN_NAV }), query).slice(0, 6);
  const stores = [db.propiedades, db.leads, db.clientes, db.tareas];
  const go = (href: string) => { onOpenChange(false); router.push(href); };

  async function complete(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || busy) return;
    setBusy(taskId); setDone(""); setError("");
    try { await upsert(db.tareas, { ...task, estado: "completada" }, db.tareas.version(task.id)); setDone(`Completaste «${task.titulo}».`); }
    catch (cause) { setError(`No se pudo marcar como hecha: ${errorMessage(cause)}`); }
    finally { setBusy(""); }
  }
  // Una tarea abierta lleva una segunda opción justo debajo para marcarla hecha sin abrirla.
  const rows = (items: Result[]) => items.flatMap(item => [
    <Command.Item key={item.id} value={item.id} onSelect={() => go(item.href)} className={s.result}>
      <span className="min-w-0 flex-1 break-words font-medium">{item.label}</span><span className={s.resultKind}>{item.detail}</span>
    </Command.Item>,
    ...(item.taskId ? [<Command.Item key={`${item.id}:hecha`} value={`${item.id}:hecha`} disabled={busy === item.taskId} onSelect={() => void complete(item.taskId!)} className={s.result} aria-label={`Marcar como hecha: ${item.label}`}>
      <Check size={18} aria-hidden="true" className="ml-1 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 text-sm text-muted-foreground">Marcar como hecha</span>
    </Command.Item>] : []),
  ]);

  return <>
    {variant === "field"
      ? <button type="button" className={s.searchField} aria-label="Buscar en el panel" title={`${label} (Ctrl K)`} onClick={show}><Search size={17} aria-hidden="true" /><span className={s.searchFieldText} aria-hidden="true">Buscar o ir a…</span><kbd className={s.searchKey} aria-hidden="true">Ctrl K</kbd></button>
      : <button type="button" className={s.searchIcon} aria-label="Buscar en el panel" title={label} onClick={show}><Search size={20} aria-hidden="true" /></button>}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent instant hideClose className="top-[8dvh] max-h-[min(80dvh,640px)] w-[min(640px,calc(100%-2rem))] translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Buscar en el panel</DialogTitle>
        <DialogDescription className="sr-only">Escribe un nombre, folio o lo que quieres hacer; las flechas recorren y Enter elige.</DialogDescription>
        <Command shouldFilter={false} loop label="Buscar en el panel" className="flex min-h-0 flex-1 flex-col">
          <div className={s.paletteHead}>
            <Search size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            <Command.Input autoFocus aria-label="Buscar personas, inmuebles o folios, o escribir qué quieres hacer" placeholder="Nombre, folio o lo que quieres hacer" value={query} onValueChange={setQuery} />
            <DialogClose className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Cerrar búsqueda"><X size={20} aria-hidden="true" /></DialogClose>
          </div>
          <Command.List className={s.paletteBody} label="Resultados de la búsqueda">
            {opened && stores.some(store => store.state().status === "loading" || store.state().status === "idle") && <p role="status" className="px-3 py-2 text-sm text-muted-foreground">Buscando en tus módulos…</p>}
            {opened && stores.some(store => store.state().status === "error") && <p role="alert" className="px-3 py-2 text-sm">La búsqueda está incompleta. No se pudo consultar alguno de los módulos.</p>}
            {error && <p role="alert" className="px-3 py-2 text-sm text-destructive">{error}</p>}
            {done && <p role="status" className="px-3 py-2 text-sm">{done}</p>}
            {query.trim() ? <>
              {commands.length > 0 && <Command.Group heading="Acciones" className={s.paletteGroup}>{commands.map(command =>
                <Command.Item key={command.id} value={`cmd:${command.id}`} onSelect={() => go(command.href)} className={s.result}>
                  <span className="min-w-0 flex-1 break-words font-medium">{command.label}</span><span className={s.resultKind}>{command.detail}</span>
                </Command.Item>)}</Command.Group>}
              <Command.Group heading={`${results.length} ${results.length === 1 ? "resultado" : "resultados"}${results.length > 30 ? " · primeros 30" : ""}`} className={s.paletteGroup}>{rows(results.slice(0, 30))}</Command.Group>
            </> : recents.length ? <Command.Group heading="Recientes" className={s.paletteGroup}>{rows(recents)}</Command.Group>
              : <p className="px-3 py-6 text-center text-sm text-muted-foreground">Escribe un nombre, teléfono, código o folio, o lo que quieres hacer («nueva tarea», «ir a reportes»).</p>}
          </Command.List>
        </Command>
        <p className={s.paletteFoot}><span><Kbd>↑ ↓</Kbd> recorre</span><span><Kbd>Enter</Kbd> abre</span><span><Kbd>Esc</Kbd> cierra</span><button type="button" className="underline underline-offset-2" onClick={() => { onOpenChange(false); setHelp(true); }}>Atajos</button></p>
      </DialogContent>
    </Dialog>
    {hotkey && <ShortcutsHelp open={help} onClose={() => setHelp(false)} />}
  </>;
}
