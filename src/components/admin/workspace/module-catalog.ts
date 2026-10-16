import type * as React from "react";
import { BriefcaseBusiness, Building2, CalendarDays, ClipboardCheck, ContactRound, PenLine } from "lucide-react";
import { SALE_PROCESS, type SalePhase } from "@/lib/formatos/operation-workflow";

/** Etapas del proceso de comercialización: accesibles, pero fuera del menú diario. */
const PROCESS_PRESENTATION: Record<SalePhase, { icon: React.ComponentType<{ className?: string; size?: number }>; action: { href: string; label: string } }> = {
  captacion: { icon: ContactRound, action: { href: "/admin/operaciones/nueva", label: "Nueva operación" } },
  verificacion: { icon: ClipboardCheck, action: { href: "/admin/apps/comparables", label: "Comparar propiedades" } },
  contrato: { icon: PenLine, action: { href: "/admin/apps/ficha-comercial", label: "Preparar ficha comercial" } },
  publicacion: { icon: Building2, action: { href: "/admin/propiedades", label: "Abrir inventario" } },
  visitas: { icon: CalendarDays, action: { href: "/admin/agenda", label: "Abrir agenda" } },
  cierre: { icon: BriefcaseBusiness, action: { href: "/admin/agenda?tab=tareas", label: "Ver tareas" } },
};
export const PROCESS_STAGES = SALE_PROCESS.map((phase, index) => ({ ...phase, numero: index, ...PROCESS_PRESENTATION[phase.key] }));
/** Direcciones anteriores a la definición del 15/10/2026. */
export const LEGACY_PROCESS_SLUGS: Record<string, string> = { preparacion: "verificacion-precio", promocion: "publicacion-seguimiento", negociacion: "visitas-ofertas", cierre: "cierre-entrega", postventa: "cierre-entrega" };
export function getProcessStage(slug: string) { return PROCESS_STAGES.find(stage => stage.slug === slug); }
