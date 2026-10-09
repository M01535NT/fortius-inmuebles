"use client";
import * as React from "react";
export function revealSection(element: HTMLElement | null) {
  const details = element?.closest("details");
  if (details) details.open = true;
  element?.focus({ preventScroll: true });
  element?.scrollIntoView({ block: "start" });
}
export function FormSection({ children, ...props }: React.HTMLAttributes<HTMLDetailsElement>) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  const parts = React.Children.toArray(children);
  React.useEffect(() => {
    if (ref.current) ref.current.open = props.id === "pf-basicos" || !window.matchMedia?.("(max-width: 767px)").matches;
  }, [props.id]);
  return <details {...props} role="region" ref={ref} open className={"admin-form-section " + (props.className ?? "")}><summary>{parts[0]}</summary>{parts.slice(1)}</details>;
}
