"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, ExternalLink, Link2, Route, ShieldCheck } from "@/components/admin/icons";
import { SELLER_ISR_RULES } from "@/data/financial-rules";
import { APP_GROUPS, RETIRED_APPS, activeApps, appHref, type AppGroup } from "@/lib/apps/catalog";
import { ButtonLink } from "@/components/admin/kit";
import { ADMIN_NAV } from "@/components/admin/workspace/guided-nav";
import { useSession } from "@/lib/admin/store";
import { AppIcon } from "./app-icon";
import styles from "./catalog.module.css";

/*
  Herramientas (dirección B del boceto «Más», elegida por el titular el 14/11/2026): un solo panel
  con tres columnas (Documentos · Calcular · Presentar y publicar); cada herramienta aparece una
  vez, con su ícono pequeño y una línea de explicación. Sin tarjetas por herramienta, sin buscador,
  filtros, contador ni estrellas (C45). Los antiguos accesos directos se integraron a su grupo:
  «Machotes en blanco» es la vista «En blanco» de Documentos sueltos e «ISR y neto» ya estaba en
  Calcular. Las ligas útiles y los trabajos de herramientas retiradas van discretos al pie.
*/

type Entry = { key: string; href: string; title: string; text: string; icon: ReactNode };

/* Lo que no es una app del catálogo pero se abre desde aquí: la opinión de valor sin operación y
   el alta de un inmueble de otra inmobiliaria (PUB-02, RP-95), con su autorización escrita, y los
   trámites por pasos (TRA-01). */
const EXTRA: Record<AppGroup, Entry[]> = {
  Documentos: [{ key: "opinion", href: "/admin/apps/documentos?formato=07", title: "Opinión de valor", text: "Con los datos que dé el cliente, sin abrir una operación.", icon: <Building2 size={18} strokeWidth={1.6} aria-hidden="true" /> },
    // TRA-01: trámites aparte de la venta, por pasos; también en la barra superior (14/11/2026).
    { key: "tramites", href: "/admin/tramites", title: "Trámites", text: "Cancelación de hipoteca paso a paso, con documentos, notas y el avance para el propietario.", icon: <Route size={18} strokeWidth={1.6} aria-hidden="true" /> }],
  Calcular: [],
  Presentar: [{ key: "compartido", href: "/admin/propiedades/nueva?origen=compartido", title: "Inmueble compartido", text: "De otra inmobiliaria, con su autorización para publicarlo.", icon: <Link2 size={18} strokeWidth={1.6} aria-hidden="true" /> }],
};
const GROUP_TITLE: Record<AppGroup, string> = { Documentos: "Documentos", Calcular: "Calcular", Presentar: "Presentar y publicar" };

/*
  Ligas útiles (revisión del 12/11/2026): sitios oficiales que se consultan a mitad de un cálculo y
  las calculadoras del sitio público para mandarlas al cliente. Falta la de Nuvigant (H-06): no se
  conoce su dirección.
*/
const USEFUL_LINKS = [
  { href: SELLER_ISR_RULES.udiUrl, title: "Valor de la UDI", text: "Banxico. Para la exención de casa habitación en «ISR y neto»." },
  { href: SELLER_ISR_RULES.inpcUrl, title: "INPC", text: "INEGI. Para actualizar el costo de compra en «ISR y neto»." },
  { href: "https://portalmx.infonavit.org.mx/", title: "Infonavit", text: "Portal oficial; ahí el comprador consulta su precalificación y su simulador." },
  { href: "/herramientas/hipoteca", title: "Hipoteca del sitio", text: "La calculadora pública, para mandarla al cliente." },
  { href: "/herramientas/gastos-de-cierre", title: "Gastos de cierre del sitio", text: "La calculadora pública, para mandarla al cliente." },
] as const;

/** «Administración» junto al título de la pantalla, solo para el administrador. */
export function CatalogActions() {
  const session = useSession();
  return session?.role === "admin" ? <ButtonLink href={ADMIN_NAV[0].href}><ShieldCheck size={16} aria-hidden="true" />Administración</ButtonLink> : null;
}

export function AppsCatalog() {
  const entries = (group: AppGroup): Entry[] => {
    const apps = activeApps(group).map(app => ({ key: app.slug, href: appHref(app.slug), title: app.title, text: app.description, icon: <AppIcon name={app.icon} /> }));
    // La opinión de valor va junto a Documentos sueltos; lo demás, al final de su grupo.
    return group === "Documentos" ? [apps[0], ...EXTRA[group], ...apps.slice(1)].filter(Boolean) : [...apps, ...EXTRA[group]];
  };
  return <div className="flex flex-col gap-6">
    <div className={styles.panel} data-tour="herramientas-grupos">
      {APP_GROUPS.map(group => <section key={group} className={styles.column} aria-labelledby={`grupo-${group}`}>
        <h2 id={`grupo-${group}`} className={styles.columnHead}>{GROUP_TITLE[group]}</h2>
        <ul className={styles.items}>{entries(group).map(entry => <li key={entry.key}>
          <Link href={entry.href} className={styles.item}>
            <span className={styles.icon}>{entry.icon}</span>
            <span className={styles.itemBody}><strong>{entry.title}</strong><span>{entry.text}</span></span>
          </Link>
        </li>)}</ul>
      </section>)}
    </div>
    <footer className={styles.footer}>
      <section aria-labelledby="ligas-utiles" className={styles.links}>
        <h2 id="ligas-utiles">Ligas útiles</h2>
        <ul>{USEFUL_LINKS.map(link => <li key={link.href}>
          <a href={link.href} target="_blank" rel="noreferrer">{link.title}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (se abre en otra pestaña)</span></a>
        </li>)}</ul>
      </section>
      <details className={styles.retired}>
        <summary>Trabajos de herramientas retiradas</summary>
        <ul>{RETIRED_APPS.map(app => <li key={app.slug}>
          <div className="min-w-0"><p className="font-semibold">{app.title}</p><p className="text-sm text-muted-foreground">{"home" in app ? app.home : ""}</p></div>
          <ButtonLink variant="ghost" href={`/admin/apps/${app.slug}`} aria-label={`Ver trabajos guardados de ${app.title}`}>Ver trabajos guardados</ButtonLink>
        </li>)}</ul>
      </details>
    </footer>
  </div>;
}
