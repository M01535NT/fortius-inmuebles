"use client";
import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Check, Circle, CircleDot, Info, MinusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import s from "./kit.module.css";

/*
  Componentes del panel guiado. Referencia visual:
  docs/diseno/lienzo-panel/Componentes.dc.html
  Sus estilos (kit.module.css) están fuera de las capas de Tailwind: una clase de
  Tailwind sirve para acomodar (márgenes, alineación, flex) pero no reemplaza el
  relleno, el tamaño ni los colores del componente. Para eso, agrega una variante.
*/

type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger" | "dangerSolid";
type ButtonProps = { variant?: ButtonVariant; size?: "md" | "lg"; iconOnly?: boolean; className?: string };

function buttonClass({ variant = "secondary", size = "md", iconOnly = false, className }: ButtonProps) {
  return cn(s.btn, s[variant], size === "lg" && s.lg, iconOnly && s.iconOnly, className);
}

export function Button({ variant, size, iconOnly, className, type = "button", ...props }: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, size, iconOnly, className })} {...props} />;
}

export function ButtonLink({ variant, size, iconOnly, className, ...props }: ButtonProps & React.ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, iconOnly, className })} {...props} />;
}

/** Estados de un requisito con sus nombres sencillos (encargo, sección 4). */
export const REVIEW_STATE_UI = {
  pendiente: { label: "Pendiente", icon: Circle },
  recibido: { label: "Lo tengo", icon: CircleDot },
  revisado: { label: "Revisado ✓", icon: Check },
  observado: { label: "Hay un problema", icon: AlertTriangle },
  no_aplica: { label: "No aplica", icon: MinusCircle },
} as const;
export type ReviewStateKey = keyof typeof REVIEW_STATE_UI;

export function StatusChip({ state, className }: { state: ReviewStateKey; className?: string }) {
  const { label, icon: Icon } = REVIEW_STATE_UI[state];
  return <span className={cn(s.chip, s[state], className)}><Icon size={16} aria-hidden="true" />{label}</span>;
}

export function Eyebrow({ as: Tag = "p", className, ...props }: { as?: "p" | "h2" | "h3" | "span" } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cn(s.eyebrow, className)} {...props} />;
}

export function Card({ as: Tag = "section", className, ...props }: { as?: "section" | "div" | "article" | "aside" } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cn(s.card, className)} {...props} />;
}

/** Avance de etapas: línea completa en computadora, «Etapa N de M» con barra en celular. */
export function StageProgress({ stages, current, notes, compact = false }: { stages: readonly string[]; current: number; notes?: Partial<Record<number, string>>; compact?: boolean }) {
  const total = stages.length;
  if (compact) return <div className="flex flex-col gap-2">
    <p className="flex justify-between gap-3 text-[0.9375rem]"><span className="font-semibold">{stages[current - 1]}</span><span className="font-mono text-sm text-muted-foreground">Etapa {current} de {total}</span></p>
    <ProgressBar value={current} max={total} label={`Etapa ${current} de ${total}`} />
  </div>;
  return <ol aria-label="Avance de la operación" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
    {stages.map((name, i) => {
      const n = i + 1, done = n < current, here = n === current;
      return <li key={name} aria-current={here ? "step" : undefined} className="flex min-w-0 flex-col gap-2">
        <span className={s.stepLine} data-on={done || here} />
        <span className="flex items-baseline gap-1.5"><span className="font-mono text-xs text-muted-foreground">{n}</span><span className={cn("text-sm leading-snug", here ? "font-bold" : "font-medium text-muted-foreground")}>{name}</span></span>
        <span className="text-xs text-muted-foreground">{notes?.[n] ?? (done ? "Lista" : here ? "Aquí vas" : "")}{done && <span className="sr-only"> (terminada)</span>}</span>
      </li>;
    })}
  </ol>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}><span style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} /></div>;
}

export type TabItem<K extends string> = { id: K; label: string; count?: number };
export function Tabs<K extends string>({ items, value, onChange, label, idPrefix }: { items: TabItem<K>[]; value: K; onChange: (id: K) => void; label: string; idPrefix: string }) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  function onKey(event: React.KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].id);
  }
  return <div className={s.tabs} role="tablist" aria-label={label}>
    {items.map((item, i) => <button key={item.id} ref={el => { refs.current[i] = el; }} type="button" role="tab" id={`${idPrefix}-tab-${item.id}`} aria-controls={`${idPrefix}-panel-${item.id}`} aria-selected={item.id === value} tabIndex={item.id === value ? 0 : -1} className={s.tab} onClick={() => onChange(item.id)} onKeyDown={e => onKey(e, i)}>
      {item.label}{item.count !== undefined && <span className="font-mono text-xs">{item.count}</span>}
    </button>)}
  </div>;
}

export function TabPanel({ idPrefix, id, children, className }: { idPrefix: string; id: string; children: React.ReactNode; className?: string }) {
  return <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} className={className}>{children}</div>;
}

export function Segmented<K extends string>({ options, value, onChange, label, className }: { options: Array<{ id: K; label: string; disabled?: boolean }>; value: K; onChange: (id: K) => void; label: string; className?: string }) {
  return <div className={cn(s.seg, className)} role="radiogroup" aria-label={label}>
    {options.map(o => <button key={o.id} type="button" role="radio" aria-checked={o.id === value} disabled={o.disabled} className={s.segItem} onClick={() => onChange(o.id)}>{o.label}</button>)}
  </div>;
}

export function Notice({ title, children, tone = "warn", actions, className }: { title?: React.ReactNode; children?: React.ReactNode; tone?: "warn" | "info"; actions?: React.ReactNode; className?: string }) {
  const Icon = tone === "warn" ? AlertTriangle : Info;
  return <div className={cn(s.notice, className)} data-tone={tone} role="status">
    <Icon size={20} aria-hidden="true" />
    <div className="flex min-w-0 flex-col gap-2.5">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className="text-sm">{children}</div>}
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  </div>;
}

export function EmptyBox({ icon, title, children, action }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return <div className={s.empty}>{icon}<p className="font-semibold text-foreground">{title}</p>{children && <div className="text-sm">{children}</div>}{action}</div>;
}

/** Panel que se abre a la derecha en computadora y desde abajo en celular. Escape y el velo lo cierran. */
export function Sheet({ open, onClose, eyebrow, title, description, children, footer }: { open: boolean; onClose: () => void; eyebrow?: string; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const panel = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-sheet-close])")?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return <>
    <button type="button" className={s.scrim} aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
    <div ref={panel} className={s.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
        <div className="flex flex-col gap-1.5">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h2 id={titleId} className="text-xl font-bold leading-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <button type="button" data-sheet-close className={buttonClass({ variant: "ghost", iconOnly: true })} aria-label="Cerrar" onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
      {footer && <div className="flex flex-col-reverse gap-2.5 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-7">{footer}</div>}
    </div>
  </>;
}
