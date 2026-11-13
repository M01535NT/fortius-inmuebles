"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { describeValue, suggestedSide, type ConflictField, type ConflictSide } from "@/lib/admin/conflict";
import { setConflictResolver, type ConflictRequest } from "@/lib/admin/store";

/*
  Conflicto de versión explicado (RP-17, UX-04). Alguien guardó el mismo registro mientras lo
  editabas: cada campo distinto muestra «Tu cambio» y «Lo que se guardó antes» para elegir. Los
  campos que cambió solo uno de los dos llegan elegidos; los que cambiaron los dos se eligen a
  mano. «Cancelar» no guarda nada y tu captura sigue en pantalla.
*/
type Pending = ConflictRequest & { resolve: (choice: Record<string, ConflictSide> | null) => void };

export function ConflictHost() {
  const [pending, setPending] = React.useState<Pending | null>(null);
  React.useEffect(() => setConflictResolver(request => new Promise(resolve => setPending({ ...request, resolve }))), []);
  if (!pending) return null;
  const finish = (choice: Record<string, ConflictSide> | null) => { pending.resolve(choice); setPending(null); };
  return <ConflictDialog fields={pending.fields} onDone={finish} />;
}

function ConflictDialog({ fields, onDone }: { fields: ConflictField[]; onDone: (choice: Record<string, ConflictSide> | null) => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = React.useState<Record<string, ConflictSide | undefined>>(() => Object.fromEntries(fields.map(f => [f.key, suggestedSide(f)])));
  const [tried, setTried] = React.useState(false);
  React.useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) { if (typeof node.showModal === "function") node.showModal(); else node.setAttribute("open", ""); }
    return () => { if (node?.open) { if (typeof node.close === "function") node.close(); else node.removeAttribute("open"); } };
  }, []);
  const missing = fields.filter(f => !choice[f.key]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    if (missing.length) { dialog.current?.querySelector<HTMLInputElement>(`input[name="conflicto-${missing[0].key}"]`)?.focus(); return; }
    onDone(Object.fromEntries(fields.map(f => [f.key, choice[f.key]!])));
  }
  return <dialog ref={dialog} className="admin-confirm admin-conflict" aria-labelledby="conflict-title" aria-describedby="conflict-text" onCancel={event => { event.preventDefault(); onDone(null); }}>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <h2 id="conflict-title" className="m-0 text-lg font-semibold">Alguien guardó antes que tú</h2>
      <p id="conflict-text" className="m-0 text-sm">Mientras editabas se guardó otra versión. Elige qué se queda en cada dato; nada se guarda hasta que lo confirmes.</p>
      <div className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto">
        {fields.map(field => <fieldset key={field.key} className="m-0 flex flex-col gap-2 rounded-[var(--radius-control)] border border-[var(--card-edge)] p-3" aria-invalid={tried && !choice[field.key] ? true : undefined}>
          <legend className="px-1 text-sm font-semibold">{field.label}{field.changed === "both" && <span className="font-normal text-muted-foreground"> · cambiaron los dos</span>}</legend>
          {(["mine", "theirs"] as const).map(side => <label key={side} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[var(--radius-control)] p-2 text-sm hover:bg-[var(--secondary)]">
            <input type="radio" name={`conflicto-${field.key}`} value={side} checked={choice[field.key] === side} onChange={() => setChoice(old => ({ ...old, [field.key]: side }))} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
            <span className="flex min-w-0 flex-col gap-0.5"><strong>{side === "mine" ? "Tu cambio" : "Lo que se guardó antes"}</strong><span className="text-muted-foreground [overflow-wrap:anywhere]">{describeValue(side === "mine" ? field.mine : field.theirs)}</span></span>
          </label>)}
        </fieldset>)}
      </div>
      {tried && missing.length > 0 && <p role="alert" className="m-0 text-sm text-destructive">Elige qué se queda en {missing.length === 1 ? `«${missing[0].label}»` : `${missing.length} datos`}.</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={() => onDone(null)}>Cancelar</Button>
        <Button variant="primary" type="submit">Guardar lo elegido</Button>
      </div>
    </form>
  </dialog>;
}
