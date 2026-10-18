"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Building2, Check, Circle, CircleDot, Info, MinusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import s from "./kit.module.css";

/*
  Componentes del panel. Referencia visual: bocetos aprobados por el titular el 17/10/2026
  (lienzo «Bocetos del panel Fortius») y, para estados y formularios,
  docs/diseno/lienzo-panel/Componentes.dc.html. Escala admin-*: 10 px controles, 12 px fotos,
  16 px tarjetas, 20 px paneles y pastilla en estados; sombras azul marino.
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

/** Una pantalla del panel: el fondo de lienzo lo pone el marco; aquí los campos toman esquinas de 10 px. */
export function Surface({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(s.surface, className)} {...props} />;
}

type CardTone = "navy" | "alert" | "soft";
/** Tarjeta blanca con borde al 6 % y sombra en reposo. `lift` la levanta 2 px al pasar el puntero; `panel` usa la esquina de 20 px. */
export function Card({ as: Tag = "section", tone, lift, panel, className, ...props }: { as?: "section" | "div" | "article" | "aside" | "li"; tone?: CardTone; lift?: boolean; panel?: boolean } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cn(s.card, lift && s.lift, panel && s.panelRadius, className)} data-tone={tone} {...props} />;
}

/** Tarjeta que es un enlace completo (tablero, galería, resumen de Hoy). */
export function CardLink({ tone, panel, className, ...props }: { tone?: CardTone; panel?: boolean; className?: string } & React.ComponentProps<typeof Link>) {
  return <Link className={cn(s.card, s.lift, panel && s.panelRadius, className)} data-tone={tone} {...props} />;
}

export type PillTone = "neutral" | "brand" | "warn" | "alert" | "success" | "info" | "muted" | "solid" | "onDark";
/** Pastilla de estado o fecha: un color con significado fijo, texto corto. */
export function Pill({ tone = "neutral", size, className, ...props }: { tone?: PillTone; size?: "sm" } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn(s.pill, className)} data-tone={tone === "neutral" ? undefined : tone} data-size={size} {...props} />;
}

/** Contador en guinda (pendientes de Hoy). */
export function Counter({ value, label }: { value: number; label?: string }) {
  if (value <= 0) return null;
  return <span className={s.counter}>{value > 99 ? "99+" : value}{label && <span className="sr-only"> {label}</span>}</span>;
}

/** Foto de un inmueble con esquinas de 12 px; sin foto muestra el ícono. `ratio` la hace fluida («4 / 3»). */
export function Thumb({ src, alt = "", size = 52, ratio, icon, className, children }: { src?: string | null; alt?: string; size?: number; ratio?: string; icon?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  const style = ratio ? { width: "100%", aspectRatio: ratio } : { width: size, height: size };
  return <span className={cn(s.thumb, className)} style={style} aria-hidden={alt ? undefined : true}>
    {src ? <Image unoptimized fill sizes="(max-width: 767px) 50vw, 320px" src={src} alt={alt} /> : icon ?? <Building2 size={Math.max(18, Math.round(size * 0.4))} aria-hidden="true" />}
    {children}
  </span>;
}

/** Iniciales (o foto) de una persona, en un círculo neutro para no competir con los colores de estado. */
export function initialsOf(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "·";
}
export function Avatar({ name, src, size = 36, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  return <span className={cn(s.avatar, className)} style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size / 3)) }} aria-hidden="true">{src ? <Image unoptimized fill sizes="64px" src={src} alt="" /> : initialsOf(name)}</span>;
}

/** Anillo de avance pequeño («6 de 10»), con el texto para lectores de pantalla. */
export function Ring({ value, max, size = 64, stroke = 7, label, className, trackClass, valueClass }: { value: number; max: number; size?: number; stroke?: number; label: string; className?: string; trackClass?: string; valueClass?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return <svg className={cn(s.ring, className)} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
    <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={cn(s.ringTrack, trackClass)} />
    <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * share} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} className={cn(s.ringValue, valueClass)} />
  </svg>;
}

export function Kbd({ children }: { children: React.ReactNode }) { return <kbd className={s.kbd}>{children}</kbd>; }

