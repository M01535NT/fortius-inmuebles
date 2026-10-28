"use client";
import Link from "next/link";
import { APPS } from "@/lib/apps/catalog";
import { db, useCollection } from "@/lib/admin/store";
import { SALE_PROCESS } from "@/lib/formatos/operation-workflow";
import { usePathname } from "next/navigation";
const labels: Record<string, string> = { ...Object.fromEntries(APPS.map(app=>[app.slug,app.title])), apps: "Herramientas", herramientas: "Herramientas", operaciones: "Operaciones", contactos: "Contactos", agenda: "Agenda", sistema: "Sistema", entrevistas: "Entrevista", proceso: "Proceso de venta", ...Object.fromEntries(SALE_PROCESS.map(phase=>[phase.slug,phase.label])), propiedades: "Inmuebles", leads: "Prospectos", clientes: "Clientes", tareas: "Tareas", calendario: "Calendario", expedientes: "Operaciones", documentos: "Documentos", archivos: "Archivos", asesores: "Asesores", blog: "Blog", contenido: "Contenido", configuracion: "Configuración", perfil: "Mi perfil", reportes: "Reportes", historial: "Historial", "control-comercial": "Control comercial", nuevo: "Nuevo", editar: "Editar" };
/*
  Una ficha se nombra por lo que es (titular, 27/10/2026: «Registro» no se entendía). El
  identificador de la dirección no se muestra: una tarea dice su título; lo demás, su tipo.
*/
const kinds: Record<string, string> = { tareas: "Tarea", propiedades: "Inmueble", clientes: "Cliente", leads: "Prospecto", contactos: "Contacto", asesores: "Asesor", blog: "Artículo", documentos: "Documento", archivos: "Archivo", expedientes: "Operación" };
/** Título de la tarea abierta; mientras carga, «Tarea». */
function TaskName({ id }: { id: string }) {
  const task = useCollection(db.tareas).find(item => item.id === decodeURIComponent(id));
  return <>{task?.titulo || "Tarea"}</>;
}
export function Breadcrumbs() {
  const parts = usePathname().split("/").filter(Boolean).slice(1);
  // Operaciones tiene su propio regreso y Nueva operación ocupa toda la pantalla.
  if(parts[0]==="operaciones")return null;
  // Cada sección principal tiene su propio título; las migas solo ayudan dentro de una ficha.
  if (parts.length <= 1) return null;
  const name = (part: string, index: number) => labels[part] ?? (parts[index - 1] === "tareas" ? <TaskName id={part} /> : kinds[parts[index - 1]] ?? "Detalle");
  return <nav aria-label="Ubicación en el panel" className="admin-breadcrumbs"><Link href="/admin">Inicio</Link>{parts.map((part, index) => <span key={index}><span aria-hidden="true"> / </span>{(index === parts.length - 1 || !labels[part] || part === "proceso") ? <span aria-current={index === parts.length - 1 ? "page" : undefined}>{name(part, index)}</span> : <Link href={"/admin/" + parts.slice(0, index + 1).join("/")}>{name(part, index)}</Link>}</span>)}</nav>;
}
