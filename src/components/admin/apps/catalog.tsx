"use client";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardList, FileDown, ShieldCheck, Wallet } from "@/components/admin/icons";
import { APP_GROUPS, RETIRED_APPS, activeApps, appHref, type AppDefinition } from "@/lib/apps/catalog";
import { ButtonLink } from "@/components/admin/kit";
import { ADMIN_NAV } from "@/components/admin/workspace/guided-nav";
import { useSession } from "@/lib/admin/store";
import { AppIcon } from "./app-icon";
import styles from "./catalog.module.css";

/*
  Herramientas (HER-01, catálogo confirmado el 18/10/2026): arriba los tres accesos directos
  de lo que más se pide suelto; después tres grupos (Documentos · Calcular · Presentar) sin
  buscador, filtros, contador ni estrellas (C45). Lo retirado queda plegado al final, solo para
  consultar los trabajos que ya se guardaron con esas herramientas.
*/

const SHORTCUTS = [
  { href: "/admin/apps/documentos?vista=machotes", title: "Machotes en blanco", text: "Cualquier formato con el membrete, para revisarlo o llenarlo a mano.", Icon: FileDown },
  { href: "/admin/apps/documentos?formato=07", title: "Opinión de valor", text: "Con los datos que dé el cliente, sin abrir una operación.", Icon: Building2 },
  // ISR y neto (HER-03) sustituirá este acceso; mientras tanto, el neto sin el cálculo del ISR.
  { href: "/admin/apps/neto-propietario", title: "Neto del propietario", text: "Precio menos comisión y gastos. El ISR todavía se calcula aparte.", Icon: Wallet },
] as const;

export function AppsCatalog(){
 const session=useSession();
 const tile=(app:AppDefinition)=><article key={app.slug} className={styles.tile} data-group={app.group}>
  <span className={styles.icon}><AppIcon name={app.icon}/></span>
  <Link href={appHref(app.slug)}>{app.title}</Link>
  <p>{app.description}</p>
 </article>;
 return <div className="flex flex-col gap-7">
  <div className={styles.toolbar}>
   <ButtonLink href="/admin/notas"><ClipboardList size={16} aria-hidden="true"/>Notas del equipo</ButtonLink>
   {session?.role==="admin"&&<ButtonLink href={ADMIN_NAV[0].href}><ShieldCheck size={16} aria-hidden="true"/>Administración</ButtonLink>}
  </div>
  <section aria-labelledby="accesos-directos" className={styles.section}>
   <h2 id="accesos-directos" className={styles.sectionHead}>Lo que más se pide</h2>
   <ul className={styles.shortcuts}>{SHORTCUTS.map(({href,title,text,Icon})=><li key={href}>
    <Link href={href} className={styles.shortcut}>
     <span className={styles.shortcutIcon}><Icon size={22} aria-hidden="true"/></span>
     <span className={styles.shortcutBody}><strong>{title}</strong><span>{text}</span></span>
     <ArrowRight size={18} aria-hidden="true" className={styles.shortcutArrow}/>
    </Link>
   </li>)}</ul>
  </section>
  <div className={styles.sections} data-tour="herramientas-grupos">{APP_GROUPS.map(group=><section key={group} className={styles.section} aria-label={group}>
   <h2 className={styles.sectionHead}>{group}</h2>
   <div className={styles.grid}>{activeApps(group).map(tile)}</div>
  </section>)}</div>
  <details className={styles.retired}>
   <summary>Herramientas que ya no se usan desde aquí <span>Sus trabajos guardados siguen disponibles</span></summary>
   <ul>{RETIRED_APPS.map(app=><li key={app.slug}>
    <div className="min-w-0"><p className="font-semibold">{app.title}</p><p className="text-sm text-muted-foreground">{"home" in app?app.home:""}</p></div>
    <ButtonLink variant="ghost" href={`/admin/apps/${app.slug}`} aria-label={`Ver trabajos guardados de ${app.title}`}>Ver trabajos guardados</ButtonLink>
   </li>)}</ul>
  </details>
 </div>;
}
