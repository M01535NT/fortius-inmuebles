"use client";
import * as React from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { usePathname } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Breadcrumbs } from "@/components/admin/workspace/breadcrumbs";
import { useBrowserPreference } from "@/components/admin/workspace/browser-preference";
import { loadWorkspace, workspaceStores } from "@/lib/admin/workspace-loading";
import { WorkspaceSearch } from "@/components/admin/workspace/search";
import { GuidedSidebar, MobileHeader, MobileMenu, MobileTabBar, Topbar } from "@/components/admin/workspace/guided-nav";
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
  login,
  logout,
  recoverPassword,
  useSession,
} from "@/lib/admin/store";

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
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="ml-1 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Panel
          </span>
        </div>
        <AsyncForm
          className="admin-login-card mt-8 space-y-4 rounded-lg border border-border bg-card p-6"
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
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={passwordMode ? 12 : undefined}
                  maxLength={128}
                  autoComplete={
                    passwordMode ? "new-password" : "current-password"
                  }
                  className={inputClass + " pr-12"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-controls="admin-password"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
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
            <p role="status" className="text-sm text-primary-ink">
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
                setShowPassword(false);
              }}
            >
              {recovery ? "Volver al acceso" : "Olvidé mi contraseña"}
            </button>
          ) : null}
        </AsyncForm>
        <DocumentLink href="/" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-primary-ink underline-offset-4 hover:underline">
          Volver al sitio
        </DocumentLink>
      </div>
    </main>
  );
}
const subscribeCollections = (cb: () => void) => {
  const unsubscribe = adminStores.map((store) => store.subscribe(cb));
  return () => unsubscribe.forEach((stop) => stop());
};
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const session = useSession();
  const sessionId = session?.id;
  const [density] = useBrowserPreference(`fortius:density:${sessionId}`, "comfortable", value => value === "compact" ? "compact" : "comfortable");
  const [checking, setChecking] = React.useState(true);
  const [passwordMode, setPasswordMode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const refreshError = React.useSyncExternalStore(
    subscribeCollections,
    () => workspaceStores(pathname).map(store => store.state().error).find(Boolean) ?? null,
    () => null,
  );
  const [ready, setReady] = React.useState(false);
  const [loadedPath, setLoadedPath] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const menuTrigger = React.useRef<HTMLButtonElement>(null);
  const mobileNav = React.useRef<HTMLElement>(null);
  const boot = React.useRef<Promise<boolean> | null>(null);
  React.useEffect(() => {
    if (!menu) return;
    mobileNav.current?.querySelector<HTMLAnchorElement>("a[href]")?.focus();
    const closeOutside = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && !mobileNav.current?.contains(target) && !menuTrigger.current?.contains(target)) {
        setMenu(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenu(false);
      menuTrigger.current?.focus();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
    };
  }, [menu]);
  async function refresh() {
    setRefreshing(true);
    try {
      await loadWorkspace(pathname);
      setReady(true);
          setLoadedPath(pathname);
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
        await loadWorkspace(pathname);
        if (active) {
          setReady(true);
          setLoadedPath(pathname);
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
  }, [sessionId, passwordMode, pathname]); // same user's refreshed session doesn't discard drafts
  async function leave() {
    try {for(const key of Object.keys(sessionStorage))if(key.startsWith(`fortius:property-draft:${sessionId}:`))sessionStorage.removeItem(key);}catch{}
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
  const name = session.name || session.email.split("@")[0];
  const user = { name, email: session.email, initials: name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase(), avatar: session.avatar };
  // Nueva operación ocupa toda la pantalla: sin menú, migas ni barra inferior; se sale con la ×.
  const focus = pathname === "/admin/operaciones/nueva";
  return (
    <div data-density={density} className="admin-workspace flex min-h-[100dvh] bg-background [&_button]:min-h-11 [&_button]:min-w-11 [&_select]:min-h-11">
      {!focus && <GuidedSidebar pathname={pathname} role={session.role} user={user} onLogout={leave} />}
      <div className="flex min-w-0 flex-1 flex-col">
        {!focus && <MobileHeader user={user} search={<WorkspaceSearch />} />}
        <span role="status" className="sr-only">{refreshing ? "Actualizando…" : error || refreshError ? "Revisar conexión" : "Panel disponible"}</span>
        <main className={focus ? "admin-content admin-focus flex-1" : "admin-content flex-1 space-y-5"}>
          {!focus && <Topbar search={<WorkspaceSearch variant="field" />} />}
          {!focus && <Breadcrumbs />}
          {error || refreshError ? (
            <div className="space-y-2">
              <ErrorNotice error={error ?? refreshError} />
              <AsyncButton onClick={refresh} className={btnGhost}>
                Reintentar carga
              </AsyncButton>
            </div>
          ) : null}
          {!ready || loadedPath !== pathname ? (
            <p role="status" aria-busy={refreshing}>
              {error || refreshError ? "No se pudo cargar este módulo. Puedes reintentar o abrir otro desde el menú." : "Cargando módulo…"}
            </p>
          ) : (
            children
          )}
        </main>
      </div>
      {menu && !focus && <MobileMenu panel={mobileNav} pathname={pathname} role={session.role} user={user} onNavigate={() => setMenu(false)} onLogout={leave} />}
      {!focus && <MobileTabBar pathname={pathname} menuOpen={menu} menuButton={menuTrigger} onMenu={() => setMenu(open => !open)} />}
    </div>
  );
}
