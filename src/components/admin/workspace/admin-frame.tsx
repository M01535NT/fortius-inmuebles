"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { NavTabs, Surface } from "@/components/admin/kit";

/*
  Marco de las páginas de Administración, igual al del resto del panel guiado.
  Sitio web y Reportes reúnen varias páginas en pestañas.
*/
const SECTIONS = {
  sitio: { label: "Sitio web", items: [{ href: "/admin/contenido", label: "Textos del sitio" }, { href: "/admin/blog", label: "Blog" }, { href: "/admin/archivos", label: "Archivos" }] },
  reportes: { label: "Reportes", items: [{ href: "/admin/reportes", label: "Reportes" }, { href: "/admin/control-comercial", label: "Control comercial" }] },
};

export function AdminFrame({ section, children }: { section?: keyof typeof SECTIONS; children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = section ? SECTIONS[section] : null;
  return <Surface className="-mx-4 -mt-5 flex min-w-0 flex-col gap-6 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8">
    {tabs && <NavTabs label={tabs.label} items={tabs.items} current={tabs.items.find(item => pathname.startsWith(item.href))?.href ?? ""} />}
    {children}
  </Surface>;
}
