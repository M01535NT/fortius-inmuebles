"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavTabs, Surface } from "@/components/admin/kit";
import { ADMIN_NAV } from "@/components/admin/workspace/guided-nav";

/*
  Marco de las páginas de Administración, igual al del resto del panel guiado.
  Sitio web y Reportes reúnen varias páginas en pestañas.
  LV-08 (31/10/2026): Administración es una sola sección con un índice arriba (Equipo, Reportes,
  Sitio web, Historial, Configuración y Mi cuenta).
*/
const INDEX = [...ADMIN_NAV.map(item => ({ href: item.href, label: item.label, match: item.match })), { href: "/admin/perfil", label: "Mi cuenta", match: ["/admin/perfil"] }].sort((a, b) => ["Equipo", "Reportes", "Sitio web", "Historial", "Configuración", "Mi cuenta"].indexOf(a.label) - ["Equipo", "Reportes", "Sitio web", "Historial", "Configuración", "Mi cuenta"].indexOf(b.label));
const SECTIONS = {
  sitio: { label: "Sitio web", items: [{ href: "/admin/contenido", label: "Textos del sitio" }, { href: "/admin/blog", label: "Blog" }, { href: "/admin/archivos", label: "Archivos" }] },
  reportes: { label: "Reportes", items: [{ href: "/admin/reportes", label: "Reportes" }, { href: "/admin/control-comercial", label: "Control comercial" }] },
};

export function AdminFrame({ section, children }: { section?: keyof typeof SECTIONS; children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = section ? SECTIONS[section] : null;
  return <Surface className="-mx-4 -mt-5 flex min-w-0 flex-col gap-6 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8">
    <nav aria-label="Administración" className="flex flex-wrap gap-2">{INDEX.map(item => { const on = item.match.some(m => pathname.startsWith(m)); return <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold", on ? "bg-[#061f3f] text-white dark:bg-[var(--panel-selected)] dark:text-[var(--panel-selected-ink)]" : "bg-card text-foreground hover:bg-secondary")}>{item.label}</Link>; })}</nav>
    {tabs && <NavTabs label={tabs.label} items={tabs.items} current={tabs.items.find(item => pathname.startsWith(item.href))?.href ?? ""} />}
    {children}
  </Surface>;
}
