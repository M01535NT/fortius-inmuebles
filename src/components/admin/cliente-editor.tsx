"use client";
import * as React from "react";
import { AsyncForm, Field, btnPrimary, btnGhost, inputClass, selectClass, textareaClass } from "./ui";
import { LeadFields, readLeadFields } from "./lead-fields";
import { db, useCollection, upsert, uid, type Cliente } from "@/lib/admin/store";

export const CLIENTE_TIPO_LABELS: Record<Cliente["tipo"], string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  arrendador: "Arrendador",
  arrendatario: "Arrendatario",
  inversionista: "Inversionista",
  otro: "Otro",
};
export function ClienteEditor({
  initial,
  onDone,
}: {
  initial?: Cliente;
  onDone: () => void;
}) {
  const [cliente] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [version] = React.useState(() =>
    initial ? db.clientes.version(initial) : null,
  );
  const asesores = useCollection(db.asesores);
  return (
    <AsyncForm
      className="space-y-4 rounded-lg border border-border bg-card p-5"
      onSubmit={async (e) => {
        const data = new FormData(e.currentTarget);
        const v = (key: string) => String(data.get(key) ?? "").trim();
        const now = new Date().toISOString();
        setSaving(true);
        try { const saved = await upsert(
          db.clientes,
          {
            ...cliente,
            id: cliente?.id ?? uid(),
            nombre: v("nombre"),
            telefono: v("telefono"),
            email: v("email") || undefined,
            tipo: v("tipo") as Cliente["tipo"],
            asesorId: v("asesorId") || undefined,
            notas: v("notas"),
            creadoEl: cliente?.creadoEl ?? now,
            actualizadoEl: now,
            ...(cliente?.leadId ? readLeadFields(e.currentTarget, cliente) : {}),
          },
          version,
        );
        if (cliente?.leadId && saved.asesorId !== cliente.asesorId) {
          // The database synchronizes the linked lead in this same transaction.
          // Invalidate any older read before following the retained history link.
          db.leads.clear();
          await db.leads.load().catch(() => {});
        }
        onDone(); } finally { setSaving(false); }
      }}
    >
      <h2 className="display-soft text-lg">
        {cliente ? "Editar cliente" : "Nuevo cliente"}
      </h2>
      {cliente?.leadId ? <LeadFields lead={cliente} /> : <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="cl-nombre">
          <input
            id="cl-nombre"
            name="nombre"
            required
            defaultValue={cliente?.nombre}
            className={inputClass}
          />
        </Field>
        <Field label="Teléfono" htmlFor="cl-telefono">
          <input
            id="cl-telefono"
            name="telefono"
            type="tel"
            required
            defaultValue={cliente?.telefono}
            className={inputClass}
          />
        </Field>
        <Field label="Correo" htmlFor="cl-email">
          <input
            id="cl-email"
            name="email"
            type="email"
            defaultValue={cliente?.email}
            className={inputClass}
          />
        </Field>
        <Field label="Asesor responsable" htmlFor="cl-asesor">
          <select id="cl-asesor" name="asesorId" defaultValue={cliente?.asesorId ?? ""} className={selectClass}>
            <option value="">Sin asignar</option>
            {asesores.map(a => <option key={a.id} value={a.id}>{a.nombre}{a.activo ? "" : " (inactivo)"}</option>)}
          </select>
        </Field>
      </div>}
        <Field label="Tipo de cliente" htmlFor="cl-tipo">
          <select
            id="cl-tipo"
            name="tipo"
            defaultValue={cliente?.tipo ?? "otro"}
            className={selectClass}
          >
            {Object.entries(CLIENTE_TIPO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      <Field label="Notas" htmlFor="cl-notas">
        <textarea
          id="cl-notas"
          name="notas"
          rows={4}
          defaultValue={cliente?.notas}
          className={textareaClass}
        />
      </Field>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary}>
          Guardar cliente
        </button>
        <button type="button" disabled={saving} onClick={onDone} className={btnGhost}>
          Cancelar
        </button>
      </div>
    </AsyncForm>
  );
}
