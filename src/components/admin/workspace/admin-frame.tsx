"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavTabs, Surface } from "@/components/admin/kit";
import { ADMIN_NAV } from "@/components/admin/workspace/guided-nav";
import { PAPELERA } from "@/components/admin/papelera/textos";

/*
  Marco de las páginas de Administración (LV-08, punto 10; C57): una sola sección con índice.
  En escritorio el índice va a la izquierda y fijo al desplazarse; en el celular, en una fila que se desliza.
  Sitio web y Reportes reúnen varias páginas en pestañas.
*/
const ORDER = ["Equipo", "Reportes", "Sitio web", "Historial", PAPELERA.nombre, "Configuración", "Mi perfil"];
const INDEX = [...ADMIN_NAV.map(item => ({ href: item.href, label: item.label, match: item.match })), { href: "/admin/perfil", label: "Mi perfil", match: ["/admin/perfil"] }]
  .sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label));
const SECTIONS = {
  sitio: { label: "Sitio web", items: [{ href: "/admin/contenido", label: "Textos del sitio" }, { href: "/admin/blog", label: "Blog" }, { href: "/admin/archivos", label: "Archivos" }] },
  reportes: { label: "Reportes", items: [{ href: "/admin/reportes", label: "Reportes" }, { href: "/admin/control-comercial", label: "Seguimiento comercial" }] },
};

export function AdminFrame({ section, children }: { section?: keyof typeof SECTIONS; children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = section ? SECTIONS[section] : null;
  return <Surface className="-mx-4 -mt-5 flex min-w-0 flex-col gap-6 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-x-10">
    <nav aria-label="Administración" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:sticky lg:top-24 lg:mx-0 lg:overflow-visible lg:px-0">
      <p className="mb-2 hidden px-3 text-sm font-semibold text-muted-foreground lg:block">Administración</p>
      <ul className="flex gap-2 lg:flex-col lg:gap-0.5">{INDEX.map(item => {
        const on = item.match.some(m => pathname.startsWith(m));
        return <li key={item.href} className="flex-none"><Link href={item.href} aria-current={on ? "page" : undefined} className={cn(
          "flex min-h-11 items-center whitespace-nowrap text-sm transition-colors max-lg:rounded-full max-lg:border max-lg:px-4 max-lg:font-semibold lg:rounded-[var(--radius-control)] lg:px-3",
          on ? "bg-[var(--panel-selected)] font-semibold text-[var(--panel-selected-ink)] max-lg:border-transparent" : "text-foreground hover:bg-secondary max-lg:border-[var(--edge-soft)] max-lg:bg-card lg:font-medium",
        )}>{item.label}</Link></li>;
      })}</ul>
    </nav>
    <div className="flex min-w-0 flex-col gap-6">
      {tabs && <NavTabs label={tabs.label} items={tabs.items} current={tabs.items.find(item => pathname.startsWith(item.href))?.href ?? ""} />}
      {children}
    </div>
  </Surface>;
}
