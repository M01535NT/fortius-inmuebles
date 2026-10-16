import type * as React from "react";
import {
  Building2, CalendarDays, ChartNoAxesCombined, ContactRound, FileText,
  FolderOpen, History, LayoutDashboard, ListTodo, Newspaper, PenLine,
  Settings, StickyNote, Users, UsersRound, BriefcaseBusiness, ClipboardCheck,
} from "lucide-react";
import { SALE_PROCESS, type SalePhase } from "@/lib/formatos/operation-workflow";

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

const ADMIN_MODULES: AdminModule[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, group: "Inicio", primary: true, tone: "rose" },
  { href: "/admin/leads", label: "CRM", icon: Users, group: "Comercial", primary: true },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2, group: "Comercial", primary: true },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound, group: "Equipo y administración", tone: "rose" },
  { href: "/admin/expedientes", label: "Operaciones", icon: FileText, group: "Comercial", primary: true },
  { href: "/admin/documentos", label: "Documentos", icon: FolderOpen, group: "Gestión", primary: true },
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

/** Etapas del proceso de comercialización: accesibles, pero fuera del menú diario. */
const PROCESS_PRESENTATION: Record<SalePhase, { icon: AdminModule["icon"]; action: { href: string; label: string } }> = {
  captacion: { icon: ContactRound, action: { href: "/admin/operaciones/nueva", label: "Nueva operación" } },
  verificacion: { icon: ClipboardCheck, action: { href: "/admin/apps/comparables", label: "Comparar propiedades" } },
  contrato: { icon: PenLine, action: { href: "/admin/apps/ficha-comercial", label: "Preparar ficha comercial" } },
  publicacion: { icon: Building2, action: { href: "/admin/propiedades", label: "Abrir inventario" } },
  visitas: { icon: CalendarDays, action: { href: "/admin/calendario", label: "Abrir agenda" } },
  cierre: { icon: BriefcaseBusiness, action: { href: "/admin/tareas", label: "Ver tareas" } },
};
export const PROCESS_STAGES = SALE_PROCESS.map((phase, index) => ({ ...phase, numero: index, ...PROCESS_PRESENTATION[phase.key] }));
/** Direcciones anteriores a la definición del 15/10/2026. */
export const LEGACY_PROCESS_SLUGS: Record<string, string> = { preparacion: "verificacion-precio", promocion: "publicacion-seguimiento", negociacion: "visitas-ofertas", cierre: "cierre-entrega", postventa: "cierre-entrega" };
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
    group: "Proceso de venta",
    primary: false,
    fixed: true,
  })),
  ...ADMIN_MODULES
    .filter(module => !PRIMARY_HREFS.has(module.href))
    .map(module => ({ ...module, group: "Más", primary: false })),
];
