"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { NavigationGroup } from "@/data/navigation";

export function NavDropdown({ group, className, open, onOpen, onClose, current }: {
  group: NavigationGroup; className: string; open: boolean; onOpen: () => void; onClose: () => void; current: boolean;
}) {
  const button = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  return <div className="nav-disclosure" onPointerEnter={event => { if (event.pointerType === "mouse") onOpen(); }} onPointerLeave={event => { if (event.pointerType === "mouse") onClose(); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onClose(); }}
    onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); onClose(); button.current?.focus(); } }}>
    <div className="nav-disclosure-trigger" data-active={current || open}>
      <Link href={group.href} className={className} aria-current={current ? "page" : undefined} onFocus={onOpen} onClick={onClose}>{group.label}</Link>
      <button ref={button} type="button" className={className} aria-label={`Secciones de ${group.label}`} aria-expanded={open} aria-controls={id} onClick={() => open ? onClose() : onOpen()}><ChevronDown size={13} aria-hidden="true" /></button>
    </div>
    <div id={id} className="nav-disclosure-panel" hidden={!open}>
      <div className="nav-disclosure-content">
        <div className="nav-disclosure-feature"><p>{group.heading}</p><Link href={group.href} onClick={onClose}>{group.featured}<ArrowUpRight size={18} aria-hidden="true" /></Link></div>
        <ul>{group.links.map(link => <li key={link.href}><Link href={link.href} onClick={onClose}><span>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></span><small>{link.detail}</small></Link></li>)}</ul>
      </div>
    </div>
  </div>;
}
