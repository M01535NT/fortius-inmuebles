"use client";
import type { FormatoDefinition } from "@/lib/formatos/catalog";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { BudgetRowsEditor } from "@/components/admin/budget-rows-editor";

export function FormatoEditor({ definition, values, onChange }: {
  definition: FormatoDefinition;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return <div className="grid gap-5 md:grid-cols-2">
    {definition.fields.map((field) => {
      const id = `formato-${field.key}`;
      const value = values[field.key] ?? "";
      const wide = field.type === "long" || field.type === "partidas" || field.type === "pagos";
      return <div key={field.key} className={wide ? "md:col-span-2" : ""}>
        {field.type === "partidas" || field.type === "pagos" ? <h3 className="mb-1.5 text-sm font-medium text-foreground">{field.label}</h3> : <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</label>}
        {field.type === "partidas" || field.type === "pagos" ? <BudgetRowsEditor kind={field.type} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.key === "folio" ? <input id={id} type="text" readOnly value={String(value)} className={inputClass} />
        : field.type === "choice" ? <select id={id} required={field.required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : field.key === "pagoParcialTotal" ? <select id={id} required={field.required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option><option value="total">Total</option><option value="parcial">Parcial</option>
        </select> : field.key === "moneda" || field.key === "monedaSaldo" ? <select id={id} required={field.required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option><option value="MXN">MXN</option><option value="USD">USD</option>
        </select> : wide ? <textarea id={id} required={field.required} rows={4} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={textareaClass} />
          : <input id={id} required={field.required} type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "money" || field.type === "number" ? "number" : "text"}
              step={field.type === "money" ? "0.01" : field.type === "number" ? "any" : undefined}
              min={field.type === "money" || field.type === "number" ? 0 : undefined}
              value={String(value)} onChange={(event) => onChange(field.key, field.type === "money" || field.type === "number" ? event.target.value === "" ? "" : Number(event.target.value) : event.target.value)} className={inputClass} />}
      </div>;
    })}
  </div>;
}
