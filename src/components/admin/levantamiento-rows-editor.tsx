"use client";
import { btnGhost, inputClass } from "@/components/admin/ui";
import { LEVANTAMIENTO_TABLES, type LevantamientoTable, type LevantamientoRow } from "@/lib/formatos/levantamiento";

export function LevantamientoRowsEditor({ kind, value, onChange }: { kind: LevantamientoTable; value: unknown; onChange: (rows: LevantamientoRow[]) => void }) {
  const rows = Array.isArray(value) ? value as LevantamientoRow[] : [];
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">{LEVANTAMIENTO_TABLES[kind].columns.map((column) => <label key={column.key} className="text-sm">{column.label}
        <input className={inputClass} type="text" maxLength={2000} value={row[column.key] ?? ""} onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: event.target.value } : item))} />
      </label>)}</div>
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar registro</button>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 30} onClick={() => onChange([...rows, {}])}>Agregar registro</button>
  </div>;
}
