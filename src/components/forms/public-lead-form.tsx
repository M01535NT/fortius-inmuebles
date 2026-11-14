"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { AdminApiError } from "@/lib/admin/store";

/*
  El servidor rechaza un teléfono de menos de 7 dígitos con un aviso genérico («Hay datos que no
  son válidos»), sin decir cuál. Se revisa antes de enviar: marca el campo y lleva el foco ahí.
*/
export function revisarTelefono(form: HTMLFormElement, name: string): string | null {
  const input = form.elements.namedItem(name);
  if (!(input instanceof HTMLInputElement)) return null;
  if (input.value.replace(/\D/g, "").length >= 7) {
    input.removeAttribute("aria-invalid");
    return null;
  }
  input.setAttribute("aria-invalid", "true");
  input.focus();
  return "Revisa el teléfono: escribe al menos 7 dígitos, con lada.";
}

/** Los avisos del servidor para datos, tamaño, límite de intentos o recepción cerrada sí orientan; los demás no. */
export function mensajeDeEnvio(error: unknown, alterno: string): string {
  return error instanceof AdminApiError && [400, 413, 429, 503].includes(error.status) ? error.message : alterno;
}

/** Lleva el foco al aviso de «Recibimos tu solicitud» cuando aparece (el formulario ya no existe). */
export const enfocarAlMontar = (element: HTMLElement | null) => element?.focus();

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
