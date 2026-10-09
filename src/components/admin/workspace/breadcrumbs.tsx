"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const labels: Record<string, string> = { propiedades: "Inmuebles", leads: "Prospectos", clientes: "Clientes", tareas: "Tareas", calendario: "Calendario", expedientes: "Expedientes", archivos: "Archivos", asesores: "Asesores", blog: "Blog", contenido: "Contenido", configuracion: "Configuración", perfil: "Mi perfil", reportes: "Reportes", historial: "Historial", "control-comercial": "Control comercial", nuevo: "Nuevo", editar: "Editar" };
export function Breadcrumbs() {
  const parts = usePathname().split("/").filter(Boolean).slice(1);
  if (!parts.length) return null;
  return <nav aria-label="Ubicación en el panel" className="admin-breadcrumbs"><Link href="/admin">Inicio</Link>{parts.map((part, index) => <span key={index}><span aria-hidden="true"> / </span>{(index === parts.length - 1 || !labels[part]) ? <span aria-current={index === parts.length - 1 ? "page" : undefined}>{labels[part] ?? "Registro"}</span> : <Link href={"/admin/" + parts.slice(0, index + 1).join("/")}>{labels[part] ?? "Registro"}</Link>}</span>)}</nav>;
}