/**
  Avance de etapas: línea completa en computadora, «Etapa N de M» con barra en celular.
  `warnings` sustituye «Lista» en una etapa pasada a la que le falta algo; con `onSelect`,
  las etapas pasadas que indica `selectable` se pueden abrir para consultarlas.
*/
export function StageProgress({ stages, current, notes, warnings, selectable, onSelect, compact = false }: {
  stages: readonly string[]; current: number; notes?: Partial<Record<number, string>>; warnings?: Partial<Record<number, string>>;
  selectable?: readonly number[]; onSelect?: (n: number) => void; compact?: boolean;
}) {
  const total = stages.length;
  if (compact) return <div className="flex flex-col gap-2">
    <p className="flex justify-between gap-3 text-[0.9375rem]"><span className="font-semibold">{stages[current - 1]}</span><span className="font-mono text-sm text-muted-foreground">Etapa {current} de {total}</span></p>
    <ProgressBar value={current} max={total} label={`Etapa ${current} de ${total}`} />
  </div>;
  return <ol aria-label="Avance de la operación" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
    {stages.map((name, i) => {
      const n = i + 1, done = n < current, here = n === current, warning = done ? warnings?.[n] : undefined;
      const label = <span className="flex min-w-0 items-baseline gap-1.5"><span className="font-mono text-xs text-muted-foreground">{n}</span><span className={cn(s.stepName, "text-sm leading-snug", here ? "font-bold" : "font-medium text-muted-foreground")}>{name}</span></span>;
      return <li key={name} aria-current={here ? "step" : undefined} className="flex min-w-0 flex-col gap-2">
        <span className={s.stepLine} data-on={done || here} />
        {done && onSelect && selectable?.includes(n) ? <button type="button" className={s.stepButton} onClick={() => onSelect(n)}>{label}<span className="sr-only"> · ver sus documentos</span></button> : label}
        <span className={cn("text-xs", warning ? s.stepWarning : "text-muted-foreground")}>{warning ?? notes?.[n] ?? (done ? "Lista" : here ? "Aquí vas" : "")}{done && <span className="sr-only"> (terminada)</span>}</span>
      </li>;
    })}
  </ol>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return <div className={s.bar} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}><span style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} /></div>;
}

export type TabItem<K extends string> = { id: K; label: string; count?: number; icon?: React.ReactNode };
/** Pestañas en fila (subrayado) o en lista vertical (`orientation="vertical"`, dentro de una operación). */
export function Tabs<K extends string>({ items, value, onChange, label, idPrefix, orientation = "horizontal", className }: { items: TabItem<K>[]; value: K; onChange: (id: K) => void; label: string; idPrefix: string; orientation?: "horizontal" | "vertical"; className?: string }) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const vertical = orientation === "vertical";
  function onKey(event: React.KeyboardEvent, index: number) {
    const [forward, back] = vertical ? ["ArrowDown", "ArrowUp"] : ["ArrowRight", "ArrowLeft"];
    const step = event.key === forward ? 1 : event.key === back ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const target = (index + step + items.length) % items.length;
    refs.current[target]?.focus();
    onChange(items[target].id);
  }
  return <div className={cn(vertical ? s.tabsVertical : s.tabs, className)} role="tablist" aria-label={label} aria-orientation={vertical ? "vertical" : undefined}>
    {items.map((item, i) => <button key={item.id} ref={el => { refs.current[i] = el; }} type="button" role="tab" id={`${idPrefix}-tab-${item.id}`} aria-controls={`${idPrefix}-panel-${item.id}`} aria-selected={item.id === value} tabIndex={item.id === value ? 0 : -1} className={s.tab} onClick={() => onChange(item.id)} onKeyDown={e => onKey(e, i)}>
      {vertical ? <span className="flex min-w-0 items-center gap-2.5">{item.icon}{item.label}</span> : <>{item.icon}{item.label}</>}{item.count !== undefined && <span className={s.tabCount}>{item.count}</span>}
    </button>)}
  </div>;
}

/** Pestañas que llevan a otra página de la misma sección (por ejemplo, Sitio web). */
export function NavTabs({ items, label, current }: { items: Array<{ href: string; label: string }>; label: string; current: string }) {
  return <nav className={s.tabs} aria-label={label}>
    {items.map(item => <Link key={item.href} href={item.href} className={s.tab} aria-current={item.href === current ? "page" : undefined}>{item.label}</Link>)}
  </nav>;
}

export function TabPanel({ idPrefix, id, children, className }: { idPrefix: string; id: string; children: React.ReactNode; className?: string }) {
  return <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} className={className}>{children}</div>;
}

export function Segmented<K extends string>({ options, value, onChange, label, className }: { options: Array<{ id: K; label: string; disabled?: boolean; icon?: React.ReactNode }>; value: K; onChange: (id: K) => void; label: string; className?: string }) {
  return <div className={cn(s.seg, className)} role="radiogroup" aria-label={label}>
    {options.map(o => <button key={o.id} type="button" role="radio" aria-checked={o.id === value} disabled={o.disabled} className={s.segItem} onClick={() => onChange(o.id)}>{o.icon}{o.label}</button>)}
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
