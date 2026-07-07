"use client";

import * as React from "react";

/*
  Primitivos utilitarios del panel: mismo sistema de tokens que el sitio,
  vibe más densa y funcional. Sin dependencias nuevas.
*/

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50";
export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-[13.5px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]";
export const btnDanger =
  "inline-flex h-9 items-center justify-center rounded-md border border-destructive/40 px-3 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10";
export const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-[14px] text-foreground placeholder:text-muted-foreground/60";
export const textareaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60";
export const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-2.5 text-[14px] text-foreground";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <h1 className="display-title text-3xl text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-[64ch] text-[13.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-border bg-secondary text-foreground/80",
    green: "border-primary/40 bg-primary/10 text-primary",
    amber: "border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    red: "border-destructive/40 bg-destructive/10 text-destructive",
  } as const;
  return (
    <span
      className={
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.05em] " +
        tones[tone]
      }
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="display-soft text-lg text-foreground">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-[48ch] text-[13.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* Aviso permanente: el panel opera sobre datos locales hasta el backend. */
export function DemoBanner() {
  return (
    <p className="rounded-md border border-amber-600/30 bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-800 dark:text-amber-300">
      Modo demostración: los cambios se guardan en este navegador
      (localStorage) y aún no modifican el sitio público. La conexión a base
      de datos llega con el hito M3/M4.
    </p>
  );
}
