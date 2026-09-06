"use client";

import * as React from "react";
import { Mail, Phone } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";
import { MessagingActions } from "@/components/contact/messaging-actions";

/*
  Dock de contacto rápido: aparece al hacer scroll en el detalle de propiedad
  (solo desktop; en mobile ya existe la barra fija inferior). Enlaces con
  datos de contacto públicos del panel; los pendientes no son enlaces activos.
*/
export function ContactDock({ settings, message }: { settings?: SiteSettings | null; message?: string }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const [visible, setVisible] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setVisible(v > 560);
  });

  const contact = publicContact(settings);
  const acciones = [
    { href: contact.phoneHref, label: "Llamar", icon: Phone },
    { href: contact.email ? `mailto:${contact.email}` : "", label: "Correo", icon: Mail },
  ];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-40 hidden items-center gap-1.5 rounded-lg border border-border bg-background/95 p-1.5 backdrop-blur md:flex"
        >
          <span className="px-2.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
            Contactar
          </span>
          <MessagingActions settings={settings} message={message} />
          {acciones.filter(({ href }) => Boolean(href)).map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href || undefined}
              aria-disabled={!href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={label}
              title={href ? label : `${label}: por confirmar`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.96]"
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </a>
          ))}
          <a
            href="#interes"
            className="ml-1 inline-flex h-10 items-center rounded-md bg-primary px-4 text-[13.5px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.97]"
          >
            Me interesa
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
