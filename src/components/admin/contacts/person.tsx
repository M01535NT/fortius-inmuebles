"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Mail, MessageCircle, MoreHorizontal, Phone } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Card, Pill } from "@/components/admin/kit";
import { apiRequest } from "@/lib/admin/store";
import { stepDate, type NextStep } from "@/lib/admin/contacts-view";
import type { TimelineItem } from "@/lib/admin/person-view";
import type { OperationalInterview } from "@/lib/intake/interview";
import { cn } from "@/lib/utils";
import s from "./person.module.css";

/*
  Piezas comunes de la ficha de persona (SIM-07, 11/11/2026): prospecto y cliente comparten el
  encabezado (quién es y cómo contactarla), la tarjeta «Siguiente paso» con una sola acción
  principal, la línea de tiempo y las tarjetas de datos. Lo que no es de todos los días
  (convertir, eliminar) va en «Más opciones».
*/

export { s as personStyles };

export type MenuItem = { label: string; icon?: React.ReactNode; onSelect: () => void | Promise<unknown>; danger?: boolean; disabled?: boolean };

/** «Más opciones»: se cierra con Escape, al tocar fuera o al elegir. */
export function MoreMenu({ items, label = "Más opciones" }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const wrap = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => { if (event.target instanceof Node && !wrap.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); wrap.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  if (!items.length) return null;
  async function run(item: MenuItem) {
    setOpen(false); setError(""); setBusy(true);
    try { await item.onSelect(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se guardó. Lo que escribiste sigue en pantalla; vuelve a intentarlo."); }
    finally { setBusy(false); }
  }
  return <div ref={wrap} className={s.menuWrap}>
    <Button iconOnly aria-label={label} aria-haspopup="menu" aria-expanded={open} disabled={busy} onClick={() => setOpen(value => !value)}><MoreHorizontal size={20} aria-hidden="true" /></Button>
    {open && <div role="menu" className={s.menu}>{items.map(item =>
      <button key={item.label} type="button" role="menuitem" disabled={item.disabled} className={cn(s.menuItem, item.danger && s.menuDanger)} onClick={() => void run(item)}>{item.icon}{item.label}</button>)}</div>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </div>;
}

/** Encabezado: regreso, nombre, etapa, Llamar y WhatsApp, y el menú. */
export function PersonHeader({ back, name, stage, sub, phone, email, actions, menu = [] }: {
  back: { href: string; label: string }; name: string; stage?: React.ReactNode; sub?: React.ReactNode; phone?: string; email?: string; actions?: React.ReactNode; menu?: MenuItem[];
}) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `52${digits}` : digits;
  return <header className={s.head}>
    <Link href={back.href} className={s.back} aria-label={back.label}><ChevronLeft size={20} aria-hidden="true" /></Link>
    <div className={s.who}>
      <Avatar name={name} size={52} />
      <div className="min-w-0">
        <h1 className={s.name}>{name}</h1>
        <p className={s.sub}>{stage}{sub}</p>
      </div>
    </div>
    <div className={s.actions}>
      {digits && <ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden="true" />Llamar</ButtonLink>}
      {digits && <ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</ButtonLink>}
      {email && <ButtonLink href={`mailto:${email}`} iconOnly aria-label={`Escribir a ${email}`}><Mail size={18} aria-hidden="true" /></ButtonLink>}
      {actions}
      <MoreMenu items={menu} />
    </div>
  </header>;
}

/** «Siguiente paso»: lo que toca con su fecha y, a la derecha, la acción principal de la pantalla. */
export function NextStepCard({ step, today, fallback, children }: { step: NextStep | null; today: string; fallback: string; children?: React.ReactNode }) {
  const date = step?.date ? stepDate(step.date, today, step.time) : null;
  return <section aria-label="Siguiente paso" className={s.next}>
    <div className={s.nextBody}>
      <span className={s.nextLabel}>Siguiente paso</span>
      <strong className={s.nextText}>{step?.text ?? fallback}</strong>
      {date && <span className={s.nextMeta}><Pill tone={date.late ? "alert" : "onDark"} size="sm">{date.label}</Pill></span>}
    </div>
    {children && <div className={s.nextActions}>{children}</div>}
  </section>;
}

/** Una tarjeta de la ficha con su título y, a la derecha, su acción. */
export function PersonCard({ title, action, children, id }: { title: string; action?: React.ReactNode; children: React.ReactNode; id: string }) {
  return <Card as="section" aria-labelledby={id} className={s.card}>
    <div className={s.cardHead}><h2 id={id} className={s.cardTitle}>{title}</h2>{action}</div>
    {children}
  </Card>;
}

function TimelineList({ items, label }: { items: TimelineItem[]; label: string }) {
  return <ul className={s.timeline} aria-label={label}>{items.map(item => {
    const body = <>
      <span className={cn(s.when, item.late && s.late)}>{item.when}</span>
      <span className="flex min-w-0 flex-col gap-0.5"><span className={cn(s.itemText, item.done && s.done)}>{item.text}</span><span className={s.kind}>{item.kind}{item.done ? " · hecha" : ""}</span></span>
    </>;
    return <li key={item.id}>{item.href ? <Link href={item.href} className={s.item}>{body}</Link> : <div className={s.item}>{body}</div>}</li>;
  })}</ul>;
}

/** Línea de tiempo: «Lo que viene» y «Lo que ya pasó»; arriba, lo que se pueda capturar aquí. */
export function Timeline({ upcoming, past, empty, children }: { upcoming: TimelineItem[]; past: TimelineItem[]; empty: string; children?: React.ReactNode }) {
  return <>
    {children}
    {upcoming.length > 0 && <><h3 className={s.group}>Lo que viene</h3><TimelineList items={upcoming} label="Lo que viene" /></>}
    {past.length > 0 && <><h3 className={s.group}>Lo que ya pasó</h3><TimelineList items={past} label="Lo que ya pasó" /></>}
    {!upcoming.length && !past.length && <p className={s.muted}>{empty}</p>}
  </>;
}

/** La entrevista inicial de la persona: la que está a medias o, si no, la más reciente. */
export function useInterview({ leadId, clienteId }: { leadId?: string; clienteId?: string }) {
  const [state, setState] = React.useState<{ current: OperationalInterview | null; loading: boolean; error: boolean }>({ current: null, loading: true, error: false });
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    const query = new URLSearchParams(leadId ? { leadId } : { clienteId: clienteId ?? "" });
    apiRequest<{ entrevistas: OperationalInterview[] }>(`/api/admin/entrevistas?${query}`)
      .then(result => {
        if (!Array.isArray(result.entrevistas)) throw new Error("Respuesta inválida");
        if (alive) setState({ current: result.entrevistas.find(item => item.estado === "borrador") ?? result.entrevistas[0] ?? null, loading: false, error: false });
      })
      .catch(() => { if (alive) setState({ current: null, loading: false, error: true }); });
    return () => { alive = false; };
  }, [leadId, clienteId, retry]);
  return { ...state, reload: () => { setState(old => ({ ...old, loading: true, error: false })); setRetry(n => n + 1); } };
}
