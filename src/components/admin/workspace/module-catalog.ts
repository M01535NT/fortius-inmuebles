import type * as React from "react";
import {
  Building2, CalendarDays, ChartNoAxesCombined, ContactRound, FileText,
  FolderOpen, History, LayoutDashboard, ListTodo, Newspaper, PenLine,
  Settings, StickyNote, Users, UsersRound, BriefcaseBusiness, Wallet, MapPin,
} from "lucide-react";

export type AdminModule = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  adminOnly?: boolean;
  group: string;
  primary?: boolean;
  tone?: "rose";
};

export const ADMIN_MODULES: AdminModule[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, group: "Inicio", primary: true, tone: "rose" },
  { href: "/admin/leads", label: "CRM", icon: Users, group: "Comercial", primary: true },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2, group: "Comercial", primary: true },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound, group: "Equipo y administración", tone: "rose" },
  { href: "/admin/expedientes", label: "Operaciones", icon: FileText, group: "Comercial", primary: true },
  { href: "/admin/documentos", label: "Documentos", icon: FolderOpen, group: "Gestión", primary: true },
  { href: "/admin/finanzas", label: "Finanzas", icon: Wallet, group: "Gestión", primary: true, adminOnly: true },
  { href: "/admin/territorio", label: "Análisis territorial", icon: MapPin, group: "Herramientas", primary: true },
  { href: "/admin/portal-clientes", label: "Portal de clientes", icon: ContactRound, group: "Herramientas", primary: true, adminOnly: true },
  { href: "/admin/control-comercial", label: "Control comercial", icon: BriefcaseBusiness, group: "Equipo y administración", adminOnly: true, tone: "rose" },
  { href: "/admin/reportes", label: "Reportes", icon: ChartNoAxesCombined, group: "Equipo y administración", adminOnly: true },
  { href: "/admin/tareas", label: "Tareas", icon: ListTodo, group: "Equipo y administración", tone: "rose" },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarDays, group: "Equipo y administración", tone: "rose" },
  { href: "/admin/notas", label: "Notas", icon: StickyNote, group: "Equipo y administración" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, group: "Publicación", tone: "rose" },
  { href: "/admin/asesores", label: "Asesores", icon: UsersRound, group: "Equipo y administración" },
  { href: "/admin/archivos", label: "Archivos", icon: FolderOpen, group: "Publicación" },
  { href: "/admin/contenido", label: "Contenido", icon: PenLine, group: "Publicación" },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, group: "Equipo y administración" },
  { href: "/admin/historial", label: "Historial", icon: History, group: "Equipo y administración", adminOnly: true, tone: "rose" },
];

export function permittedModules(modules: AdminModule[], role: string) {
  return modules.filter(module => !module.adminOnly || role === "admin");
}

const sidebarGroups = ["Inicio", "Comercial", "Gestión", "Herramientas", "Equipo y administración", "Publicación"];
export const SIDEBAR_MODULES = ADMIN_MODULES
  .filter(module => module.href !== "/admin/configuracion")
  .sort((a, b) => sidebarGroups.indexOf(a.group) - sidebarGroups.indexOf(b.group));
