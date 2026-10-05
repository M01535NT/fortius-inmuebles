"use client";
import { btnGhost, inputClass, selectClass } from "@/components/admin/ui";
import { PLAN_TABLES, type PlanRow, type PlanTable } from "@/lib/formatos/plan";

export function PlanRowsEditor({ kind, value, onChange }: { kind: PlanTable; value: unknown; onChange: (rows: PlanRow[]) => void }) {
  const config = PLAN_TABLES[kind];
  const stored = Array.isArray(value) ? value as PlanRow[] : [];
  const fixed = config.fixed as readonly { key: string; label: string }[];
  const rows = fixed.length ? fixed.map((item) => stored.find((row) => row?.concepto === item.key) ?? { concepto: item.key }) : stored;
  const update = (index: number, key: string, next: string | number | undefined) => onChange(rows.map((row, at) => at === index ? { ...row, [key]: next } : row));
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={fixed.length ? String(row.concepto) : index} className="rounded-lg border border-border bg-card p-4">
      {fixed.length > 0 && <h4 className="mb-3 font-semibold">{fixed[index].label}</h4>}
      <div className="grid gap-3 sm:grid-cols-2">{config.columns.map((column) => <label key={column.key} className="text-sm">{column.label}
        {kind === "extras" && column.key === "estado" ? <select className={selectClass} value={String(row.estado ?? "")} onChange={(event) => update(index, "estado", event.target.value)}><option value="">Selecciona</option><option value="propuesto">Propuesto</option><option value="autorizado">Autorizado</option></select>
          : <input className={inputClass} type={kind === "extras" && column.key === "importe" ? "number" : column.key === "fecha" ? "date" : "text"} min={column.key === "importe" ? 0 : undefined} step={column.key === "importe" ? "0.01" : undefined} value={String(row[column.key] ?? "")} onChange={(event) => update(index, column.key, column.key === "importe" ? event.target.value === "" ? undefined : Number(event.target.value) : event.target.value)} />}
      </label>)}</div>
      {!fixed.length && <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar registro</button>}
    </div>)}
    {!fixed.length && <button type="button" className={btnGhost} disabled={rows.length >= 20} onClick={() => onChange([...rows, {}])}>Agregar registro</button>}
  </div>;
}
