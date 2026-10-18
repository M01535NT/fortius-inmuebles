"use client";
import * as React from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, Columns3, Contact, ExternalLink, House, LayoutGrid, LogOut, Menu, Moon, Plus, ShieldCheck, UserRound, Building2 } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AsyncButton } from "@/components/admin/ui";
import { Avatar, ButtonLink } from "@/components/admin/kit";
import { db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import s from "./guided-nav.module.css";

/*
  Marco del panel (bocetos aprobados por el titular, 17/10/2026): menú lateral flotante con el
  logotipo, cinco secciones, Herramientas y Administración (solo admin); barra superior con el
  buscador rápido (Ctrl K) y «Nueva operación»; en celular, barra inferior flotante con «+».
*/

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>; match: string[] };
export const MAIN_NAV: NavItem[] = [
  { href: "/admin", label: "Hoy", icon: House, match: [] },
  { href: "/admin/operaciones", label: "Operaciones", icon: Columns3, match: ["/admin/operaciones"] },
  { href: "/admin/contactos", label: "Contactos", icon: Contact, match: ["/admin/contactos", "/admin/leads", "/admin/clientes"] },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2, match: ["/admin/propiedades"] },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays, match: ["/admin/agenda", "/admin/tareas"] },
];
export const TOOLS_NAV: NavItem = { href: "/admin/herramientas", label: "Herramientas", icon: LayoutGrid, match: ["/admin/herramientas", "/admin/apps", "/admin/notas"] };
/** Administración. Sitio web y Reportes agrupan sus páginas en pestañas (ver AdminFrame). */
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

type User = { name: string; email: string; initials: string; avatar?: string };
const roleLabel = (role: string) => role === "admin" ? "Administrador" : "Asesor";

export function GuidedSidebar({ pathname, role, user, onLogout }: { pathname: string; role: string; user: User; onLogout: () => Promise<void> }) {
  const pending = usePendingCount();
  const adminActive = ADMIN_NAV.some(item => isNavActive(pathname, item));
  const [adminOpen, setAdminOpen] = React.useState(adminActive);
  const [account, setAccount] = React.useState(false);
  const accountRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!account) return;
    const close = (event: Event) => { if (event.target instanceof Node && !accountRef.current?.contains(event.target)) setAccount(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setAccount(false); accountRef.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", close); document.addEventListener("focusin", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("focusin", close); document.removeEventListener("keydown", escape); };
  }, [account]);
  return <aside className={s.sidebar} aria-label="Panel">
    <Link href="/admin" className={s.logo} aria-label="Fortius Inmuebles, ir a Hoy"><BrandMark className="h-8 w-32" /></Link>
    <nav aria-label="Módulos del panel" className="flex flex-col gap-0.5">
      {MAIN_NAV.map(item => <Link key={item.href} href={item.href} className={s.link} aria-current={isNavActive(pathname, item) ? "page" : undefined}>
        <item.icon size={19} aria-hidden={true} />{item.label}{item.href === "/admin" && <Count value={pending} />}
      </Link>)}
      <span className={s.rule} aria-hidden="true" />
      <Link href={TOOLS_NAV.href} className={s.link} aria-current={isNavActive(pathname, TOOLS_NAV) ? "page" : undefined}><TOOLS_NAV.icon size={19} aria-hidden={true} />{TOOLS_NAV.label}<span className={s.meta}>16</span></Link>
      {role === "admin" && <>
        <button type="button" className={s.link} aria-expanded={adminOpen} aria-controls="admin-nav-administracion" onClick={() => setAdminOpen(open => !open)}>
          <ShieldCheck size={19} aria-hidden="true" />Administración<ChevronDown size={16} aria-hidden="true" className={cn(s.chevron, adminOpen && s.chevronOpen)} />
        </button>
        {adminOpen && <div id="admin-nav-administracion" className="flex flex-col gap-0.5 pl-8">
          {ADMIN_NAV.map(item => <Link key={item.href} href={item.href} className={cn(s.link, s.sub)} aria-current={isNavActive(pathname, item) ? "page" : undefined}>{item.label}</Link>)}
        </div>}
      </>}
    </nav>
    <div ref={accountRef} className={cn(s.footerMenu, "mt-auto")}>
      {account && <div id="admin-account-menu" className={s.footerPop}>
        <Link href="/admin/perfil" className={cn(s.link, s.sub)} aria-current={pathname.startsWith("/admin/perfil") ? "page" : undefined} onClick={() => setAccount(false)}><UserRound size={18} aria-hidden="true" />Mi perfil</Link>
        <DocumentLink href="/" className={cn(s.link, s.sub)}><ExternalLink size={18} aria-hidden="true" />Ver sitio</DocumentLink>
        <div className={cn(s.link, s.sub, "cursor-default hover:bg-transparent")}><Moon size={18} aria-hidden="true" /><span className="flex-1">Modo oscuro</span><ThemeToggle className="h-9 w-9 rounded-[8px]" /></div>
        <AsyncButton type="button" onClick={onLogout} className={cn(s.link, s.sub)}><LogOut size={18} aria-hidden="true" />Cerrar sesión</AsyncButton>
      </div>}
      <button type="button" className={cn(s.footer, "w-full border-0 text-left")} aria-expanded={account} aria-controls="admin-account-menu" aria-label={`${user.name}, ${roleLabel(role)}. Cuenta y sesión`} onClick={() => setAccount(open => !open)}>
        <Avatar name={user.name} src={user.avatar} size={36} />
        <span className="flex min-w-0 flex-1 flex-col" aria-hidden="true"><span className="truncate text-sm font-semibold">{user.name}</span><span className="text-xs text-muted-foreground">{roleLabel(role)}</span></span>
        <ChevronDown size={16} aria-hidden="true" className={cn("text-muted-foreground", s.chevron, account && s.chevronOpen)} />
      </button>
    </div>
  </aside>;
}

