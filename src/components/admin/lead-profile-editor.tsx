"use client";
import * as React from "react";
import { db, upsert, type Lead } from "@/lib/admin/store";
import { Button } from "@/components/admin/kit";
import { AsyncForm } from "./ui";
import { LeadFields, LeadProfileSummary, readLeadFields } from "./lead-fields";
import s from "./form.module.css";

export function LeadProfileEditor({ lead, onDraftChange, readOnly = false }: { lead: Lead; onDraftChange?: (lead: Lead | null) => void; readOnly?: boolean }) {
  const [draft, setDraft] = React.useState<{ lead: Lead; version: number | null } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const name = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { if (draft) name.current?.focus(); }, [draft]);
  const finish = () => { setDraft(null); onDraftChange?.(null); heading.current?.focus(); };
  // Al editar, los grupos de campos son las tarjetas; la ficha en lectura conserva su tarjeta.
  return <section className={draft ? "flex min-w-0 flex-col gap-4" : "min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 ref={heading} tabIndex={-1} className="display-soft text-lg">Perfil del prospecto</h2>
      {!draft && !readOnly ? <Button onClick={() => { setDraft({ lead, version: db.leads.version(lead) }); onDraftChange?.(lead); }}>Editar ficha</Button> : null}
    </div>
    {draft ? <AsyncForm className="flex min-w-0 flex-col gap-4" onSubmit={async event => {
      event.preventDefault();
      const fields = readLeadFields(event.currentTarget, draft.lead);
      setSaving(true);
      try { await upsert(db.leads, { ...draft.lead, ...fields }, draft.version); finish(); }
      finally { setSaving(false); }
    }}>
      <LeadFields lead={draft.lead} nombreRef={name} />
      <div className={s.windowFoot}>
        <Button type="submit" variant="primary">Guardar ficha</Button>
        <Button variant="ghost" disabled={saving} onClick={finish}>Cancelar edición</Button>
      </div>
    </AsyncForm> : <LeadProfileSummary perfil={lead.perfil} />}
  </section>;
}
