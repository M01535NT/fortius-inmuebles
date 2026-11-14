"use client";
import * as React from "react";
import { AlertTriangle, Check, RotateCcw, X } from "@/components/admin/icons";
import { Button } from "@/components/admin/kit";
import { errorMessage } from "@/lib/admin/store";
import { bulkSummary, failedOf, mergeRetry, runBulk, type BulkResult, type BulkTarget } from "@/lib/admin/bulk";

/*
  Acciones masivas y edición en la fila (RP-12, RP-13; UX-03, boceto aprobado por el titular el
  13/11/2026). «Seleccionar» cambia las casillas de la lista a casillas de selección; con algo
  elegido aparece abajo una barra con las acciones. El resultado se ve registro por registro y
  «Reintentar» repite solo los que fallaron. El responsable y la fecha se cambian en la fila con el
  mismo control de versión que la ficha.
*/

export function useSelection(visibleIds: string[]) {
  const [on, setOn] = React.useState(false);
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set());
  // Lo que deja de verse (filtros, borrado) sale de la selección.
  const visible = React.useMemo(() => new Set(visibleIds), [visibleIds]);
  const selected = React.useMemo(() => new Set([...picked].filter(id => visible.has(id))), [picked, visible]);
  const toggle = React.useCallback((id: string) => setPicked(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; }), []);
  const setAll = React.useCallback((ids: string[], value: boolean) => setPicked(old => { const next = new Set(old); ids.forEach(id => value ? next.add(id) : next.delete(id)); return next; }), []);
  const start = React.useCallback(() => { setPicked(new Set()); setOn(true); }, []);
  const stop = React.useCallback(() => { setPicked(new Set()); setOn(false); }, []);
  const replace = React.useCallback((ids: string[]) => setPicked(new Set(ids)), []);
  return { on, selected, toggle, setAll, start, stop, replace };
}
export type Selection = ReturnType<typeof useSelection>;

/** Botón «Seleccionar» / «Cancelar selección» del encabezado de la lista. */
export function SelectToggle({ selection, noun }: { selection: Selection; noun: string }) {
  return <Button aria-pressed={selection.on} onClick={selection.on ? selection.stop : selection.start}>{selection.on ? "Cancelar selección" : "Seleccionar"}<span className="sr-only"> {noun}</span></Button>;
}

/** Casilla de selección de un registro (44 px de objetivo). */
export function SelectBox({ selection, id, label }: { selection: Selection; id: string; label: string }) {
  return <label className="-ml-3 flex h-11 w-11 flex-none cursor-pointer items-center justify-center self-start">
    <input type="checkbox" className="h-5 w-5 cursor-pointer accent-[var(--primary)]" checked={selection.selected.has(id)} onChange={() => selection.toggle(id)} aria-label={`Seleccionar: ${label}`} />
  </label>;
}

/** Casilla «todas» de un grupo: marca o desmarca los registros visibles del grupo. */
export function SelectGroup({ selection, ids, label }: { selection: Selection; ids: string[]; label: string }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const count = ids.filter(id => selection.selected.has(id)).length;
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = count > 0 && count < ids.length; }, [count, ids.length]);
  return <label className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center">
    <input ref={ref} type="checkbox" className="h-5 w-5 cursor-pointer accent-[var(--primary)]" checked={count > 0 && count === ids.length} onChange={event => selection.setAll(ids, event.target.checked)} aria-label={`Seleccionar todo: ${label}`} />
  </label>;
}

export type BulkAction = {
  id: string;
  /** Texto del desplegable («Reasignar a…») y sus opciones; sin opciones es un botón. */
  label: string;
  options?: Array<{ value: string; label: string }>;
  /** «Se reasignaron», «Se cambiaron»: encabeza el resultado. */
  verb?: string;
  /** Aplica a un registro; devuelve «sin-cambio» si ya tenía el valor. Sin `apply` la acción es inmediata (exportar). */
  apply?: (id: string, value: string) => Promise<"aplicado" | "sin-cambio">;
  run?: (ids: string[]) => void;
  icon?: React.ReactNode;
};

