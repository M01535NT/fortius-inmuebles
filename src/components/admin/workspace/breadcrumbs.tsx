"use client";
import Link from "next/link";
import { APPS } from "@/lib/apps/catalog";
import { usePathname } from "next/navigation";
const labels: Record<string, string> = { ...Object.fromEntries(APPS.map(app=>[app.slug,app.title])), apps: "Aplicaciones", proceso: "Procedimiento", captacion: "Captación", preparacion: "Preparación", promocion: "Promoción", negociacion: "Negociación", cierre: "Cierre", postventa: "Postventa", propiedades: "Inmuebles", leads: "CRM", clientes: "Clientes", tareas: "Tareas", calendario: "Calendario", expedientes: "Operaciones", documentos: "Documentos", finanzas: "Finanzas", territorio: "Análisis territorial", "portal-clientes": "Portal de clientes", archivos: "Archivos", asesores: "Asesores", blog: "Blog", contenido: "Contenido", configuracion: "Configuración", perfil: "Mi perfil", reportes: "Reportes", historial: "Historial", "control-comercial": "Control comercial", nuevo: "Nuevo", editar: "Editar" };
export function Breadcrumbs() {
  const parts = usePathname().split("/").filter(Boolean).slice(1);
  if (!parts.length || (parts.length === 1 && ["leads", "propiedades"].includes(parts[0]))) return null;
  return <nav aria-label="Ubicación en el panel" className="admin-breadcrumbs"><Link href="/admin">Inicio</Link>{parts.map((part, index) => <span key={index}><span aria-hidden="true"> / </span>{(index === parts.length - 1 || !labels[part] || part === "proceso") ? <span aria-current={index === parts.length - 1 ? "page" : undefined}>{labels[part] ?? "Registro"}</span> : <Link href={"/admin/" + parts.slice(0, index + 1).join("/")}>{labels[part] ?? "Registro"}</Link>}</span>)}</nav>;
}
