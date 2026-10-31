"use client";
import * as React from "react";
import Link from "next/link";
import { Building2, CalendarDays, CalendarPlus, ChevronDown, ChevronRight, ClipboardList, Columns3, Contact, ExternalLink, House, LayoutGrid, LogOut, Menu, Moon, Plus, ShieldCheck, UserRound } from "@/components/admin/icons";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { AsyncButton } from "@/components/admin/ui";
import { Avatar } from "@/components/admin/kit";
import { db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { projectFollowups } from "@/lib/admin/followups";
import { isTaskOpen } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import s from "./guided-nav.module.css";

/*
  Marco del panel, versión 2 (titular, 30/10/2026, DEC-35): barra superior con el logotipo,
  las píldoras Hoy · Operaciones · Contactos · Inmuebles · Agenda · Más, el buscador (Ctrl K),
  «+ Nuevo» con un menú corto y la cuenta. En celular, barra inferior flotante con «+» y «Más».
  Reemplaza al menú lateral del 17/10/2026.
*/

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>; match: string[] };
export const MAIN_NAV: NavItem[] = [
  { href: "/admin", label: "Hoy", icon: House, match: [] },
  { href: "/admin/operaciones", label: "Operaciones", icon: Columns3, match: ["/admin/operaciones"] },
  { href: "/admin/contactos", label: "Contactos", icon: Contact, match: ["/admin/contactos", "/admin/leads", "/admin/clientes"] },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2, match: ["/admin/propiedades"] },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays, match: ["/admin/agenda", "/admin/tareas"] },
];
/** Herramientas: un solo acceso a las 17 (y a Notas del equipo). */
export const TOOLS_NAV: NavItem = { href: "/admin/herramientas", label: "Herramientas", icon: LayoutGrid, match: ["/admin/herramientas", "/admin/apps", "/admin/notas"] };
/** Administración (solo administrador). Sitio web y Reportes agrupan sus páginas en pestañas (ver AdminFrame). */
export const ADMIN_NAV: Array<{ href: string; label: string; match: string[] }> = [
  { href: "/admin/asesores", label: "Equipo", match: ["/admin/asesores"] },
  { href: "/admin/contenido", label: "Sitio web", match: ["/admin/contenido", "/admin/blog", "/admin/archivos"] },
  { href: "/admin/reportes", label: "Reportes", match: ["/admin/reportes", "/admin/control-comercial"] },
  { href: "/admin/historial", label: "Historial", match: ["/admin/historial"] },
  { href: "/admin/configuracion", label: "Configuración", match: ["/admin/configuracion"] },
];
/** «Más» en la barra superior: lleva a Herramientas y se marca también dentro de Administración y Mi perfil. */
export const MORE_NAV: NavItem = { href: TOOLS_NAV.href, label: "Más", icon: LayoutGrid, match: [...TOOLS_NAV.match, ...ADMIN_NAV.flatMap(item => item.match), "/admin/perfil", "/admin/sistema"] };
/** «+ Nuevo» (C08): cinco altas en un menú corto. `action` avisa a la pantalla destino por `fortius:quick-create`. */
export const QUICK_CREATE: Array<{ label: string; href: string; action: "" | "prospecto" | "tarea" | "visita"; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }> }> = [
  { label: "Nueva operación", href: "/admin/operaciones/nueva", action: "", icon: Plus },
  { label: "Nuevo prospecto", href: "/admin/contactos?nuevo=1", action: "prospecto", icon: Contact },
  { label: "Nuevo inmueble", href: "/admin/propiedades/nueva", action: "", icon: Building2 },
  { label: "Nueva tarea", href: "/admin/agenda?tab=tareas&nueva=1", action: "tarea", icon: ClipboardList },
  { label: "Agendar visita", href: "/admin/agenda?nueva=1", action: "visita", icon: CalendarPlus },
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

/** Un menú flotante que se cierra con Escape, al tocar fuera o al mover el foco fuera. */
function useDismiss(open: boolean, close: () => void, container: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => { if (event.target instanceof Node && !container.current?.contains(event.target)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { close(); container.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("focusin", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside); document.removeEventListener("keydown", escape); };
  }, [open, close, container]);
}

/** Barra superior de la computadora. */
export function TopNav({ pathname, role, user, onLogout, search }: { pathname: string; role: string; user: User; onLogout: () => Promise<void>; search: React.ReactNode }) {
  const pending = usePendingCount();
  return <header className={s.topnav} aria-label="Barra del panel">
    <Link href="/admin" className={s.logo} aria-label="Fortius Inmuebles, ir a Hoy"><BrandMark className="h-7 w-28" /></Link>
    <nav aria-label="Módulos del panel" className={s.pills}>
      {[...MAIN_NAV, MORE_NAV].map(item => <Link key={item.href} href={item.href} className={s.pill} aria-current={isNavActive(pathname, item) ? "page" : undefined}>
        <item.icon size={18} aria-hidden={true} /><span className={s.pillLabel}>{item.label}</span>{item.href === "/admin" && <Count value={pending} />}
      </Link>)}
    </nav>
    <span className={s.space} />
    {search}
    <NewMenu />
    <AccountMenu pathname={pathname} role={role} user={user} onLogout={onLogout} />
  </header>;
}

/** «+ Nuevo»: las cinco altas en un menú; la operación va primero. */
function NewMenu() {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  useDismiss(open, close, wrap);
  return <div ref={wrap} className={s.menuWrap}>
    <button type="button" className={s.newButton} aria-expanded={open} aria-controls="admin-new-menu" aria-haspopup="menu" onClick={() => setOpen(value => !value)}><Plus size={18} aria-hidden="true" />Nuevo</button>
    {open && <div id="admin-new-menu" role="menu" aria-label="Qué quieres crear" className={s.pop}>
      {QUICK_CREATE.map(item => <Link key={item.href} role="menuitem" href={item.href} className={cn(s.link, s.sub)} onClick={() => { close(); window.dispatchEvent(new CustomEvent("fortius:quick-create", { detail: item.action })); }}><item.icon size={18} aria-hidden={true} />{item.label}</Link>)}
    </div>}
  </div>;
}

/** La cuenta: foto o iniciales; al abrir, Mi perfil, Administración (administrador), Ver sitio, tema y Cerrar sesión. */
function AccountMenu({ pathname, role, user, onLogout }: { pathname: string; role: string; user: User; onLogout: () => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  useDismiss(open, close, wrap);
  return <div ref={wrap} className={s.menuWrap}>
    <button type="button" className={s.account} aria-expanded={open} aria-controls="admin-account-menu" aria-label={`${user.name}, ${roleLabel(role)}. Cuenta y sesión`} onClick={() => setOpen(value => !value)}>
      <Avatar name={user.name} src={user.avatar} size={40} />
    </button>
    {open && <div id="admin-account-menu" className={s.pop}>
      <p className={s.popHead}><span className="truncate font-semibold">{user.name}</span><span className="text-xs text-muted-foreground">{roleLabel(role)}</span></p>
      <Link href="/admin/perfil" className={cn(s.link, s.sub)} aria-current={pathname.startsWith("/admin/perfil") ? "page" : undefined} onClick={close}><UserRound size={18} aria-hidden="true" />Mi perfil</Link>
      {role === "admin" && <Link href={ADMIN_NAV[0].href} className={cn(s.link, s.sub)} aria-current={ADMIN_NAV.some(item => isNavActive(pathname, item)) ? "page" : undefined} onClick={close}><ShieldCheck size={18} aria-hidden="true" />Administración</Link>}
      <DocumentLink href="/" className={cn(s.link, s.sub)}><ExternalLink size={18} aria-hidden="true" />Ver sitio</DocumentLink>
      <div className={cn(s.link, s.sub, "cursor-default hover:bg-transparent")}><Moon size={18} aria-hidden="true" /><span className="flex-1">Modo oscuro</span><ThemeToggle className="h-9 w-9 rounded-[8px]" /></div>
      <AsyncButton type="button" onClick={onLogout} className={cn(s.link, s.sub)}><LogOut size={18} aria-hidden="true" />Cerrar sesión</AsyncButton>
    </div>}
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
    <button ref={menuButton} type="button" className={s.tab} aria-expanded={menuOpen} aria-controls="admin-mobile-menu" aria-label="Menú del panel" onClick={onMenu}><Menu size={22} aria-hidden="true" />Más</button>
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
      {row(TOOLS_NAV.href, TOOLS_NAV.label, <TOOLS_NAV.icon size={20} aria-hidden={true} />, isNavActive(pathname, TOOLS_NAV))}
    </div>
    {role === "admin" && <div className={s.menuGroup}>
      <button type="button" className={s.menuRow} aria-expanded={adminOpen} aria-controls="admin-menu-administracion" onClick={() => setAdminOpen(open => !open)}>
        <ShieldCheck size={20} aria-hidden="true" /><span className="flex-1">Administración</span><ChevronDown size={18} aria-hidden="true" className={cn(s.chevron, adminOpen && s.chevronOpen)} />
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
