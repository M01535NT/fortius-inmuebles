"use client";
import * as React from "react";
// Same-route quick actions should work even when their query is already present.
export function useQuickCreate(path: string, create: () => void) {
  React.useEffect(() => {
    const receive = (event: Event) => {
      if ((event as CustomEvent<string>).detail === path) create();
    };
    window.addEventListener("fortius:quick-create", receive);
    return () => window.removeEventListener("fortius:quick-create", receive);
  }, [path, create]);
}
