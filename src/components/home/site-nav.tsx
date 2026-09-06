"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight } from "lucide-react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";
import type { SiteSettings } from "@/lib/admin/store";

const links = [
  { href: "/inventario", label: "Propiedades" },
  { href: "/#metodo", label: "Método" },
  { href: "/#entregables", label: "Entregables" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/blog", label: "Blog" },
];

export function SiteNav(props: { settings?: SiteSettings | null }) {
  // Keep the caller contract while the identity is independent of stored labels.
  void props.settings;
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  /* El panel /admin trae su propio shell: sin nav público. */
  if (pathname.startsWith("/admin")) return null;

  /* Only the home hero is a dark full-bleed photo; there the nav floats
     with light text. Everywhere else (and after scroll) it is solid and
     adopts the theme tokens. */
  const solid = scrolled || pathname !== "/";
  const linkClass = solid
    ? "text-foreground/75 hover:text-foreground"
    : "text-[#f2f4ee]/80 hover:text-[#f2f4ee]";

  return (
    <>
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300 " +
        (solid
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent")
      }
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="MNT Inmuebles, inicio"><BrandMark inverse={!solid} /></Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={"text-[13.5px] font-medium transition-colors " + linkClass}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className={
              "hidden h-10 items-center gap-2 rounded-md border px-3.5 text-[13.5px] font-medium transition-[background-color,color,border-color,transform] active:scale-[0.97] md:inline-flex " +
              (solid
                ? "border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
                : "border-[#f2f4ee]/30 text-[#f2f4ee]/85 hover:bg-[#f2f4ee]/10 hover:text-[#f2f4ee]")
            }
          >
            Administración
            <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
          <ThemeToggle
            className={
              solid
                ? ""
                : "border-[#f2f4ee]/30 text-[#f2f4ee]/85 hover:bg-[#f2f4ee]/10 hover:text-[#f2f4ee]"
            }
          />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={
              "group inline-flex h-9 items-center gap-2.5 rounded-md border px-3.5 text-[13.5px] font-medium transition-colors active:scale-[0.97] " +
              (solid
                ? "border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
                : "border-[#f2f4ee]/30 text-[#f2f4ee]/85 hover:bg-[#f2f4ee]/10 hover:text-[#f2f4ee]")
            }
          >
            Menú
            {/* Indicador de menú. */}
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span className="h-px w-5 bg-current transition-transform duration-300 group-hover:scale-x-75" />
              <span className="h-px w-5 bg-current transition-transform duration-300 group-hover:scale-x-125" />
            </span>
          </button>
        </div>
      </div>
    </motion.header>

    {/* Fuera del header: su transform crearía un containing block y
        rompería el position:fixed del overlay. */}
    <FullscreenMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
