"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function AboutDropdown({ className, current }: { className: string; current: boolean }) {
  const [open, setOpen] = React.useState(false);
  const button = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  return <div className="about-dropdown" onPointerEnter={event => { if (event.pointerType === "mouse") setOpen(true); }} onPointerLeave={event => { if (event.pointerType === "mouse") setOpen(false); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
    onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus(); } }}>
    <div className="about-dropdown-trigger">
      <Link href="/nosotros" className={className} aria-current={current ? "page" : undefined} onFocus={() => setOpen(true)} onClick={() => setOpen(false)}>Nosotros</Link>
      <button ref={button} type="button" className={className} aria-label="Secciones de Nosotros" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}><ChevronDown size={14} aria-hidden="true" /></button>
    </div>
    <div id={id} className="about-dropdown-panel" hidden={!open}>
      <ul>{[["mision", "Misión"], ["vision", "Visión"], ["valores", "Valores"]].map(([anchor, label]) => <li key={anchor}><Link href={`/nosotros#${anchor}`} onClick={() => setOpen(false)}>{label}</Link></li>)}</ul>
    </div>
  </div>;
}
