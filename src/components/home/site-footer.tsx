import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1280px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5">
              <svg
                width="26"
                height="14"
                viewBox="0 0 26 14"
                fill="none"
                aria-hidden="true"
                className="text-primary"
              >
                <path
                  d="M1 1v12M25 1v12M1 7h24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="display-title text-[19px] tracking-[0.04em] text-foreground">
                Cota
              </span>
            </div>
            <p className="mt-4 max-w-[40ch] text-[14px] leading-relaxed text-muted-foreground">
              Bienes raíces con método en Tijuana y Baja California.
            </p>
          </div>

          <nav className="md:col-span-3 md:col-start-7" aria-label="Secciones">
            <ul className="space-y-3 text-[14px]">
              <li>
                <Link href="/inventario" className="text-foreground/75 transition-colors hover:text-foreground">
                  Propiedades
                </Link>
              </li>
              <li>
                <Link href="/#metodo" className="text-foreground/75 transition-colors hover:text-foreground">
                  Método
                </Link>
              </li>
              <li>
                <Link href="/#entregables" className="text-foreground/75 transition-colors hover:text-foreground">
                  Entregables
                </Link>
              </li>
              <li>
                <Link href="/#respuestas" className="text-foreground/75 transition-colors hover:text-foreground">
                  Respuestas
                </Link>
              </li>
              <li>
                <Link href="/herramientas" className="text-foreground/75 transition-colors hover:text-foreground">
                  Herramientas
                </Link>
              </li>
              <li>
                <Link href="/zonas" className="text-foreground/75 transition-colors hover:text-foreground">
                  Zonas
                </Link>
              </li>
              <li>
                <Link href="/#evaluar" className="text-foreground/75 transition-colors hover:text-foreground">
                  Evaluar mi propiedad
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-3">
            <ul className="space-y-3 text-[14px] text-foreground/75">
              {/* TODO: replace with real WhatsApp, phone and email. */}
              <li>WhatsApp: por confirmar</li>
              <li>Teléfono: por confirmar</li>
              <li>
                <Link href="/privacidad" className="transition-colors hover:text-foreground">
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="transition-colors hover:text-foreground">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Los costos, impuestos y tiempos varían por operación y se confirman
            con el notario o el especialista correspondiente. © 2026 Cota.
          </p>
        </div>
      </div>
    </footer>
  );
}
