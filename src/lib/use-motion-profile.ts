"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotionSafe } from "./use-reduced-motion-safe";

const COMPACT = "(max-width: 767px)";
const FINE = "(hover: hover) and (pointer: fine)";
function subscribe(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const compactSubscribe = (callback: () => void) => subscribe(COMPACT, callback);
const fineSubscribe = (callback: () => void) => subscribe(FINE, callback);
const serverSnapshot = () => false;

export function useMotionProfile() {
  const reduce = useReducedMotionSafe();
  const compact = useSyncExternalStore(compactSubscribe, () => window.matchMedia(COMPACT).matches, serverSnapshot);
  const fine = useSyncExternalStore(fineSubscribe, () => window.matchMedia(FINE).matches, serverSnapshot);
  return { reduce, compact, magnetic: fine && !reduce, parallax: reduce ? 0 : compact ? 8 : 18 };
}
