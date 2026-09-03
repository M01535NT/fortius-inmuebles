"use client";

import { useSyncExternalStore, type ComponentProps } from "react";

const subscribe = () => () => {};
const ready = () => true;
const notReady = () => false;

/** Native controls stay inert in SSR and until React owns submission (including Enter). */
export function PublicLeadForm({ children, onSubmit, ...props }: Omit<ComponentProps<"form">, "action" | "method">) {
  const hydrated = useSyncExternalStore(subscribe, ready, notReady);
  return (
    <form {...props} method="post" action="/api/leads" onSubmit={(event) => {
      event.preventDefault();
      if (hydrated) return onSubmit?.(event);
    }}>
      <fieldset disabled={!hydrated} className="min-w-0 border-0 p-0">
        <div hidden aria-hidden="true">
          <label>
            Sitio web
            <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        {children}
      </fieldset>
      <noscript>
        <p className="mt-3 text-sm text-muted-foreground">Activa JavaScript para enviar este formulario. No se ha enviado ninguna solicitud.</p>
      </noscript>
    </form>
  );
}
