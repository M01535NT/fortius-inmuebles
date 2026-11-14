"use client";
import Link from "next/link";
import { CheckCircle2, Circle } from "@/components/admin/icons";
import { db, settingsStore, useCollection, useSession, useSingleton } from "@/lib/admin/store";

/** «Preparar tu espacio» (C57): solo para el administrador, en Hoy, mientras falte algún paso. */
/** `compact`: pastilla junto al saludo de Hoy que se abre con los pasos (13/11/2026). */
export function SetupChecklist({ className, compact }: { className?: string; compact?: boolean }) {
  const user = useSession();
  const settings = useSingleton(settingsStore);
  const advisers = useCollection(db.asesores), properties = useCollection(db.propiedades);
  if (user?.role !== "admin" || !settings || settingsStore.state().status !== "ready") return null;
  const steps = [
    { label: "Nombre y contacto del negocio", done: !!settings.nombreComercial && !!settings.email && !!settings.telefono, href: "/admin/configuracion" },
    { label: "Equipo de asesores", done: advisers.some(item => item.activo), href: "/admin/asesores" },
    { label: "Primer inmueble publicado", done: properties.some(item => item.publicada && !item.demo), href: "/admin/propiedades" },
    { label: "Tu nombre y fotografía", done: !!user.name && !!user.avatar, href: "/admin/perfil" },
  ];
  const done = steps.filter(step => step.done).length;
  if (done === steps.length) return null;
  const box = compact
    ? "max-w-full rounded-[1.375rem] border border-[var(--card-edge)] bg-[var(--card)] px-4 open:rounded-[var(--radius-card)] open:pb-3"
    : "rounded-[var(--radius-card)] border border-[var(--card-edge)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-rest)]";
  return <details className={(className ? className + " " : "") + box}>
    <summary className={"flex min-h-11 cursor-pointer items-center gap-2 " + (compact ? "text-sm font-semibold" : "font-semibold")}>
      Preparar tu espacio
      {compact && <span aria-hidden="true" className="inline-block h-1 w-12 overflow-hidden rounded-full bg-[var(--track)]"><span className="block h-full bg-[var(--primary)]" style={{ width: `${(done / steps.length) * 100}%` }} /></span>}
      <span className="font-normal text-muted-foreground">{compact ? "" : "· "}{done} de {steps.length}</span>
    </summary>
    <ul className="mt-2 grid gap-2 pb-1 sm:grid-cols-2">{steps.map(step => <li key={step.href}><Link className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-control)] bg-secondary px-3 text-sm" href={step.href}>
      {step.done ? <CheckCircle2 size={18} aria-hidden="true" className="text-[var(--success)]" /> : <Circle size={18} aria-hidden="true" className="text-muted-foreground" />}
      <span className={step.done ? "text-muted-foreground line-through" : undefined}>{step.label}</span><span className="sr-only">{step.done ? ", completado" : ", pendiente"}</span>
    </Link></li>)}</ul>
  </details>;
}
