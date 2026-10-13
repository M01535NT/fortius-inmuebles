"use client";
import * as React from "react";
import Link from "next/link";
import { LayoutGrid, Search, X } from "lucide-react";
import { normalizedText } from "@/lib/admin/workspace";
import { btnGhost, inputClass } from "@/components/admin/ui";
import { ADMIN_MODULES, permittedModules } from "./module-catalog";

export function AppLauncher({ role, pathname, onOpen }: { role: string; pathname: string; onOpen: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  const [opened, setOpened] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const id = React.useId();
  const modules = permittedModules(ADMIN_MODULES, role);
  const results = modules.filter(module => normalizedText(module.label).includes(normalizedText(query)));
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
    <button ref={trigger} type="button" className={btnGhost + " admin-apps-trigger"}
      aria-label="Abrir aplicaciones" aria-haspopup="dialog" aria-expanded={opened} aria-controls={`apps-${id}`}
      title="Aplicaciones del sistema" onClick={() => {
        onOpen();
        setQuery("");
        dialog.current?.showModal();
        setOpened(true);
      }}>
      <LayoutGrid size={20} aria-hidden="true" /><span>Aplicaciones</span>
    </button>
    <dialog id={`apps-${id}`} ref={dialog} className="admin-apps-dialog" aria-labelledby={`apps-title-${id}`}
      aria-describedby={`apps-description-${id}`} onCancel={event => { event.preventDefault(); close(); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, input, a[href]");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClose={() => { setOpened(false); setQuery(""); trigger.current?.focus(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
      }}>
      <div className="admin-apps-heading">
        <div><h2 id={`apps-title-${id}`}>Aplicaciones del sistema</h2><p id={`apps-description-${id}`}>Accesos directos</p></div>
        <button type="button" className={btnGhost} aria-label="Cerrar aplicaciones" onClick={close}><X size={20} aria-hidden="true" /></button>
      </div>
      <label className="admin-apps-search"><Search size={18} aria-hidden="true" />
        <input ref={search} type="search" aria-label="Buscar aplicación" placeholder="Buscar aplicación"
          className={inputClass} value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      <nav className="admin-apps-grid" aria-label="Aplicaciones del sistema">
        {results.map(module => {
          const Icon = module.icon;
          return <Link key={module.href} href={module.href} className="admin-app-link" aria-label={module.label}
            aria-current={(module.href === "/admin" ? pathname === module.href : pathname.startsWith(module.href)) ? "page" : undefined}
            onClick={close}>
            <span className="admin-app-icon" data-tone={module.tone ?? "navy"} aria-hidden="true"><Icon className="size-7" strokeWidth={1.7} /></span>
            <span>{module.label}</span>
          </Link>;
        })}
      </nav>
      {!results.length && <p role="status" className="admin-apps-empty">No hay aplicaciones con ese nombre.</p>}
    </dialog>
  </>;
}
