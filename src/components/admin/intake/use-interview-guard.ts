"use client";
import * as React from "react";
import { confirmAction } from "@/components/admin/workspace/confirm";
export function useInterviewGuard(dirty: boolean, busy: boolean) {
  const allow = React.useRef(false),
    pending = React.useRef(false);
  React.useEffect(() => {
    if (!dirty && !busy) return;
    const unload = (e: BeforeUnloadEvent) => {
      if (!allow.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !a ||
        e.defaultPrevented ||
        allow.current ||
        a.target === "_blank" ||
        a.getAttribute("href")?.startsWith("#")
      )
        return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (pending.current) return;
      pending.current = true;
      void (async () => {
        try {
          if (busy) return;
          if (
            await confirmAction(
              "Hay respuestas sin guardar. ¿Salir y descartarlas?",
            )
          ) {
            allow.current = true;
            window.location.assign(a.href);
          }
        } finally {
          pending.current = false;
        }
      })();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty, busy]);
  return allow;
}
