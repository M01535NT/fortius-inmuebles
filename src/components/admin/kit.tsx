"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Building2, Check, CircleHelp, Info, MoreHorizontal, Plus, Search, StateDone, StateHalf, StateNotApplicable, StatePending, StateProblem, Upload, X } from "@/components/admin/icons";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TabsList, TabsRoot, TabsTrigger } from "@/components/ui/tabs";
import { SheetClose, SheetDescription, SheetOverlay, SheetPanel, SheetPortal, SheetRoot, SheetTitle } from "@/components/ui/sheet";
import s from "./kit.module.css";

/*
  Componentes del panel. Referencia visual vigente: el «panel desde cero» (LV-09, 14/11/2026,
  en PLAN.md). Los bocetos anteriores están archivados en docs/archivo/2026-11-14-panel-anterior/
  y son solo historia. Escala admin-*: 10 px controles,
  12 px tarjetas, 14 px paneles y pastilla en estados; sombras casi nulas (tokens de panel-base.css).
  Sus estilos (kit.module.css) están fuera de las capas de Tailwind: una clase de
  Tailwind sirve para acomodar (márgenes, alineación, flex) pero no reemplaza el
  relleno, el tamaño ni los colores del componente. Para eso, agrega una variante.
*/

type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger" | "dangerSolid";
type ButtonProps = { variant?: ButtonVariant; size?: "md" | "lg"; iconOnly?: boolean; className?: string };

export function buttonClass({ variant = "secondary", size = "md", iconOnly = false, className }: ButtonProps) {
  return cn(s.btn, s[variant], size === "lg" && s.lg, iconOnly && s.iconOnly, className);
}

export function Button({ variant, size, iconOnly, className, type = "button", ...props }: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={buttonClass({ variant, size, iconOnly, className })} {...props} />;
}

export type MenuAction = { label: string; onSelect: () => void; icon?: React.ReactNode; danger?: boolean; separated?: boolean; disabled?: boolean };

/**
  Menú de tres puntos del panel, sobre Radix (DEC-52): flechas, Enter, Escape y el foco de vuelta al
  botón. Es el único: Bandeja, Personas, fichas y el encabezado de la operación lo usan.
*/
export function ActionsMenu({ label, actions, triggerClassName, iconSize = 18, disabled }: { label: string; actions: MenuAction[]; triggerClassName?: string; iconSize?: number; disabled?: boolean }) {
  if (!actions.length) return null;
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <button type="button" className={triggerClassName ?? buttonClass({ variant: "ghost", iconOnly: true })} aria-label={label} disabled={disabled}><MoreHorizontal size={iconSize} aria-hidden="true" /></button>
    </DropdownMenuTrigger>
    {/* Si la acción abrió una ventana que ya tomó el foco, no se lo regresa al botón. */}
    <DropdownMenuContent aria-label={label} onCloseAutoFocus={event => { const at = document.activeElement; if (at && at !== document.body && !at.closest("[role=menu]")) event.preventDefault(); }}>
      {actions.map(action => <React.Fragment key={action.label}>
        {action.separated && <DropdownMenuSeparator />}
        <DropdownMenuItem danger={action.danger} disabled={action.disabled} onSelect={action.onSelect}>{action.icon}{action.label}</DropdownMenuItem>
      </React.Fragment>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function ButtonLink({ variant, size, iconOnly, className, ...props }: ButtonProps & React.ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, iconOnly, className })} {...props} />;
}

