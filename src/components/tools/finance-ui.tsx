"use client";
import { useId, useState, type ReactNode } from "react";
import type { FinancialReport } from "@/lib/finance/report";
import {
  FINANCIAL_REVIEW_DATE,
  FINANCIAL_VERSION,
} from "@/data/financial-rules";
export const inputClass =
  "h-12 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-primary";
export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50";
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string, hintId: string | undefined) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children(id, hint ? `${id}-hint` : undefined)}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
export function AmountField({
  label,
  value,
  onChange,
  hint,
  min = 0,
  max,
  step = 0.01,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id, describedby) => (
        <input
          id={id}
          aria-describedby={describedby}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  );
}
export function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 border-b border-border py-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words font-mono text-2xl tracking-tight text-foreground md:text-3xl">
        {value}
        {note && (
          <p className="mt-2 text-xs leading-relaxed tracking-normal text-muted-foreground">
            {note}
          </p>
        )}
      </dd>
    </div>
  );
}
export function ExportButton({
  report,
  filename,
}: {
  report: FinancialReport;
  filename: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className={buttonClass}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { downloadFinancialReport } = await import(
              "@/lib/finance/report"
            );
            await downloadFinancialReport(report, filename);
          } catch {
            setError(
              "No se pudo generar el PDF. Intenta descargarlo de nuevo.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Preparando PDF…" : "Descargar PDF"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
export function PrivacyNote() {
  return (
    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
      Tus cifras se quedan en esta pestaña. Puedes descargar el resultado sin
      registrarte.
    </p>
  );
}
export function Method({ children }: { children: ReactNode }) {
  return (
    <details className="mt-5 border-t border-border pt-4 text-sm">
      <summary className="cursor-pointer py-2 font-medium">
        Fuentes y método
      </summary>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
        <p>
          Reglas revisadas el {FINANCIAL_REVIEW_DATE}. Versión{" "}
          {FINANCIAL_VERSION}. Si cambia el año o la norma, la actualización
          requiere una nueva revisión.
        </p>
      </div>
    </details>
  );
}
