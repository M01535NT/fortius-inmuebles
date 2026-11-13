"use client";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, FileDown, Link2, ShieldCheck, Wallet } from "@/components/admin/icons";
import { SELLER_ISR_RULES } from "@/data/financial-rules";
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
  { href: "/admin/apps/neto-propietario", title: "ISR y neto", text: "Cuánto le queda al propietario al precio sugerido, con el ISR estimado.", Icon: Wallet },
  // PUB-02 (RP-95): alta de un inmueble de otra inmobiliaria, con su autorización escrita.
  { href: "/admin/propiedades/nueva?origen=compartido", title: "Inmueble compartido", text: "De otra inmobiliaria, con su autorización para publicarlo.", Icon: Link2 },
] as const;

/*
  Ligas útiles (revisión del 12/11/2026): sitios oficiales que se consultan a mitad de un cálculo y
  las calculadoras del sitio público para mandarlas al cliente. Falta la de Nuvigant (H-06): no se
  conoce su dirección.
*/
const USEFUL_LINKS = [
  { href: SELLER_ISR_RULES.udiUrl, title: "Valor de la UDI", text: "Banxico. Para la exención de casa habitación en «ISR y neto»." },
  { href: SELLER_ISR_RULES.inpcUrl, title: "INPC", text: "INEGI. Para actualizar el costo de compra en «ISR y neto»." },
  { href: "https://portalmx.infonavit.org.mx/", title: "Infonavit", text: "Portal oficial; ahí el comprador consulta su precalificación y su simulador." },
  { href: "/herramientas/hipoteca", title: "Calculadora de hipoteca del sitio", text: "La versión pública, para mandarla al cliente." },
  { href: "/herramientas/gastos-de-cierre", title: "Gastos de cierre del sitio", text: "La versión pública, para mandarla al cliente." },
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
  <section aria-labelledby="ligas-utiles" className={styles.section}>
   <h2 id="ligas-utiles" className={styles.sectionHead}>Ligas útiles</h2>
   <ul className={styles.links}>{USEFUL_LINKS.map(link=><li key={link.href}>
    <a href={link.href} target="_blank" rel="noreferrer">
     <span className="min-w-0"><strong>{link.title}</strong><span>{link.text}</span></span>
     <ExternalLink size={16} aria-hidden="true"/><span className="sr-only">(se abre en otra pestaña)</span>
    </a>
   </li>)}</ul>
  </section>
  <details className={styles.retired}>
   <summary>Herramientas que ya no se usan desde aquí <span>Sus trabajos guardados siguen disponibles</span></summary>
   <ul>{RETIRED_APPS.map(app=><li key={app.slug}>
    <div className="min-w-0"><p className="font-semibold">{app.title}</p><p className="text-sm text-muted-foreground">{"home" in app?app.home:""}</p></div>
    <ButtonLink variant="ghost" href={`/admin/apps/${app.slug}`} aria-label={`Ver trabajos guardados de ${app.title}`}>Ver trabajos guardados</ButtonLink>
   </li>)}</ul>
  </details>
 </div>;
}
