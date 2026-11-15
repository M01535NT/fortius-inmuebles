"use client";
import * as React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ExternalLink, Link2, Route, Search, ShieldCheck } from "@/components/admin/icons";
import { SELLER_ISR_RULES } from "@/data/financial-rules";
import { APP_GROUPS, RETIRED_APPS, activeApps, appHref, type AppGroup } from "@/lib/apps/catalog";
import { matchesQuery } from "@/lib/admin/commands";
import { ButtonLink, Kbd } from "@/components/admin/kit";
import { ADMIN_ENTRY, ADMIN_NAV, MAIN_NAV } from "@/components/admin/workspace/guided-nav";
import { useSession } from "@/lib/admin/store";
import { AppIcon } from "./app-icon";
import styles from "./catalog.module.css";

/*
  Herramientas como lanzador (LV-10f, sistema combinado aprobado el 14/11/2026; reemplaza el «sin
  buscador» de C45): arriba un buscador grande que filtra herramientas y secciones mientras se
  escribe, las últimas que se abrieron en este navegador y, abajo, el panel de tres columnas de la
  dirección B (Documentos · Calcular · Presentar y publicar). Se maneja completo con teclado: las
  flechas recorren lo que se ve, Enter abre, Escape borra la búsqueda. Las secciones que aparecen son
  las del menú de cada quien (Administración solo para el administrador).
*/

type Entry = { key: string; href: string; title: string; text: string; icon: ReactNode };

/* Lo que no es una app del catálogo pero se abre desde aquí: la opinión de valor sin operación y
   el alta de un inmueble de otra inmobiliaria (PUB-02, RP-95), con su autorización escrita, y los
   trámites por pasos (TRA-01). */
const EXTRA: Record<AppGroup, Entry[]> = {
  Documentos: [{ key: "opinion", href: "/admin/apps/documentos?formato=07", title: "Opinión de valor", text: "Con los datos que dé el cliente, sin abrir una operación.", icon: <Building2 size={18} strokeWidth={1.6} aria-hidden="true" /> },
    // TRA-01: trámites aparte de la venta, por pasos; también en el menú lateral (14/11/2026).
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

/* Recientes de este navegador: es una comodidad de la pantalla, no un dato del panel. */
const RECENT_KEY = "fortius.herramientas.recientes.v1";
const crudo = () => { try { return localStorage.getItem(RECENT_KEY) ?? "[]"; } catch { return "[]"; } };
const leerRecientes = (raw = crudo()): string[] => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 4) : []; } catch { return []; } };
const anotarReciente = (href: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...leerRecientes().filter(x => x !== href)].slice(0, 4))); } catch { /* sin almacenamiento, sin recientes */ } };
const suscribir = (cambio: () => void) => { window.addEventListener("storage", cambio); return () => window.removeEventListener("storage", cambio); };

/** «Administración» junto al título de la pantalla, solo para el administrador. */
export function CatalogActions() {
  const session = useSession();
  return session?.role === "admin" ? <ButtonLink href={ADMIN_NAV[0].href}><ShieldCheck size={16} aria-hidden="true" />Administración</ButtonLink> : null;
}

