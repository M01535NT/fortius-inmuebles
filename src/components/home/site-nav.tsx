"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Phone } from "lucide-react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { publicContact } from "@/lib/public-contact";
import styles from "./site-nav.module.css";

/* Una sola barra para todo el sitio (boceto 2): blanca con línea inferior. En
   la portada flota sobre la foto hasta que se desplaza la página. El menú
   desplegable conserva el resto de las rutas. */
const LINKS: { href: string; label: string; wide?: boolean; match?: string[] }[] = [
  { href: "/inventario", label: "Propiedades" },
  { href: "/comprar-propiedad", label: "Comprar" },
  { href: "/vender-propiedad", label: "Vender" },
  { href: "/herramientas", label: "Herramientas", match: ["/opinion-de-valor"] },
  { href: "/nosotros", label: "Nosotros" },
];

function isCurrent(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuReady, setMenuReady] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);
  const { settings } = usePublicFeatures();
  const contact = publicContact(settings);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  /* El panel /admin trae su propio shell: sin nav público. */
  if (pathname.startsWith("/admin")) return null;

  const solid = pathname !== "/" || scrolled;
  const openMenu = () => { setMenuReady(true); setMenuOpen(true); };
  const menu = menuReady ? <FullscreenMenu open={menuOpen} onClose={closeMenu} /> : null;

  return (
    <>
    <header className={`${styles.header} ${solid ? styles.solid : styles.onImage}`}>
      <div className={styles.inner}>
        <Link href="/" aria-label="Fortius Inmuebles, inicio" className={styles.logo}><BrandMark inverse={!solid} /></Link>
        <nav aria-label="Principal" className={styles.nav}>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={[link.href, ...(link.match ?? [])].some((href) => isCurrent(pathname, href)) ? "page" : undefined}
              className={`${styles.link} ${link.wide ? styles.wide : ""}`}>{link.label}</Link>
          ))}
        </nav>
        <div className={styles.actions}>
          {contact.phoneHref && <a href={contact.phoneHref} aria-label={`Llamar al ${contact.phone}`} className={styles.phone}>
            <Phone size={18} strokeWidth={2} aria-hidden="true" /><span>{contact.phone}</span>
          </a>}
          <ThemeToggle className={styles.square} />
          <Link href="/contacto" className={styles.button}>Contacto</Link>
          <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
            className={`${styles.button} ${styles.menu}`}>
            Menú
            <span aria-hidden="true" className={styles.lines}><span /><span /></span>
          </button>
        </div>
      </div>
    </header>
    {/* Fuera del header: un transform crearía un containing block y rompería el position:fixed del overlay. */}
    {menu}
    </>
  );
}
