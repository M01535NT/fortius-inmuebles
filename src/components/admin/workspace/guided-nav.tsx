"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, Columns3, Contact, ExternalLink, House, LayoutGrid, LogOut, Menu, Plus, ShieldCheck, UserRound, Building2 } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AsyncButton } from "@/components/admin/ui";
import { ButtonLink } from "@/components/admin/kit";
import { db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import s from "./guided-nav.module.css";

/*
  Navegación del panel guiado (docs/diseno/lienzo-panel: Sidebar, SidebarAdmin,
  BarraInferior y MenuMovil). Cinco secciones, Herramientas y Administración (solo admin).
*/

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>; match: string[] };
export const MAIN_NAV: NavItem[] = [
  { href: "/admin", label: "Hoy", icon: House, match: [] },
  { href: "/admin/operaciones", label: "Operaciones", icon: Columns3, match: ["/admin/operaciones", "/admin/proceso", "/admin/entrevistas"] },
  { href: "/admin/contactos", label: "Contactos", icon: Contact, match: ["/admin/contactos", "/admin/leads", "/admin/clientes"] },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2, match: ["/admin/propiedades"] },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays, match: ["/admin/agenda", "/admin/tareas"] },
];
export const TOOLS_NAV: NavItem = { href: "/admin/herramientas", label: "Herramientas", icon: LayoutGrid, match: ["/admin/herramientas", "/admin/apps", "/admin/notas", "/admin/documentos"] };
/** Administración. Las páginas con más de un módulo (Sitio web, Reportes) se agrupan en pestañas en la Fase 6. */
export const ADMIN_NAV: Array<{ href: string; label: string; match: string[] }> = [
  { href: "/admin/asesores", label: "Equipo", match: ["/admin/asesores"] },
  { href: "/admin/contenido", label: "Sitio web", match: ["/admin/contenido", "/admin/blog", "/admin/archivos"] },
  { href: "/admin/reportes", label: "Reportes", match: ["/admin/reportes", "/admin/control-comercial"] },
  { href: "/admin/historial", label: "Historial", match: ["/admin/historial"] },
  { href: "/admin/configuracion", label: "Configuración", match: ["/admin/configuracion"] },
];

export function isNavActive(pathname: string, item: { href: string; match: string[] }) {
  if (item.href === "/admin") return pathname === "/admin";
  return item.match.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));
}

/** Pendientes de hoy: tareas abiertas que vencen hoy o antes y contactos por atender. */
export function usePendingCount() {
  const tasks = useCollection(db.tareas), leads = useCollection(db.leads), clients = useCollection(db.clientes);
  const today = operationalDate();
  return tasks.filter(task => isTaskOpen(task) && !!task.vence && task.vence <= today).length
    + projectFollowups(leads, clients).filter(contact => contact.fecha <= today).length;
}

function Count({ value }: { value: number }) {
  return value > 0 ? <span className={s.count}>{value > 99 ? "99+" : value}<span className="sr-only"> {value === 1 ? "pendiente" : "pendientes"}</span></span> : null;
}

export function GuidedSidebar({ pathname, role, user, search, onLogout }: { pathname: string; role: string; user: { name: string; email: string; initials: string }; search: React.ReactNode; onLogout: () => Promise<void> }) {
  const pending = usePendingCount();
  const adminActive = ADMIN_NAV.some(item => isNavActive(pathname, item));
  const [adminOpen, setAdminOpen] = React.useState(adminActive);
  return <aside className={s.sidebar} aria-label="Panel">
    <Link href="/admin" className="flex items-center px-2 py-1" aria-label="Fortius Inmuebles, ir a Hoy"><BrandMark className="h-9 w-36" /></Link>
    <ButtonLink href="/admin/operaciones/nueva" variant="primary" size="lg" className="w-full"><Plus size={20} aria-hidden="true" />Nueva operación</ButtonLink>
    <div className={s.search}>{search}</div>
    <nav aria-label="Módulos del panel" className="flex flex-col gap-0.5">
      {MAIN_NAV.map(item => <Link key={item.href} href={item.href} className={s.link} aria-current={isNavActive(pathname, item) ? "page" : undefined}>
        <item.icon size={20} aria-hidden={true} />{item.label}{item.href === "/admin" && <Count value={pending} />}
      </Link>)}
      <span className={s.rule} aria-hidden="true" />
      <Link href={TOOLS_NAV.href} className={s.link} aria-current={isNavActive(pathname, TOOLS_NAV) ? "page" : undefined}><TOOLS_NAV.icon size={20} aria-hidden={true} />{TOOLS_NAV.label}<span className={s.meta}>16</span></Link>
      {role === "admin" && <>
        <button type="button" className={s.link} aria-expanded={adminOpen} aria-controls="admin-nav-administracion" onClick={() => setAdminOpen(open => !open)}>
          <ShieldCheck size={20} aria-hidden="true" />Administración<ChevronDown size={16} aria-hidden="true" className={cn(s.chevron, adminOpen && s.chevronOpen)} />
        </button>
        {adminOpen && <div id="admin-nav-administracion" className="flex flex-col gap-0.5 pl-8">
          {ADMIN_NAV.map(item => <Link key={item.href} href={item.href} className={cn(s.link, s.sub)} aria-current={isNavActive(pathname, item) ? "page" : undefined}>{item.label}</Link>)}
        </div>}
      </>}
    </nav>
    <div className={s.footer}>
      <span className={s.avatar} aria-hidden="true">{user.initials}</span>
      <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-semibold">{user.name}</span><span className="text-xs text-muted-foreground">{role === "admin" ? "Administrador" : "Asesor"}</span></span>
      <ThemeToggle />
    </div>
    <div className="flex flex-col gap-0.5">
      <Link href="/admin/perfil" className={cn(s.link, s.sub)} aria-current={pathname.startsWith("/admin/perfil") ? "page" : undefined}><UserRound size={18} aria-hidden="true" />Mi perfil</Link>
      <DocumentLink href="/" className={cn(s.link, s.sub)}><ExternalLink size={18} aria-hidden="true" />Ver sitio</DocumentLink>
      <AsyncButton type="button" onClick={onLogout} className={cn(s.link, s.sub)}><LogOut size={18} aria-hidden="true" />Salir</AsyncButton>
    </div>
  </aside>;
}

