"use client";
import * as React from "react";
import { BrandMark } from "@/components/brand/brand-mark";
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
  Menu,
} from "lucide-react";
import { ThemeToggle } from "@/components/home/theme-toggle";
import {
  AsyncForm,
  AsyncButton,
  ErrorNotice,
  Field,
  btnPrimary,
  btnGhost,
  inputClass,
} from "@/components/admin/ui";
import {
  acceptPasswordLink,
  adminStores,
  changePassword,
  errorMessage,
  isLoggedIn,
  loadAdminData,
  login,
  logout,
  recoverPassword,
  useSession,
} from "@/lib/admin/store";
const NAV = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/propiedades", label: "Inmuebles", icon: Building2 },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/admin/notas", label: "Notas", icon: StickyNote },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/asesores", label: "Asesores", icon: UsersRound },
  { href: "/admin/archivos", label: "Archivos", icon: FolderOpen },
  { href: "/admin/contenido", label: "Contenido", icon: PenLine },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function LoginScreen({
  onLogin,
  onPasswordReady,
  passwordMode,
  error: initialError,
}: {
  onLogin: () => void;
  onPasswordReady: () => void;
  passwordMode: boolean;
  error: string | null;
}) {
  const [recovery, setRecovery] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Panel
          </span>
        </div>
        <AsyncForm
          className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6"
          onSubmit={async (e) => {
            const data = new FormData(e.currentTarget);
            if (passwordMode) {
              const password = String(data.get("password"));
              if (password !== data.get("confirm"))
                throw new Error("Las contraseñas no coinciden.");
              await changePassword(password);
              onPasswordReady();
            } else if (recovery) {
              await recoverPassword(String(data.get("email")));
              setSent(true);
            } else {
              await login(
                String(data.get("email")),
                String(data.get("password")),
              );
              onLogin();
            }
          }}
        >
          <h1 className="display-soft text-xl text-foreground">
            {passwordMode
              ? "Establecer contraseña"
              : recovery
                ? "Recuperar acceso"
                : "Acceso al panel"}
          </h1>
          <ErrorNotice error={initialError} />
          {!passwordMode ? (
            <Field label="Correo" htmlFor="admin-email">
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className={inputClass}
              />
            </Field>
          ) : null}
          {!recovery || passwordMode ? (
            <Field
              label={passwordMode ? "Nueva contraseña" : "Contraseña"}
              htmlFor="admin-password"
              hint={passwordMode ? "Entre 12 y 128 caracteres." : undefined}
            >
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                minLength={passwordMode ? 12 : undefined}
                maxLength={128}
                autoComplete={
                  passwordMode ? "new-password" : "current-password"
                }
                className={inputClass}
              />
            </Field>
          ) : null}
          {passwordMode ? (
            <Field label="Confirmar contraseña" htmlFor="admin-confirm">
              <input
                id="admin-confirm"
                name="confirm"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                className={inputClass}
              />
            </Field>
          ) : null}
          <button type="submit" className={btnPrimary + " w-full"}>
            {passwordMode
              ? "Guardar contraseña"
              : recovery
                ? "Enviar enlace"
                : "Entrar"}
          </button>
          {sent ? (
            <p role="status" className="text-sm text-primary">
              Si el correo tiene acceso, recibirá un enlace de recuperación.
            </p>
          ) : null}
          {!passwordMode ? (
            <button
              type="button"
              className={btnGhost + " w-full"}
              onClick={() => {
                setRecovery(!recovery);
                setSent(false);
              }}
            >
              {recovery ? "Volver al acceso" : "Olvidé mi contraseña"}
            </button>
          ) : null}
        </AsyncForm>
      </div>
    </main>
  );
}
const subscribeCollections = (cb: () => void) => {
  const unsubscribe = adminStores.map((store) => store.subscribe(cb));
  return () => unsubscribe.forEach((stop) => stop());
};
const collectionError = () =>
  adminStores.map((store) => store.state().error).find(Boolean) ?? null;
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useSession();
  const sessionId = session?.id;
  const [checking, setChecking] = React.useState(true);
  const [passwordMode, setPasswordMode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const refreshError = React.useSyncExternalStore(
    subscribeCollections,
    collectionError,
    () => null,
  );
  const [ready, setReady] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const boot = React.useRef<Promise<boolean> | null>(null);
  async function refresh() {
    setRefreshing(true);
    try {
      await loadAdminData();
      setReady(true);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }
  React.useEffect(() => {
    let live = true;
    // StrictMode mounts reuse the one-shot callback; secrets are consumed once.
    boot.current ??= (async () => {
      const linked = await acceptPasswordLink();
      if (!linked) await isLoggedIn();
      return linked;
    })();
    void boot.current
      .then((linked) => {
        if (live) setPasswordMode(linked);
      })
      .catch((e) => {
        if (live) setError(errorMessage(e));
      })
      .finally(() => {
        if (live) setChecking(false);
      });
    return () => {
      live = false;
    };
  }, []);
  React.useEffect(() => {
    if (!sessionId || passwordMode) return;
    let active = true;
    const refreshData = async () => {
      setRefreshing(true);
      try {
        await loadAdminData();
        if (active) {
          setReady(true);
          setError(null);
        }
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setRefreshing(false);
      }
    };
    void refreshData();
    const focus = async () => {
      try {
        if (await isLoggedIn()) await refreshData();
      } catch (e) {
        if (active) setError(errorMessage(e));
      }
    };
    window.addEventListener("focus", focus);
    return () => {
      active = false;
      window.removeEventListener("focus", focus);
    };
  }, [sessionId, passwordMode]); // same user's refreshed session doesn't discard drafts
  async function leave() {
    setReady(false);
    try {
      await logout();
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    }
  }
  if (checking)
    return (
      <main className="min-h-[100dvh] bg-background p-8" aria-busy="true">
        <p role="status">Verificando acceso…</p>
      </main>
    );
  if (!session || passwordMode)
    return (
      <LoginScreen
        passwordMode={passwordMode}
        error={error}
        onLogin={() => {
          setError(null);
          setReady(false);
        }}
        onPasswordReady={() => {
          setPasswordMode(false);
          setError(null);
          setReady(false);
        }}
      />
    );
  const links = (mobile = false) => (
    <>
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMenu(false)}
          aria-current={
            (href === "/admin" ? pathname === href : pathname.startsWith(href))
              ? "page"
              : undefined
          }
          className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium text-foreground/70 transition-colors hover:bg-secondary aria-[current=page]:bg-secondary"
        >
          <Icon className="size-4 shrink-0" strokeWidth={1.5} />
          {label}
        </Link>
      ))}
      {mobile ? (
        <>
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 px-3 text-sm"
          >
            <ExternalLink className="size-4" />
            Ver sitio
          </Link>
          <AsyncButton type="button" onClick={leave} className={btnGhost}>
            <LogOut className="size-4" />
            Salir
          </AsyncButton>
        </>
      ) : null}
    </>
  );
  return (
    <div className="flex min-h-[100dvh] bg-background [&_button]:min-h-11 [&_button]:min-w-11 [&_select]:min-h-11">
      <aside className="sticky top-0 hidden h-[100dvh] w-[228px] shrink-0 flex-col border-r border-border md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <BrandMark />
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            Panel
          </span>
        </div>
        <nav
          className="flex-1 overflow-y-auto p-3"
          aria-label="Módulos del panel"
        >
          {links()}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 px-3 text-sm"
          >
            <ExternalLink className="size-4" />
            Ver sitio
          </Link>
          <AsyncButton
            type="button"
            onClick={leave}
            className={btnGhost + " w-full"}
          >
            <LogOut className="size-4" />
            Salir
          </AsyncButton>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-5 md:px-8">
            <button
              type="button"
              className={btnGhost + " md:hidden"}
              aria-label="Menú del panel"
              aria-expanded={menu}
              aria-controls="admin-mobile-nav"
              onClick={() => setMenu(!menu)}
            >
              <Menu className="size-4" />
              Módulos
            </button>
            <p className="hidden font-mono text-[11px] text-muted-foreground md:block">
              <FileText className="mr-1.5 inline size-3.5" />
              {session.email} ·{" "}
              {refreshing ? "Actualizando…" : "Conexión al servidor"}
            </p>
            <ThemeToggle />
          </div>
          {menu ? (
            <nav
              id="admin-mobile-nav"
              aria-label="Módulos móviles"
              className="max-h-[75dvh] space-y-1 overflow-y-auto border-t border-border p-3 md:hidden"
            >
              {links(true)}
            </nav>
          ) : null}
        </header>
        <main className="space-y-5 p-5 md:p-8">
          {error || refreshError ? (
            <div className="space-y-2">
              <ErrorNotice error={error ?? refreshError} />
              <AsyncButton onClick={refresh} className={btnGhost}>
                Reintentar carga
              </AsyncButton>
            </div>
          ) : null}
          {!ready ? (
            <p role="status" aria-busy={refreshing}>
              Cargando datos del panel…
            </p>
          ) : (
            <>
              <span className="sr-only">
                {adminStores.length} colecciones del servidor
              </span>
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