type Done = { verb: string; action: BulkAction; value: string; results: BulkResult[]; retried: boolean };

/**
 * Barra de acciones de lo seleccionado y resultado por registro. La barra queda pegada abajo (en
 * el celular, encima de la barra de pestañas) y solo aparece con algo seleccionado.
 */
export function BulkBar({ selection, targets, actions, noun }: { selection: Selection; targets: BulkTarget[]; actions: BulkAction[]; noun: { one: string; many: string; empty: string } }) {
  const [choice, setChoice] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = React.useState<Done | null>(null);
  const [error, setError] = React.useState("");
  const chosen = targets.filter(t => selection.selected.has(t.id));
  const count = chosen.length;
  const resultRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (done) resultRef.current?.focus(); }, [done]);

  async function apply(action: BulkAction, value: string, list: BulkTarget[], previous?: Done) {
    if (!action.apply || busy) return;
    setError(""); setBusy({ done: 0, total: list.length });
    try {
      const results = await runBulk(list, id => action.apply!(id, value), n => setBusy({ done: n, total: list.length }));
      const merged = previous ? mergeRetry(previous.results, results) : results;
      setDone({ verb: action.verb ?? "Se aplicaron", action, value, results: merged, retried: !!previous });
      // Lo que falló queda seleccionado para revisarlo; lo aplicado sale de la selección.
      selection.replace(failedOf(merged).map(r => r.id));
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(null); }
  }
  function onAction(action: BulkAction) {
    if (action.run) { action.run(chosen.map(t => t.id)); return; }
    const value = choice[action.id] ?? "";
    if (action.options && !value) { setError(`Elige una opción en «${action.label}».`); return; }
    setDone(null);
    void apply(action, value, chosen);
  }

  const failed = done ? failedOf(done.results) : [];
  return <>
    {done && <div ref={resultRef} tabIndex={-1} role="status" className="rounded-[var(--radius-card,12px)] border border-border bg-card p-4 outline-none sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 font-semibold">{bulkSummary(done.results, done.verb)}</p>
        <Button variant="ghost" iconOnly aria-label="Cerrar el resultado" onClick={() => setDone(null)}><X size={18} aria-hidden="true" /></Button>
      </div>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-sm">
        {done.results.map(r => <li key={r.id} className="flex items-start gap-2">
          {r.status === "fallo" ? <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-none text-[var(--alert)]" /> : <Check size={16} aria-hidden="true" className="mt-0.5 flex-none text-[var(--success,currentColor)]" />}
          <span className="min-w-0 break-words"><span className="font-medium">{r.label}</span>{r.status === "sin-cambio" ? <span className="text-muted-foreground"> · ya estaba así</span> : r.status === "fallo" ? <>: {r.reason}</> : null}</span>
        </li>)}
      </ul>
      {failed.length > 0 && <Button className="mt-3" disabled={!!busy} onClick={() => void apply(done.action, done.value, failed, done)}><RotateCcw size={16} aria-hidden="true" />{failed.length === 1 ? "Reintentar la que falló" : `Reintentar las ${failed.length} que fallaron`}</Button>}
      {done.retried && <p className="m-0 mt-2 text-sm text-muted-foreground">Las que ya se habían aplicado no se repitieron.</p>}
    </div>}
    {selection.on && <div className="sticky bottom-0 z-20 pb-3 pt-1">
      <div role="region" aria-label="Acciones de lo seleccionado" className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card,12px)] border border-border bg-card p-2.5 shadow-[var(--shadow-float)] sm:px-3">
        <p className="m-0 mr-1 px-1 text-sm font-semibold" aria-live="polite">{count ? `${count} ${count === 1 ? noun.one : noun.many}` : noun.empty}</p>
        {count > 0 && actions.map(action => action.options
          ? <select key={action.id} aria-label={action.label} className="min-h-11 rounded-md border border-border bg-background px-3 text-sm" value={choice[action.id] ?? ""} disabled={!!busy}
              onChange={event => { setChoice({ [action.id]: event.target.value }); setError(""); }}>
              <option value="">{action.label}</option>
              {action.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          : null)}
        {count > 0 && actions.filter(a => a.run).map(action => <Button key={action.id} disabled={!!busy} onClick={() => onAction(action)}>{action.icon}{action.label}</Button>)}
        {count > 0 && actions.some(a => a.options) && <Button variant="primary" className="ml-auto" disabled={!!busy}
          onClick={() => { const action = actions.find(a => a.options && choice[a.id]); if (action) onAction(action); else setError("Elige qué cambiar antes de aplicar."); }}>
          {busy ? `Aplicando ${busy.done} de ${busy.total}…` : "Aplicar"}
        </Button>}
      </div>
      {error && <p role="alert" className="m-0 mt-1.5 px-1 text-sm text-destructive">{error}</p>}
    </div>}
  </>;
}

