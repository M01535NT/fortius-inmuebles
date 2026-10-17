"use client";
import { btnGhost, inputClass } from "./ui";
import { PROMESA_TABLES, type PromesaTable, type PromesaRow } from "@/lib/formatos/promesa";
import { MoneyInput } from "@/components/admin/money-input";

export function PromesaRowsEditor({ kind, value, onChange }: { kind: PromesaTable; value: unknown; onChange: (rows: PromesaRow[]) => void }) {
  const rows = Array.isArray(value) ? value as PromesaRow[] : [];
  const config = PROMESA_TABLES[kind];
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={index} className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">{config.columns.map((column) => <label key={column.key} className="text-sm">{column.label}
        {column.type === "number" ? <MoneyInput value={row[column.key]} onValueChange={(next) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: next } : item))} />
        : <input className={inputClass} type={column.type} value={row[column.key] ?? ""} onChange={(event) => onChange(rows.map((item, at) => at === index ? { ...item, [column.key]: event.target.value } : item))} />}
      </label>)}</div>
      <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar {config.label} {index + 1}</button>
    </div>)}
    <button type="button" className={btnGhost} disabled={rows.length >= 30} onClick={() => onChange([...rows, {}])}>Agregar {config.label}</button>
  </div>;
}