/** Barra superior de la computadora: buscador rápido a la izquierda y la acción principal a la derecha. */
export function Topbar({ search, children }: { search: React.ReactNode; children?: React.ReactNode }) {
  return <div className={s.topbar}>
    {search}
    <span className={s.topbarSpace} />
    {children}
    <ButtonLink href="/admin/operaciones/nueva" variant="primary"><Plus size={18} aria-hidden="true" />Nueva operación</ButtonLink>
  </div>;
}

/** Encabezado del celular: logotipo, búsqueda y la cuenta. */
export function MobileHeader({ search, user }: { search: React.ReactNode; user: User }) {
  return <header className={cn(s.mobileHead, "admin-mobile-header")}>
    <Link href="/admin" aria-label="Fortius Inmuebles, ir a Hoy" className="flex items-center"><BrandMark variant="compact" className="h-7 w-28" /></Link>
    <div className="flex items-center gap-1">
      {search}
      <Link href="/admin/perfil" aria-label={`Mi perfil, ${user.name}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full"><Avatar name={user.name} src={user.avatar} size={36} /></Link>
    </div>
  </header>;
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
    <Link href="/admin/operaciones/nueva" className={s.plus} aria-label="Nueva operación"><Plus size={24} aria-hidden="true" /></Link>
    {tab(contactos)}
    <button ref={menuButton} type="button" className={s.tab} aria-expanded={menuOpen} aria-controls="admin-mobile-menu" aria-label="Menú del panel" onClick={onMenu}><Menu size={22} aria-hidden="true" />Menú</button>
  </nav>;
}

export function MobileMenu({ pathname, role, user, onNavigate, onLogout, panel }: { pathname: string; role: string; user: User; onNavigate: () => void; onLogout: () => Promise<void>; panel: React.Ref<HTMLElement> }) {
  const [, , , inmuebles, agenda] = MAIN_NAV;
  const events = useCollection(db.eventos);
  const today = operationalDate();
  const visits = events.filter(event => event.tipo === "visita" && event.fecha === today).length;
  const [adminOpen, setAdminOpen] = React.useState(() => ADMIN_NAV.some(item => isNavActive(pathname, item)));
  const row = (href: string, label: string, icon: React.ReactNode, active: boolean, meta?: string) => <Link href={href} className={s.menuRow} aria-current={active ? "page" : undefined} onClick={onNavigate}>
    {icon}<span className="flex-1">{label}</span>{meta && <span className={s.menuMeta}>{meta}</span>}{icon && <ChevronRight size={18} aria-hidden="true" className={s.menuChevron} />}
  </Link>;
  return <nav ref={panel} id="admin-mobile-menu" className={s.menu} aria-label="Módulos móviles">
    <div className="flex items-center gap-3 px-1"><Avatar name={user.name} src={user.avatar} size={40} /><span className="flex min-w-0 flex-col"><span className="truncate font-semibold">{user.name}</span><span className="text-sm text-muted-foreground">{roleLabel(role)}</span></span></div>
    <div className={s.menuGroup}>
      {row(inmuebles.href, inmuebles.label, <inmuebles.icon size={20} aria-hidden={true} />, isNavActive(pathname, inmuebles))}
      {row(agenda.href, agenda.label, <agenda.icon size={20} aria-hidden={true} />, isNavActive(pathname, agenda), visits ? `${visits} ${visits === 1 ? "visita" : "visitas"} hoy` : undefined)}
    </div>
    <div className="flex flex-col gap-2">
      <p className={s.menuLabel} id="admin-menu-herramientas">Herramientas</p>
      <div className={s.menuGroup} role="group" aria-labelledby="admin-menu-herramientas">
        {row(TOOLS_NAV.href, "Ver las 16 herramientas", <TOOLS_NAV.icon size={20} aria-hidden={true} />, isNavActive(pathname, TOOLS_NAV))}
      </div>
      <p className="px-1 text-sm text-muted-foreground">Dentro de cada operación aparecen las de su etapa.</p>
    </div>
    {role === "admin" && <div className={s.menuGroup}>
      <button type="button" className={s.menuRow} aria-expanded={adminOpen} aria-controls="admin-menu-administracion" onClick={() => setAdminOpen(open => !open)}>
        <ShieldCheck size={20} aria-hidden="true" /><span className="flex-1">Administración</span><span className={s.menuBadge}>Solo admin</span><ChevronDown size={18} aria-hidden="true" className={cn(s.chevron, adminOpen && s.chevronOpen)} />
      </button>
      {adminOpen && <div id="admin-menu-administracion" role="group" aria-label="Administración" className="flex flex-col pl-8">
        {ADMIN_NAV.map(item => <React.Fragment key={item.href}>{row(item.href, item.label, null, isNavActive(pathname, item))}</React.Fragment>)}
      </div>}
    </div>}
    <div className={s.menuGroup}>
      <div className={s.menuRow}><Moon size={20} aria-hidden="true" /><span className="flex-1">Modo oscuro</span><ThemeToggle /></div>
      {row("/admin/perfil", "Mi perfil", <UserRound size={20} aria-hidden="true" />, pathname.startsWith("/admin/perfil"))}
      <DocumentLink href="/" className={s.menuRow} onClick={onNavigate}><ExternalLink size={20} aria-hidden="true" /><span className="flex-1">Ver sitio</span></DocumentLink>
      <AsyncButton type="button" onClick={onLogout} className={s.menuRow}><LogOut size={20} aria-hidden="true" />Cerrar sesión</AsyncButton>
    </div>
  </nav>;
}
