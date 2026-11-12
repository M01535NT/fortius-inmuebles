"use client";
import Link from "next/link";
import { ClipboardList, ShieldCheck } from "@/components/admin/icons";
import { APPS } from "@/lib/apps/catalog";
import { ButtonLink } from "@/components/admin/kit";
import { ADMIN_NAV } from "@/components/admin/workspace/guided-nav";
import { useSession } from "@/lib/admin/store";
import { AppIcon } from "./app-icon";
import styles from "./catalog.module.css";

/*
  Herramientas (C45, 02/11/2026): las herramientas agrupadas por categoría, sin buscador,
  filtros, contador ni estrellas (HER-01); el buscador global ya encuentra cualquiera.
  Arriba, los accesos que «Más» promete (DEC-35): Notas del equipo y, para el administrador,
  Administración. Cada tarjeta es un enlace completo con un ícono de color por familia.
*/

const ORDER = ["Comercial", "Finanzas", "Documentos", "Productividad"] as const;

export function AppsCatalog(){
 const session=useSession();
 const sections=ORDER.map(c=>({title:c,items:APPS.filter(a=>a.category===c)})).filter(sec=>sec.items.length);
 const tile=(app:typeof APPS[number])=><article key={app.slug} className={styles.tile} data-category={app.category}>
  <span className={styles.icon}><AppIcon name={app.icon}/></span>
  <Link href={`/admin/apps/${app.slug}`}>{app.title}</Link>
  <p>{app.description}</p>
 </article>;
 return <div className="flex flex-col gap-5">
  <div className={styles.toolbar}>
   <ButtonLink href="/admin/notas"><ClipboardList size={16} aria-hidden="true"/>Notas del equipo</ButtonLink>
   {session?.role==="admin"&&<ButtonLink href={ADMIN_NAV[0].href}><ShieldCheck size={16} aria-hidden="true"/>Administración</ButtonLink>}
  </div>
  <div className={styles.sections} data-tour="herramientas-grupos">{sections.map(sec=><section key={sec.title} className={styles.section} aria-label={sec.title}>
   <h2 className={styles.sectionHead}>{sec.title}</h2>
   <div className={styles.grid}>{sec.items.map(tile)}</div>
  </section>)}</div>
 </div>;
}
