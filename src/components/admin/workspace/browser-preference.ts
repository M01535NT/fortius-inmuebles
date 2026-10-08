"use client";
import * as React from "react";
const memory = new Map<string, string>();
const eventName = "fortius-workspace-preference";
export function useBrowserPreference<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => T,
  kind: "local" | "session" = "local",
) {
  const memoryKey = `${kind}:${key}`;
  const read = React.useCallback(() => {
    try {
      return (
        memory.get(memoryKey) ??
        (kind === "local" ? localStorage : sessionStorage).getItem(key) ??
        ""
      );
    } catch {
      return memory.get(memoryKey) ?? "";
    }
  }, [key, kind, memoryKey]);
  const subscribe = React.useCallback((notify: () => void) => {
    window.addEventListener(eventName, notify);
    window.addEventListener("storage", notify);
    return () => {
      window.removeEventListener(eventName, notify);
      window.removeEventListener("storage", notify);
    };
  }, []);
  const raw = React.useSyncExternalStore(subscribe, read, () => "");
  const value = React.useMemo(() => {
    try {
      return raw ? validate(JSON.parse(raw)) : fallback;
    } catch {
      return fallback;
    }
  }, [raw, validate, fallback]);
  function save(next: T) {
    const text = JSON.stringify(next);
    let persisted = true;
    try {
      (kind === "local" ? localStorage : sessionStorage).setItem(key, text);
      memory.delete(memoryKey);
    } catch {
      memory.set(memoryKey, text);
      persisted = false;
    }
    window.dispatchEvent(new Event(eventName));
    return persisted;
  }
  return [value, save] as const;
}
