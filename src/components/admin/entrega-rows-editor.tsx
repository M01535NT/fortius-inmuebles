"use client";
import { btnGhost, inputClass } from "@/components/admin/ui";
import { ENTREGA_TABLAS, type EntregaRow, type EntregaTabla } from "@/lib/formatos/entrega";

export function EntregaRowsEditor({ kind, value, onChange }: { kind: EntregaTabla; value: unknown; onChange: (rows: EntregaRow[]) => void }) {
  const rows = Array.isArray(value) ? value as EntregaRow[] : [];
  const columns = ENTREGA_TABLAS[kind].columns;
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">{columns.map((column) => <label key={column.key} className="text-sm">{column.label}<input className={inputClass} value={row[column.key] ?? ""} onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: event.target.value } : item))} /></label>)}</div>
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar registro</button>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 30} onClick={() => onChange([...rows, {}])}>Agregar registro</button>
  </div>;
}
