"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { ErrorNotice, Field, inputClass } from "@/components/admin/ui";
import { errorMessage, login } from "@/lib/admin/store";

/*
  Sesión vencida sin pérdida (RP-19, UX-04). La pantalla de trabajo sigue montada detrás (inerte
  mientras esta ventana está abierta) y se pide la contraseña encima. Si entra la misma persona,
  todo sigue donde estaba y basta volver a guardar; si entra otra, el panel se limpia como siempre.
  Escape no la cierra: sin sesión nada se puede guardar. «Salir» deja el panel sin guardar.
*/
export function SessionExpiredDialog({ email, onLeave }: { email: string; onLeave: () => Promise<void> }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    const node = dialog.current;
    // Sin showModal (navegadores viejos o pruebas) se abre igual; Escape sigue sin cerrarla.
    if (node && !node.open) { if (typeof node.showModal === "function") node.showModal(); else node.setAttribute("open", ""); }
    node?.querySelector<HTMLInputElement>("#session-expired-password")?.focus();
    return () => { if (node?.open) { if (typeof node.close === "function") node.close(); else node.removeAttribute("open"); } };
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true); setError(null);
    try { await login(email, password); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="admin-confirm" aria-labelledby="session-expired-title" aria-describedby="session-expired-text" onCancel={event => event.preventDefault()}>
    <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={busy}>
      <h2 id="session-expired-title" className="m-0 text-lg font-semibold">Tu sesión venció</h2>
      <p id="session-expired-text" className="m-0 text-sm">Entra de nuevo para seguir. Lo que capturaste sigue en pantalla; todavía no se guarda.</p>
      <Field label="Correo" htmlFor="session-expired-email">
        <input id="session-expired-email" type="email" value={email} readOnly autoComplete="username" className={inputClass} />
      </Field>
      <Field label="Contraseña" htmlFor="session-expired-password">
        <input id="session-expired-password" name="password" type="password" required maxLength={128} autoComplete="current-password" autoFocus className={inputClass} />
      </Field>
      <ErrorNotice error={error} />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" disabled={busy} onClick={() => void onLeave().catch(() => undefined)}>Salir sin guardar</Button>
        <Button variant="primary" type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar y seguir"}</Button>
      </div>
    </form>
  </dialog>;
}