export function AppsCatalog() {
  const router = useRouter();
  const session = useSession();
  const [query, setQuery] = React.useState("");
  const raw = React.useSyncExternalStore(suscribir, crudo, () => "[]");
  const recientes = React.useMemo(() => leerRecientes(raw), [raw]);
  const zona = React.useRef<HTMLDivElement>(null);
  const entries = (group: AppGroup): Entry[] => {
    const apps = activeApps(group).map(app => ({ key: app.slug, href: appHref(app.slug), title: app.title, text: app.description, icon: <AppIcon name={app.icon} /> }));
    // La opinión de valor va junto a Documentos sueltos; lo demás, al final de su grupo.
    return group === "Documentos" ? [apps[0], ...EXTRA[group], ...apps.slice(1)].filter(Boolean) : [...apps, ...EXTRA[group]];
  };
  const grupos = APP_GROUPS.map(group => ({ group, items: entries(group).filter(entry => matchesQuery(`${entry.title} ${entry.text} ${GROUP_TITLE[group]}`, query)) }));
  const todas = APP_GROUPS.flatMap(group => entries(group));
  const secciones = [...MAIN_NAV.filter(item => item.href !== "/admin"), ...(session?.role === "admin" ? [ADMIN_ENTRY] : [])]
    .filter(item => matchesQuery(item.label, query));
  const recent = recientes.map(href => todas.find(entry => entry.href === href)).filter((entry): entry is Entry => !!entry);
  const hay = grupos.some(g => g.items.length) || secciones.length > 0;

  // Las flechas recorren todo lo que se puede abrir en el lanzador, en el orden en que se ve.
  const destinos = () => [...(zona.current?.querySelectorAll<HTMLAnchorElement>("a[data-lanzador]") ?? [])];
  function mover(event: React.KeyboardEvent) {
    const lista = destinos();
    if (!lista.length) return;
    const i = lista.indexOf(document.activeElement as HTMLAnchorElement);
    const ir = (n: number) => { event.preventDefault(); lista[(n + lista.length) % lista.length].focus(); };
    if (event.key === "ArrowDown") ir(i + 1);
    else if (event.key === "ArrowUp") { if (i <= 0) { event.preventDefault(); zona.current?.querySelector<HTMLInputElement>("input")?.focus(); } else ir(i - 1); }
    else if (event.key === "Home" && i >= 0) ir(0);
    else if (event.key === "End" && i >= 0) ir(lista.length - 1);
  }
  function enBuscador(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && query) { event.preventDefault(); event.stopPropagation(); setQuery(""); return; }
    if (event.key === "Enter") {
      const primero = destinos().find(a => !a.closest("[data-recientes]"));
      if (primero) { event.preventDefault(); const href = primero.getAttribute("href")!; anotarReciente(href); router.push(href); }
      return;
    }
    // Sin stopPropagation la flecha llegaría también al contenedor y saltaría al segundo destino.
    if (event.key === "ArrowDown") { const primero = destinos()[0]; if (primero) { event.preventDefault(); event.stopPropagation(); primero.focus(); } }
  }

  return <div ref={zona} className="flex flex-col gap-6" onKeyDown={mover}>
    <div className={styles.launch}>
      <label className={styles.big}>
        <Search size={22} aria-hidden="true" />
        <span className="sr-only">Buscar herramienta o sección</span>
        <input type="search" autoComplete="off" placeholder="Busca «hipoteca», «reportes»…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={enBuscador} aria-describedby="lanzador-ayuda" />
      </label>
      <p id="lanzador-ayuda" className={styles.help}><span><Kbd>↑ ↓</Kbd> recorre</span><span><Kbd>Enter</Kbd> abre</span><span><Kbd>Esc</Kbd> borra</span><span><Kbd>Ctrl K</Kbd> busca en todo el panel</span></p>
      {!query && recent.length > 0 && <nav aria-label="Abiertas hace poco" className={styles.chips} data-recientes>
        <span className={styles.chipsLabel}>Recientes</span>
        {recent.map(entry => <Link key={entry.href} href={entry.href} data-lanzador className={styles.chip} onClick={() => anotarReciente(entry.href)}><span className={styles.chipIcon}>{entry.icon}</span>{entry.title}</Link>)}
      </nav>}
    </div>
    {!hay ? <p className={styles.none} role="status">Nada coincide con «{query.trim()}». Prueba con otra palabra o busca en todo el panel con Ctrl K.</p>
      : <>
        {grupos.some(g => g.items.length) && <div className={styles.panel}>
          {grupos.filter(g => g.items.length).map(({ group, items }) => <section key={group} className={styles.column} aria-labelledby={`grupo-${group}`}>
            <h2 id={`grupo-${group}`} className={styles.columnHead}>{GROUP_TITLE[group]}</h2>
            <ul className={styles.items}>{items.map(entry => <li key={entry.key}>
              <Link href={entry.href} data-lanzador className={styles.item} onClick={() => anotarReciente(entry.href)}>
                <span className={styles.icon}>{entry.icon}</span>
                <span className={styles.itemBody}><strong>{entry.title}</strong><span>{entry.text}</span></span>
              </Link>
            </li>)}</ul>
          </section>)}
        </div>}
        {secciones.length > 0 && <nav aria-label="Secciones del panel" className={styles.chips}>
          <span className={styles.chipsLabel}>También</span>
          {secciones.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} data-lanzador className={styles.chip}><span className={styles.chipIcon}><Icon size={16} aria-hidden /></span>{item.label}</Link>; })}
        </nav>}
      </>}
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