/** Un dato que se cambia en la fila: muestra el valor y, al pulsarlo, el control para cambiarlo. */
function InlineShell({ label, display, tone, editing, setEditing, error, saving, children }: { label: string; display: React.ReactNode; tone?: "late"; editing: boolean; setEditing: (on: boolean) => void; error: string; saving: boolean; children: React.ReactNode }) {
  return <span className="inline-flex min-w-0 flex-col">
    {editing ? children
      : <button type="button" onClick={() => setEditing(true)} disabled={saving} aria-label={`${label}: ${typeof display === "string" ? display : ""}. Cambiar`}
          className={"inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md px-2 text-left text-sm hover:bg-muted focus-visible:outline-2 " + (tone === "late" ? "font-semibold text-[var(--alert)]" : "text-muted-foreground")}>
          {saving ? "Guardando…" : display}
        </button>}
    {error && <span role="alert" className="px-2 text-xs text-destructive">{error}</span>}
  </span>;
}

function useInlineSave(onSave: (value: string) => Promise<unknown>) {
  const [editing, setEditing] = React.useState(false), [saving, setSaving] = React.useState(false), [error, setError] = React.useState("");
  const save = async (value: string) => {
    setEditing(false); setSaving(true); setError("");
    try { await onSave(value); } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  };
  return { editing, setEditing: (on: boolean) => { setEditing(on); if (on) setError(""); }, saving, error, save };
}

export function InlineSelect({ label, value, options, display, onSave }: { label: string; value: string; options: Array<{ value: string; label: string }>; display: string; onSave: (value: string) => Promise<unknown> }) {
  const state = useInlineSave(onSave);
  return <InlineShell label={label} display={display} {...state}>
    <select autoFocus aria-label={label} className="min-h-11 rounded-md border border-border bg-background px-2 text-sm" defaultValue={value}
      onChange={event => { if (event.target.value !== value) void state.save(event.target.value); else state.setEditing(false); }}
      onBlur={() => state.setEditing(false)} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); state.setEditing(false); } }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </InlineShell>;
}

export function InlineDate({ label, value, display, tone, onSave }: { label: string; value?: string; display: string; tone?: "late"; onSave: (value: string) => Promise<unknown> }) {
  const state = useInlineSave(onSave);
  const [draft, setDraft] = React.useState(value ?? "");
  const commit = () => { if (draft !== (value ?? "")) void state.save(draft); else state.setEditing(false); };
  return <InlineShell label={label} display={display} tone={tone} {...state}>
    <input autoFocus type="date" aria-label={label} className="min-h-11 rounded-md border border-border bg-background px-2 text-sm" value={draft}
      onChange={event => setDraft(event.target.value)} onBlur={commit}
      onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } if (event.key === "Escape") { event.stopPropagation(); setDraft(value ?? ""); state.setEditing(false); } }} />
  </InlineShell>;
}
