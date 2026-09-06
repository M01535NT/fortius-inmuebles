"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { usePublicFeatures } from "@/components/providers/public-features-provider";

const subscribe = () => () => {};
const ready = () => true;
const notReady = () => false;

/** Native controls stay inert in SSR and until React owns submission (including Enter). */
export function PublicLeadForm({ children, onSubmit, ...props }: Omit<ComponentProps<"form">, "action" | "method">) {
  const hydrated = useSyncExternalStore(subscribe, ready, notReady);
  const { publicLeadsEnabled } = usePublicFeatures();
  const enabled = hydrated && publicLeadsEnabled;
  return (
    <form {...props} method="post" action="/api/public/leads" onSubmit={(event) => {
      event.preventDefault();
      if (enabled) return onSubmit?.(event);
    }}>
      <fieldset disabled={!enabled} className="min-w-0 border-0 p-0">
        <div hidden aria-hidden="true">
          <label>
            Sitio web
            <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
        {children}
      </fieldset>
      {!publicLeadsEnabled ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          Recepción de solicitudes no disponible en este momento.
        </p>
      ) : null}
      <noscript>
        <p className="mt-3 text-sm text-muted-foreground">
          {publicLeadsEnabled
            ? "Activa JavaScript para enviar este formulario. No se ha enviado ninguna solicitud."
            : "Recepción de solicitudes no disponible en este momento. No se ha enviado ninguna solicitud."}
        </p>
      </noscript>
    </form>
  );
}
