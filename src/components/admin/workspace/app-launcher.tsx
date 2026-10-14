"use client";
import * as React from "react";
import Link from "next/link";
import { LayoutGrid, Search, X, ArrowRight } from "lucide-react";
import { normalizedText } from "@/lib/admin/workspace";
import { APPS } from "@/lib/apps/catalog";
import { AppIcon } from "@/components/admin/apps/app-icon";
import { btnGhost, inputClass } from "@/components/admin/ui";

export function AppLauncher({ pathname, onOpen }: { role: string; pathname: string; onOpen: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  const [opened, setOpened] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("Todas");
  const id = React.useId();
  const categories = ["Todas", ...new Set(APPS.map(app => app.category))];
  const results = APPS.filter(app => (category === "Todas" || app.category === category) && normalizedText(`${app.title} ${app.description}`).includes(normalizedText(query)));
  const close = () => dialog.current?.close();
  React.useEffect(() => { if (dialog.current?.open) dialog.current.close(); }, [pathname]);
  React.useEffect(() => {
    if (!opened) return;
    search.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [opened]);
  return <>
    <button ref={trigger} type="button" className={btnGhost + " admin-apps-trigger"} aria-label="Abrir aplicaciones" aria-haspopup="dialog" aria-expanded={opened} aria-controls={`apps-${id}`} title="Aplicaciones del sistema" onClick={() => { onOpen(); setQuery(""); setCategory("Todas"); dialog.current?.showModal(); setOpened(true); }}><LayoutGrid size={20} aria-hidden="true" /><span>Aplicaciones</span></button>
    <dialog id={`apps-${id}`} ref={dialog} className="admin-apps-dialog" aria-labelledby={`apps-title-${id}`} aria-describedby={`apps-description-${id}`} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), a[href]"); const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClose={() => { setOpened(false); setQuery(""); setCategory("Todas"); trigger.current?.focus(); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    }}>
      <div className="admin-apps-heading"><div><h2 id={`apps-title-${id}`}>Aplicaciones del sistema</h2><p id={`apps-description-${id}`}>20 herramientas para preparar y acompañar tus operaciones</p></div><button type="button" className={btnGhost} aria-label="Cerrar aplicaciones" onClick={close}><X size={20} aria-hidden="true" /></button></div>
      <label className="admin-apps-search"><Search size={18} aria-hidden="true" /><input ref={search} type="search" aria-label="Buscar aplicación" placeholder="Buscar una herramienta" className={inputClass} value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Categorías de aplicaciones">{categories.map(name => <button key={name} type="button" className={btnGhost + " aria-pressed:border-primary aria-pressed:bg-secondary"} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
      <nav className="admin-apps-grid" aria-label="Aplicaciones del sistema">{results.map(app => { const href = `/admin/apps/${app.slug}`; return <Link key={app.slug} href={href} className="admin-app-link" aria-label={app.title} title={app.description} aria-current={pathname === href || pathname.startsWith(href + "/") ? "page" : undefined} onClick={close}><span className="admin-app-icon" data-tone={app.category === "Comercial" ? "rose" : "navy"} aria-hidden="true"><AppIcon name={app.icon} className="size-7" /></span><span>{app.title}</span></Link>; })}</nav>
      {!results.length && <p role="status" className="admin-apps-empty">No hay aplicaciones con ese nombre y categoría.</p>}
      <div className="mt-4 border-t border-border pt-3"><Link href="/admin/apps" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-ink" onClick={close}>Abrir catálogo completo <ArrowRight size={16} aria-hidden="true" /></Link></div>
    </dialog>
  </>;
}
