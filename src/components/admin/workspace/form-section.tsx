"use client";
import * as React from "react";
export function revealSection(element: HTMLElement | null) {
  const details = element?.closest("details");
  if (details) details.open = true;
  element?.focus({ preventScroll: true });
  element?.scrollIntoView({ block: "start" });
}
/** Sección plegable del formulario; «collapsed» la deja cerrada al abrir (lo que no siempre se llena). */
export function FormSection({ children, collapsed = false, ...props }: React.HTMLAttributes<HTMLDetailsElement> & { collapsed?: boolean; "data-tab"?: string }) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  const parts = React.Children.toArray(children);
  React.useEffect(() => {
    if (ref.current) ref.current.open = !collapsed && (props.id === "pf-basicos" || !window.matchMedia?.("(max-width: 767px)").matches);
  }, [props.id, collapsed]);
  return <details {...props} role="region" ref={ref} open className={"admin-form-section " + (props.className ?? "")}><summary>{parts[0]}</summary>{parts.slice(1)}</details>;
}
