"use client";
import { btnGhost, inputClass, selectClass } from "@/components/admin/ui";
import { PLAN_TABLES, type PlanRow, type PlanTable } from "@/lib/formatos/plan";
import { MoneyInput } from "@/components/admin/money-input";

/** Tablas del plan 10: renglones fijos de la plantilla (materiales, canales, decisiones) o renglones que se agregan (comparables, publicidad). */
export function PlanRowsEditor({ kind, value, onChange }: { kind: PlanTable; value: unknown; onChange: (rows: PlanRow[]) => void }) {
  const config = PLAN_TABLES[kind];
  const stored = Array.isArray(value) ? value as PlanRow[] : [];
  const fixed = config.fixed;
  const rows = fixed.length ? fixed.map((item) => stored.find((row) => row?.concepto === item.key) ?? { concepto: item.key }) : stored;
  const update = (index: number, key: string, next: string | number | undefined) => onChange(rows.map((row, at) => at === index ? { ...row, [key]: next } : row));
  return <div className="space-y-3">
    {rows.map((row, index) => <div key={fixed.length ? String(row.concepto) : index} className="rounded-lg border border-border bg-card p-4">
      <h4 className="mb-3 font-semibold">{fixed.length ? fixed[index].label : `${kind === "comparables" ? "Comparable" : "Registro"} ${index + 1}`}</h4>
      <div className="grid gap-3 sm:grid-cols-2">{config.columns.map((column) => <label key={column.key} className="text-sm">{column.label}
        {column.options ? <select className={selectClass} value={String(row[column.key] ?? "")} onChange={(event) => update(index, column.key, event.target.value || undefined)}><option value="">Selecciona</option>{column.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          : column.type === "money" ? <MoneyInput value={row[column.key]} onValueChange={(next) => update(index, column.key, next === "" ? undefined : next)} />
          : column.type === "number" ? <input className={inputClass} type="number" min={0} step="any" inputMode="decimal" value={String(row[column.key] ?? "")} onChange={(event) => update(index, column.key, event.target.value === "" ? undefined : Number(event.target.value))} />
          : <input className={inputClass} type={column.type === "date" ? "date" : "text"} value={String(row[column.key] ?? "")} onChange={(event) => update(index, column.key, event.target.value)} />}
      </label>)}</div>
      {!fixed.length && <button type="button" className={`${btnGhost} mt-3`} onClick={() => onChange(rows.filter((_, at) => at !== index))}>Quitar</button>}
    </div>)}
    {!fixed.length && <button type="button" className={btnGhost} disabled={rows.length >= config.max} onClick={() => onChange([...rows, {}])}>{kind === "comparables" ? "Agregar comparable" : "Agregar registro"}</button>}
  </div>;
}
