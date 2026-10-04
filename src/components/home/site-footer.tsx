"use client";

import { BrandMark } from "@/components/brand/brand-mark";
import Link from "next/link";
import { DocumentLink } from "@/components/navigation/document-link";
import { usePathname } from "next/navigation";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";
import { MessagingActions } from "@/components/contact/messaging-actions";

export function SiteFooter({ settings }: { settings?: SiteSettings | null }) {
  const pathname = usePathname();
  const contact = publicContact(settings);
  const name = "Mint Inmuebles";
  /* El panel /admin trae su propio shell: sin footer público (además el
     footer cortina interferiría con el layout del panel). */
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1280px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <Link href="/" aria-label="Inicio de Mint Inmuebles">
                <BrandMark />
              </Link>
            </div>
            <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
              Bienes raíces con método en Tijuana y Baja California.
            </p>
          </div>

          <nav className="md:col-span-3 md:col-start-7" aria-label="Secciones">
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Mercado inmobiliario
                </Link>
              </li>
              <li>
                <Link href="/inventario" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Propiedades
                </Link>
              </li>
              <li>
                <Link href="/#metodo" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Método
                </Link>
              </li>
              <li>
                <Link href="/#entregables" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Entregables
                </Link>
              </li>
              <li>
                <Link href="/#respuestas" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Respuestas
                </Link>
              </li>
              <li>
                <Link href="/herramientas" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Herramientas
                </Link>
              </li>
              <li>
                <Link href="/zonas" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Zonas
                </Link>
              </li>
              <li>
                <Link href="/#evaluar" className="inline-flex min-h-11 items-center text-foreground/75 transition-colors hover:text-foreground">
                  Evaluar mi propiedad
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-3">
            <MessagingActions settings={settings} className="mb-5" />
            <ul className="space-y-3 text-sm text-foreground/75">
              <li>{contact.whatsapp ? <a href={contact.whatsapp}>WhatsApp: {contact.whatsappLabel}</a> : "WhatsApp: por confirmar"}</li>
              <li>{contact.phoneHref ? <a href={contact.phoneHref}>Teléfono: {contact.phone}</a> : "Teléfono: por confirmar"}</li>
              <li>
                <Link href="/privacidad" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="inline-flex min-h-11 items-center transition-colors hover:text-foreground">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Los costos, impuestos y tiempos varían por operación y se confirman
            con el notario o el especialista correspondiente. © 2026 {name}.
          </p>
          <DocumentLink
            href="/admin"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Acceso al panel
          </DocumentLink>
        </div>
      </div>
    </footer>
  );
}
