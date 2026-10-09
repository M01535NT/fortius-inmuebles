"use client";
import Link from "next/link";
import { db, settingsStore, useCollection, useSession, useSingleton } from "@/lib/admin/store";
export function SetupChecklist() {
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
  if (steps.every(step => step.done)) return null;
  return <details className="admin-setup rounded-lg border border-border bg-card p-4"><summary className="cursor-pointer font-semibold">Preparar tu espacio · {steps.filter(step => step.done).length} de {steps.length}</summary><ul className="mt-3 grid gap-2 sm:grid-cols-2">{steps.map(step => <li key={step.href}><Link className="flex min-h-11 items-center gap-2 rounded-md bg-secondary px-3 text-sm" href={step.href}><span aria-hidden="true">{step.done ? "✓" : "○"}</span>{step.label}<span className="sr-only">{step.done ? ", completado" : ", pendiente"}</span></Link></li>)}</ul></details>;
}
