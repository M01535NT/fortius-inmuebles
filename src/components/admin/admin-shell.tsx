"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PenLine,
  Settings,
  StickyNote,
  Users,
  UsersRound,
} from "lucide-react";

import { ThemeToggle } from "@/components/home/theme-toggle";
import { btnPrimary, inputClass } from "@/components/admin/ui";
import { DEMO_PASSWORD, isLoggedIn, login, logout } from "@/lib/admin/store";

/*
  Shell del panel: guard de sesión (placeholder hasta Supabase Auth),
  sidebar de módulos y encabezado. Todo client-side: el panel opera sobre
  la capa local de datos (ver src/lib/admin/store.ts).
*/
const NAV = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2 },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/admin/notas", label: "Notas", icon: StickyNote },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/asesores", label: "Asesores", icon: UsersRound },
  { href: "/admin/archivos", label: "Archivos", icon: FolderOpen },
  { href: "/admin/contenido", label: "Contenido", icon: PenLine },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (login(password)) {
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5">
          <svg width="26" height="14" viewBox="0 0 26 14" fill="none" aria-hidden="true" className="text-primary">
            <path d="M1 1v12M25 1v12M1 7h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="display-title text-[19px] tracking-[0.04em] text-foreground">Cota</span>
          <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Panel
          </span>
        </div>

        <form onSubmit={onSubmit} className="mt-8 rounded-lg border border-border bg-card p-6">
          <h1 className="display-soft text-xl text-foreground">Acceso al panel</h1>
          <div className="mt-5 flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-[13px] font-medium text-foreground">
              Contraseña
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
              onChange={() => setError(false)}
            />
            {error ? (
              <p role="alert" className="text-[12.5px] text-destructive">
                Contraseña incorrecta.
              </p>
            ) : null}
          </div>
          <button type="submit" className={btnPrimary + " mt-5 w-full"}>
            Entrar
          </button>
          {/* Placeholder de auth: clave visible a propósito en la demo.
              TODO(M4): Supabase Auth con usuarios reales. */}
          <p className="mt-4 rounded-md bg-secondary px-3 py-2 font-mono text-[11.5px] text-muted-foreground">
            Demo: {DEMO_PASSWORD}
          </p>
        </form>
      </div>
    </main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /* null = aún no sabemos (SSR/primer render): no parpadear el login. */
  const [logged, setLogged] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopción única de sesión externa tras hidratar
    setLogged(isLoggedIn());
  }, []);

  if (logged === null) {
    return <main className="min-h-[100dvh] bg-background" aria-busy="true" />;
  }
  if (!logged) {
    return <LoginScreen onLogin={() => setLogged(true)} />;
  }

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-[228px] shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <svg width="22" height="12" viewBox="0 0 26 14" fill="none" aria-hidden="true" className="text-primary">
            <path d="M1 1v12M25 1v12M1 7h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="display-title text-[17px] tracking-[0.04em] text-foreground">Cota</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            Panel
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Módulos del panel">
          <ul className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors " +
                      (active
                        ? "bg-secondary text-foreground"
                        : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground")
                    }
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] text-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
            Ver sitio
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              setLogged(false);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13.5px] text-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <LogOut className="size-4" strokeWidth={1.5} />
            Salir
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-8">
          {/* Nav horizontal en mobile */}
          <nav className="flex items-center gap-1 overflow-x-auto md:hidden" aria-label="Módulos">
            {NAV.slice(0, 5).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-foreground/70 hover:bg-secondary"
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground md:block">
            <FileText className="mr-1.5 inline size-3.5 align-[-2px]" strokeWidth={1.5} />
            Datos locales · backend en M3/M4
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