/** Estados de un requisito con sus nombres sencillos (encargo, sección 4) y su forma (LV-02, V03). */
export const REVIEW_STATE_UI = {
  pendiente: { label: "Pendiente", icon: StatePending },
  recibido: { label: "Lo tengo", icon: StateHalf },
  revisado: { label: "Revisado ✓", icon: StateDone },
  observado: { label: "Hay un problema", icon: StateProblem },
  no_aplica: { label: "No aplica", icon: StateNotApplicable },
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
export function Card({ as: Tag = "section", tone, lift, panel, className, ...props }: { as?: "section" | "div" | "article" | "aside" | "li" | "ul"; tone?: CardTone; lift?: boolean; panel?: boolean } & React.HTMLAttributes<HTMLElement>) {
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

/** Foto de un inmueble con esquinas de 12 px; sin foto muestra el ícono. `ratio` la hace fluida («4 / 3»). */
export function Thumb({ src, alt = "", size = 52, ratio, icon, className, children }: { src?: string | null; alt?: string; size?: number; ratio?: string; icon?: React.ReactNode; className?: string; children?: React.ReactNode }) {
  const style = ratio ? { width: "100%", aspectRatio: ratio } : { width: size, height: size };
  return <span className={cn(s.thumb, className)} style={style} aria-hidden={alt ? undefined : true}>
    {src ? <Image unoptimized fill sizes="(max-width: 767px) 50vw, 320px" src={src} alt={alt} /> : icon ?? <Building2 size={Math.max(18, Math.round(size * 0.4))} aria-hidden="true" />}
    {children}
  </span>;
}

/** Iniciales de una persona («Iliana Tonalá» → «IT»). */
export function initialsOf(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "·";
}
/*
  Tonos de las caras (DEC-51): azules, verdes, ocres y cian; sin rojos ni rosas para no confundirse
  con una alerta ni con la marca. El mismo nombre da siempre el mismo tono en todas las pantallas.
*/
const FACE_HUES = [212, 158, 32, 96, 188, 54, 128, 232, 74, 142, 200, 40] as const;
export function faceHue(name: string) {
  let h = 0;
  for (const ch of name.trim().toLocaleLowerCase("es-MX")) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return FACE_HUES[h % FACE_HUES.length];
}
/** La cara de una persona (DEC-51): su foto o sus iniciales sobre su color propio; `onDark` sobre el azul. */
export function Avatar({ name, src, size = 36, onDark, className }: { name: string; src?: string | null; size?: number; onDark?: boolean; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size / 2.7)), "--face-h": faceHue(name) } as React.CSSProperties;
  return <span className={cn(s.avatar, className)} data-tone={onDark ? "onDark" : undefined} style={style} aria-hidden="true">{src ? <Image unoptimized fill sizes="64px" src={src} alt="" /> : initialsOf(name)}</span>;
}
/** Varias caras encimadas (propietario y asesor, por ejemplo). */
export function Faces({ people, size = 28, className }: { people: Array<{ name: string; src?: string | null }>; size?: number; className?: string }) {
  return <span className={cn(s.faces, className)}>{people.map(p => <Avatar key={p.name} name={p.name} src={p.src} size={size} />)}</span>;
}
/**
  Riel compacto de etapas para filas y tarjetas (DEC-51): un segmento por etapa, las hechas en azul,
  la actual en borgoña y en ámbar las anteriores que dejaron algo pendiente (`warn`, número de etapa
  desde 1). El texto va aparte; el riel es decorativo para el lector de pantalla.
*/
export function StageRail({ total = 10, current, warn, className }: { total?: number; current: number; warn?: ReadonlySet<number>; className?: string }) {
  return <span className={cn(s.rail, className)} style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden="true">
    {Array.from({ length: total }, (_, i) => <i key={i} data-state={warn?.has(i + 1) ? "warn" : i < current ? "done" : i === current ? "now" : undefined} />)}
  </span>;
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

/**
  Avance con anillo y texto (LV-02, V04): «6 de 10» junto al anillo, que se llena en azul marino y
  se vuelve verde con palomita al completarse. Nunca usa el rojo de alerta. El texto ya lo dice,
  así que el anillo es decorativo.
*/
export function ProgressRing({ value, max, size = 36, showText = true, className }: { value: number; max: number; size?: number; showText?: boolean; className?: string }) {
  const stroke = size >= 40 ? 4 : 3, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0, done = max > 0 && value >= max;
  return <span className={cn(s.progressRing, className)} data-done={done || undefined}>
    <span className={s.progressRingDial} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={s.ringTrack} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * share} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} className={s.progressRingValue} />
      </svg>
      <span className={s.progressRingNum}>{done ? <Check size={Math.round(size * 0.42)} strokeWidth={2} /> : value}</span>
    </span>
    {showText && <span className={s.progressRingText}>{value} de {max}</span>}
  </span>;
}

export type DocStatus = "borrador" | "revisado" | "aprobado" | "firmado";
const DOC_STATUS_LABEL: Record<DocStatus, string> = { borrador: "Borrador", revisado: "Revisado", aprobado: "Aprobado", firmado: "Firmado" };
/** Distintivo del estado de un documento (LV-02, V05): Borrador neutro, Revisado azul, Aprobado y Firmado verdes. */
export function DocBadge({ status, className }: { status: DocStatus; className?: string }) {
  return <span className={cn(s.docBadge, className)} data-status={status}>{DOC_STATUS_LABEL[status]}</span>;
}

/** Cuadro del ícono de una etapa o un documento (LV-02, V01). */
export function IconTile({ icon: Icon, size = 40, className }: { icon: React.ComponentType<{ size?: number | string; "aria-hidden"?: boolean }>; size?: number; className?: string }) {
  return <span className={cn(s.iconTile, className)} style={{ width: size, height: size }} aria-hidden="true"><Icon size={Math.round(size * 0.52)} aria-hidden /></span>;
}

