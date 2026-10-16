"use client";
import * as React from "react";
// Same-route quick actions should work even when their query is already present.
// The key names the action (prospecto, tarea, visita), not the route, so tabs can share a route.
export type QuickCreateKey = "prospecto" | "tarea" | "visita";
export function useQuickCreate(key: QuickCreateKey, create: () => void) {
  React.useEffect(() => {
    const receive = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) create();
    };
    window.addEventListener("fortius:quick-create", receive);
    return () => window.removeEventListener("fortius:quick-create", receive);
  }, [key, create]);
}
