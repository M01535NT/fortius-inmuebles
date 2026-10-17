"use client";
import { btnGhost, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { CARGOS_NETO, type CargoNeto } from "@/lib/formatos/neto";
import { MoneyInput } from "@/components/admin/money-input";

const defaults: CargoNeto[] = CARGOS_NETO.map((item) => ({ concepto: item.key, estado: "Pendiente", justificacion: "" }));

export function NetExpenseEditor({ value, onChange }: { value: unknown; onChange: (rows: CargoNeto[]) => void }) {
  const stored = Array.isArray(value) ? value as CargoNeto[] : [];
  const rows = [...defaults.map((item) => stored.find((candidate) => candidate.concepto === item.concepto) ?? item), ...stored.filter((item) => item.concepto === "otro1" || item.concepto === "otro2")];
  const extras = rows.filter((item) => item.concepto === "otro1" || item.concepto === "otro2");
  const update = (key: string, changes: Partial<CargoNeto>) => onChange(rows.map((item) => item.concepto === key ? { ...item, ...changes } : item));
  return <div className="space-y-3">
    {rows.map((item) => {
      const label = CARGOS_NETO.find((fixed) => fixed.key === item.concepto)?.label ?? "Otro cargo";
      return <div key={item.concepto} className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><h4 className="font-semibold">{label}</h4>{item.concepto.startsWith("otro") && <button type="button" className={btnGhost} onClick={() => onChange(rows.filter((row) => row.concepto !== item.concepto))}>Quitar</button>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {item.concepto.startsWith("otro") && <label className="text-sm sm:col-span-2">Concepto específico<input className={inputClass} value={item.descripcion ?? ""} onChange={(event) => update(item.concepto, { descripcion: event.target.value })} /></label>}
          <label className="text-sm">Estado<select className={selectClass} value={item.estado} onChange={(event) => update(item.concepto, event.target.value === "No aplica" ? { estado: "No aplica", importe: undefined } : { estado: event.target.value })}><option value="Pendiente">Pendiente</option><option value="Estimado">Estimado</option><option value="Confirmado">Confirmado</option><option value="No aplica">No aplica</option></select></label>
          <label className="text-sm">Importe en MXN<MoneyInput disabled={item.estado === "No aplica"} value={item.estado === "No aplica" ? "" : item.importe ?? ""} onValueChange={(next) => update(item.concepto, { importe: next === "" ? undefined : next })} /></label>
          <label className="text-sm sm:col-span-2">Justificación, fuente y fecha<textarea className={textareaClass} rows={2} value={item.justificacion} onChange={(event) => update(item.concepto, { justificacion: event.target.value })} /></label>
        </div>
      </div>;
    })}
    <button type="button" className={btnGhost} disabled={extras.length >= 2} onClick={() => onChange([...rows, { concepto: extras.some((item) => item.concepto === "otro1") ? "otro2" : "otro1", estado: "Pendiente", justificacion: "", descripcion: "" }])}>Agregar otro cargo</button>
    <p className="text-xs text-muted-foreground">Cada concepto requiere estado y justificación. «No aplica» también debe justificarse; los impuestos requieren respaldo profesional.</p>
  </div>;
}