/**
  «?» de una línea donde hay dudas (LV-04, V07): al pulsarlo se abre una sola línea debajo; se cierra
  al pulsar otra vez o con Escape. Va junto a un título o un botón; `term` nombra lo que explica.
*/
export function Hint({ term, children, className }: { term: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return <>
    <button type="button" className={cn(s.hint, className)} aria-expanded={open} aria-controls={id} aria-label={`Qué es ${term}`} onClick={() => setOpen(v => !v)} onKeyDown={e => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}><CircleHelp size={18} aria-hidden="true" /></button>
    <span id={id} role="note" className={s.hintText} hidden={!open}>{children}</span>
  </>;
}

/**
  Cambio de contenido con Motion (DEC-52): cuando `id` cambia (otro «Lo siguiente», por ejemplo), lo
  nuevo entra en 180 ms subiendo 6 px. Con «reducir movimiento» aparece sin animación. Lo viejo se va
  al instante: la salida no se anima para que la pantalla responda enseguida.
*/
export function Swap({ id, as = "div", className, children, ...rest }: { id: string; as?: "div" | "article"; className?: string; children: React.ReactNode } & React.AriaAttributes) {
  const reduce = useReducedMotionSafe();
  const Tag = as === "article" ? motion.article : motion.div;
  return <Tag key={id} className={className} {...rest} initial={reduce ? false : { opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>{children}</Tag>;
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
    <p className="flex justify-between gap-3 text-[0.9375rem]"><span className="font-semibold">{stages[current - 1]}</span><span className="tabular-nums text-sm text-muted-foreground">Etapa {current} de {total}</span></p>
    <ProgressBar value={current} max={total} label={`Etapa ${current} de ${total}`} />
  </div>;
  return <ol aria-label="Avance del asunto" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
    {stages.map((name, i) => {
      const n = i + 1, done = n < current, here = n === current, warning = done ? warnings?.[n] : undefined;
      const label = <span className="flex min-w-0 items-baseline gap-1.5"><span className="tabular-nums text-xs text-muted-foreground">{n}</span><span className={cn(s.stepName, "text-sm leading-snug", here ? "font-bold" : "font-medium text-muted-foreground")}>{name}</span></span>;
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
  // Sobre Radix Tabs (DEC-52): flechas, Inicio y Fin, y solo la pestaña elegida entra con Tab. Los ids
  // siguen siendo los del kit para que `TabPanel` (fuera de la raíz de Radix) quede ligado a su pestaña.
  const vertical = orientation === "vertical";
  return <TabsRoot value={value} onValueChange={next => onChange(next as K)} orientation={orientation} activationMode="automatic" className="contents">
    <TabsList className={cn(vertical ? s.tabsVertical : s.tabs, className)} aria-label={label} loop>
      {items.map(item => <TabsTrigger key={item.id} value={item.id} id={`${idPrefix}-tab-${item.id}`} aria-controls={`${idPrefix}-panel-${item.id}`} className={s.tab} onClick={() => { if (item.id !== value) onChange(item.id); }}>
        {vertical ? <span className="flex min-w-0 items-center gap-2.5">{item.icon}{item.label}</span> : <>{item.icon}{item.label}</>}{item.count !== undefined && <span className={s.tabCount}>{item.count}</span>}
      </TabsTrigger>)}
    </TabsList>
  </TabsRoot>;
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

/** Lista vacía que enseña (C31): qué es la sección, sus primeros pasos y el botón para empezar. */
type ArtIcon = React.ComponentType<{ size?: number | string; strokeWidth?: number | string; "aria-hidden"?: boolean }>;
const ART_BADGE = { empezar: Plus, listo: Check, buscar: Search, subir: Upload } as const;
/**
  Ilustración de un estado vacío (LV-04, V08, aprobada el 13/11/2026): el objeto de la pantalla en
  grande sobre una placa, con una insignia que dice el caso: «empezar» (+, aún no hay nada),
  «listo» (palomita verde, todo hecho), «buscar» (lupa, sin resultados) y «subir».
*/
export function EmptyArt({ icon: Icon, kind }: { icon: ArtIcon; kind?: keyof typeof ART_BADGE }) {
  const Badge = kind ? ART_BADGE[kind] : null;
  return <span className={s.emptyArt} aria-hidden="true"><span className={s.emptyPlate}><Icon size={44} strokeWidth={1.25} aria-hidden /></span>{Badge && <span className={s.emptyBadge} data-kind={kind}><Badge size={18} strokeWidth={2} aria-hidden="true" /></span>}</span>;
}

export function EmptyBox({ icon, art, title, children, steps, action }: { icon?: React.ReactNode; art?: { icon: ArtIcon; kind?: keyof typeof ART_BADGE }; title: string; children?: React.ReactNode; steps?: React.ReactNode[]; action?: React.ReactNode }) {
  return <div className={s.empty}>{art ? <EmptyArt icon={art.icon} kind={art.kind} /> : icon}<p className="font-semibold text-foreground">{title}</p>{children && <div className="max-w-[52ch] text-sm">{children}</div>}
    {steps?.length ? <ol className={s.emptySteps} aria-label="Primeros pasos">{steps.map((step, i) => <li key={i}><span aria-hidden="true">{i + 1}</span><span>{step}</span></li>)}</ol> : null}
    {action}</div>;
}

/**
  Panel que se abre a la derecha en computadora y desde abajo en celular. Escape y el velo lo cierran.
  Con `keepMounted`, lo escrito sigue ahí al volver a abrirlo (el panel lo recuerda hasta guardar).
*/
export function Sheet({ open, onClose, eyebrow, title, description, children, footer, keepMounted }: { open: boolean; onClose: () => void; eyebrow?: string; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; keepMounted?: boolean }) {
  // Sobre Radix (DEC-52): Radix encierra el foco, cierra con Escape y con el velo, y bloquea el fondo.
  // El foco vuelve a donde estaba antes de abrir (las pantallas abren el panel sin un «Trigger» de Radix).
  const previous = React.useRef<HTMLElement | null>(null);
  // `keepMounted`: lo escrito se guarda mientras se llena y vuelve al reabrir; un `reset` del formulario
  // (por ejemplo, tras guardar) lo olvida. Solo campos sin estado propio en React; los controlados ya
  // los conserva la pantalla.
  const draft = React.useRef(new Map<string, string | boolean>());
  const fieldKey = (el: Element) => el.id || el.getAttribute("name") || "";
  const remember = (event: React.FormEvent) => {
    const el = event.target;
    if (!keepMounted || !(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) || !fieldKey(el)) return;
    draft.current.set(fieldKey(el), el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value);
  };
  const restore = (panel: HTMLElement) => {
    for (const el of panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
      const value = draft.current.get(fieldKey(el));
      if (value === undefined) continue;
      if (typeof value === "boolean" && el instanceof HTMLInputElement) el.checked = value; else if (typeof value === "string") el.value = value;
    }
  };
  const content = <>
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-5 sm:px-7 sm:pt-7">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <SheetTitle className="text-xl font-bold leading-tight">{title}</SheetTitle>
        {description ? <SheetDescription className="text-sm text-muted-foreground">{description}</SheetDescription> : null}
      </div>
      <SheetClose data-sheet-close className={buttonClass({ variant: "ghost", iconOnly: true })} aria-label="Cerrar"><X size={20} aria-hidden="true" /></SheetClose>
    </div>
    <div className="flex flex-1 flex-col gap-5 overflow-auto px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    {footer && <div className="flex flex-col-reverse gap-2.5 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-7">{footer}</div>}
  </>;
  const panelProps = {
    className: s.sheet,
    // Sin descripción, Radix no debe buscar una (evita el aviso y un aria-describedby vacío).
    ...(description ? {} : { "aria-describedby": undefined }),
    // El primer campo recibe el foco al abrir; si no hay, el primer botón que no sea «Cerrar».
    onOpenAutoFocus: (event: Event) => {
      previous.current = document.activeElement as HTMLElement | null;
      const panel = event.currentTarget as HTMLElement | null;
      if (keepMounted && panel) restore(panel);
      const first = panel?.querySelector<HTMLElement>("input, select, textarea, button:not([data-sheet-close])");
      if (first) { event.preventDefault(); first.focus(); }
    },
    onCloseAutoFocus: (event: Event) => { event.preventDefault(); previous.current?.focus?.(); previous.current = null; },
    // Escape dentro de una confirmación nativa (<dialog>) la cancela a ella, no al panel de abajo.
    onEscapeKeyDown: (event: KeyboardEvent) => { if (event.target instanceof Element && event.target.closest("dialog[open]")) event.preventDefault(); },
    onInput: remember, onChange: remember, onReset: () => draft.current.clear(),
  };
  return <SheetRoot open={open} onOpenChange={next => { if (!next) onClose(); }}>
    <SheetPortal><SheetOverlay className={s.scrim} /><SheetPanel {...panelProps}>{content}</SheetPanel></SheetPortal>
  </SheetRoot>;
}
