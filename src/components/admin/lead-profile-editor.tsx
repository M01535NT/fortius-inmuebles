"use client";
import * as React from "react";
import { db, upsert, type Lead } from "@/lib/admin/store";
import { AsyncForm, btnGhost, btnPrimary } from "./ui";
import { LeadFields, LeadProfileSummary, readLeadFields } from "./lead-fields";

export function LeadProfileEditor({ lead, onDraftChange, readOnly = false }: { lead: Lead; onDraftChange?: (lead: Lead | null) => void; readOnly?: boolean }) {
  const [draft, setDraft] = React.useState<{ lead: Lead; version: number | null } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const name = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (draft) name.current?.focus(); }, [draft]);
  const finish = () => { setDraft(null); onDraftChange?.(null); heading.current?.focus(); };
  return <section className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 ref={heading} tabIndex={-1} className="display-soft text-lg">Perfil del lead</h2>
      {!draft && !readOnly ? <button type="button" className={btnGhost} onClick={() => { setDraft({ lead, version: db.leads.version(lead) }); onDraftChange?.(lead); }}>Editar ficha</button> : null}
    </div>
    {draft ? <AsyncForm className="min-w-0 space-y-4" onSubmit={async event => {
      event.preventDefault();
      const fields = readLeadFields(event.currentTarget, draft.lead);
      setSaving(true);
      try { await upsert(db.leads, { ...draft.lead, ...fields }, draft.version); finish(); }
      finally { setSaving(false); }
    }}>
      <LeadFields lead={draft.lead} nombreRef={name} />
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary}>Guardar ficha</button>
        <button type="button" disabled={saving} className={btnGhost} onClick={finish}>Cancelar edición</button>
      </div>
    </AsyncForm> : <LeadProfileSummary perfil={lead.perfil} />}
  </section>;
}