export function MobileTabBar({ pathname, menuOpen, onMenu, menuButton }: { pathname: string; menuOpen: boolean; onMenu: () => void; menuButton: React.Ref<HTMLButtonElement> }) {
  const pending = usePendingCount();
  const [hoy, operaciones, contactos] = MAIN_NAV;
  const tab = (item: NavItem, badge = 0) => {
    const active = !menuOpen && isNavActive(pathname, item);
    return <Link href={item.href} className={s.tab} aria-current={active ? "page" : undefined}>
      <span className="relative"><item.icon size={22} aria-hidden={true} />{badge > 0 && <span className={s.tabCount} aria-hidden="true">{badge > 99 ? "99+" : badge}</span>}</span>{item.label}{badge > 0 && <span className="sr-only">, {badge} {badge === 1 ? "pendiente" : "pendientes"}</span>}
    </Link>;
  };
  return <nav className={s.tabbar} aria-label="Secciones principales">
    {tab(hoy, pending)}{tab(operaciones)}
    <Link href="/admin/operaciones/nueva" className={s.plus} aria-label="Nueva operación"><Plus size={26} aria-hidden="true" /></Link>
    {tab(contactos)}
    <button ref={menuButton} type="button" className={s.tab} aria-expanded={menuOpen} aria-controls="admin-mobile-menu" aria-label="Menú del panel" onClick={onMenu}><Menu size={22} aria-hidden="true" />Menú</button>
  </nav>;
}

export function MobileMenu({ pathname, role, user, onNavigate, onLogout, panel }: { pathname: string; role: string; user: { name: string; email: string; initials: string }; onNavigate: () => void; onLogout: () => Promise<void>; panel: React.Ref<HTMLElement> }) {
  const [, , , inmuebles, agenda] = MAIN_NAV;
  const row = (href: string, label: string, icon: React.ReactNode, active: boolean) => <Link href={href} className={s.menuRow} aria-current={active ? "page" : undefined} onClick={onNavigate}>{icon}{label}</Link>;
  return <nav ref={panel} id="admin-mobile-menu" className={s.menu} aria-label="Módulos móviles">
    <div className="flex items-center gap-3 px-1"><span className={s.avatar} aria-hidden="true">{user.initials}</span><span className="flex min-w-0 flex-col"><span className="font-semibold">{user.name}</span><span className="break-all text-sm text-muted-foreground">{user.email}</span></span></div>
    <div className={s.menuGroup}>
      {row(inmuebles.href, inmuebles.label, <inmuebles.icon size={20} aria-hidden={true} />, isNavActive(pathname, inmuebles))}
      {row(agenda.href, agenda.label, <agenda.icon size={20} aria-hidden={true} />, isNavActive(pathname, agenda))}
      {row(TOOLS_NAV.href, "Herramientas", <TOOLS_NAV.icon size={20} aria-hidden={true} />, isNavActive(pathname, TOOLS_NAV))}
    </div>
    {role === "admin" && <div className={s.menuGroup} aria-label="Administración" role="group">
      <p className={s.menuLabel}>Administración</p>
      {ADMIN_NAV.map(item => <React.Fragment key={item.href}>{row(item.href, item.label, null, isNavActive(pathname, item))}</React.Fragment>)}
    </div>}
    <div className={s.menuGroup}>
      <div className={s.menuRow}><span className="flex-1">Modo oscuro</span><ThemeToggle /></div>
      {row("/admin/perfil", "Mi perfil", <UserRound size={20} aria-hidden="true" />, pathname.startsWith("/admin/perfil"))}
      <DocumentLink href="/" className={s.menuRow} onClick={onNavigate}><ExternalLink size={20} aria-hidden="true" />Ver sitio</DocumentLink>
      <AsyncButton type="button" onClick={onLogout} className={s.menuRow}><LogOut size={20} aria-hidden="true" />Salir</AsyncButton>
    </div>
  </nav>;
}
