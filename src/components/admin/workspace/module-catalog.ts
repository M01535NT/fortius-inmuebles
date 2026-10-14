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
  fixed?: boolean;
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

/** Etapas del procedimiento: accesibles, pero fuera del menú diario. */
export const PROCESS_STAGES = [
  { slug: "captacion", label: "Captación", etapa: "captacion", icon: ContactRound, description: "Revisa los expedientes en captación y da seguimiento a los contactos iniciales.", action: { href: "/admin/operaciones/nueva", label: "Nueva operación" } },
  { slug: "preparacion", label: "Preparación", etapa: "documentacion", icon: FolderOpen, description: "Prepara los expedientes que están en documentación: soportes, revisiones y pendientes.", action: { href: "/admin/documentos", label: "Consultar documentos" } },
  { slug: "promocion", label: "Promoción", etapa: "comercializacion", icon: Building2, description: "Consulta las operaciones en comercialización y coordina inventario, publicaciones y visitas.", action: { href: "/admin/propiedades", label: "Abrir inventario" } },
  { slug: "negociacion", label: "Negociación", etapa: "negociacion", icon: BriefcaseBusiness, description: "Da seguimiento a las operaciones en negociación y sus próximos acuerdos.", action: { href: "/admin/tareas", label: "Ver tareas" } },
  { slug: "cierre", label: "Cierre", etapa: "cierre", icon: FileText, description: "Revisa los expedientes en cierre y coordina los documentos, firmas y entregas pendientes.", action: { href: "/admin/calendario", label: "Abrir agenda" } },
  { slug: "postventa", label: "Postventa", etapa: "cerrado", icon: CalendarDays, description: "Seguimiento de expedientes cerrados mediante la agenda y las tareas existentes.", action: { href: "/admin/calendario", label: "Abrir agenda" } },
] as const;
export function getProcessStage(slug: string) { return PROCESS_STAGES.find(stage => stage.slug === slug); }

const PRIMARY_HREFS = new Set(["/admin", "/admin/tareas", "/admin/expedientes", "/admin/calendario"]);

/** Menú diario corto; el resto vive bajo «Más». */
export const SIDEBAR_MODULES: AdminModule[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, group: "Principal", primary: true, fixed: true, tone: "rose" },
  { href: "/admin/tareas", label: "Hoy", icon: ListTodo, group: "Principal", primary: true, fixed: true, tone: "rose" },
  { href: "/admin/expedientes", label: "Operaciones", icon: FileText, group: "Principal", primary: true, fixed: true },
  { href: "/admin/calendario", label: "Agenda", icon: CalendarDays, group: "Principal", primary: true, fixed: true, tone: "rose" },
  ...PROCESS_STAGES.map(stage => ({
    href: `/admin/proceso/${stage.slug}`,
    label: stage.label,
    icon: stage.icon,
    group: "Procedimiento",
    primary: false,
    fixed: true,
  })),
  ...ADMIN_MODULES
    .filter(module => !PRIMARY_HREFS.has(module.href))
    .map(module => ({ ...module, group: "Más", primary: false })),
];
