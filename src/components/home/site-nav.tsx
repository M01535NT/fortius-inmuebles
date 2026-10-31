"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { BrandMark } from "@/components/brand/brand-mark";
import styles from "./site-nav.module.css";

/*
  Barra pública (30/10/2026): cinco enlaces y el botón Menú; sin WhatsApp ni «Quiero vender»
  por decisión del titular. Blanca con línea inferior; en la portada flota sobre el video
  hasta que se desplaza la página. El menú desplegable guarda el resto de las rutas y
  el cambio de tema; el tema también vive en el pie.
*/
const LINKS: { href: string; label: string; match?: string[] }[] = [
  { href: "/vender-propiedad", label: "Vender", match: ["/opinion-de-valor"] },
  { href: "/comprar-propiedad", label: "Comprar" },
  { href: "/inventario", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/blog", label: "Blog" },
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
              className={styles.link}>{link.label}</Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
            className={styles.menu}>
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
