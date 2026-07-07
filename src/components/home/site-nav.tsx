"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "motion/react";

import { ThemeToggle } from "@/components/home/theme-toggle";

/*
  COTA wordmark. The tick-line-tick glyph is a dimension mark ("cota"),
  the annotation used on architectural plans to fix exact measurements.
*/
function Wordmark({ light }: { light: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="COTA, inicio">
      <svg
        width="26"
        height="14"
        viewBox="0 0 26 14"
        fill="none"
        aria-hidden="true"
        className={light ? "text-[#57e3b3]" : "text-primary"}
      >
        <path
          d="M1 1v12M25 1v12M1 7h24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={
          "display-title text-[19px] tracking-[0.04em] " +
          (light ? "text-[#f2f4ee]" : "text-foreground")
        }
      >
        Cota
      </span>
    </Link>
  );
}

const links = [
  { href: "/inventario", label: "Propiedades" },
  { href: "/#metodo", label: "Método" },
  { href: "/#entregables", label: "Entregables" },
  { href: "/herramientas", label: "Herramientas" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  /* Only the home hero is a dark full-bleed photo; there the nav floats
     with light text. Everywhere else (and after scroll) it is solid and
     adopts the theme tokens. */
  const solid = scrolled || pathname !== "/";
  const linkClass = solid
    ? "text-foreground/75 hover:text-foreground"
    : "text-[#f2f4ee]/80 hover:text-[#f2f4ee]";

  return (
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
        <Wordmark light={!solid} />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
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
          <ThemeToggle
            className={
              solid
                ? ""
                : "border-[#f2f4ee]/30 text-[#f2f4ee]/85 hover:bg-[#f2f4ee]/10 hover:text-[#f2f4ee]"
            }
          />
          <Link
            href="/#evaluar"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.97]"
          >
            Evaluar mi propiedad
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
