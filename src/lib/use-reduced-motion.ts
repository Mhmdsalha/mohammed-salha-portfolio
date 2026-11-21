"use client";

// Reduced-motion gate for JavaScript-driven motion (carousel autoplay, timers): R13. CSS motion is
// gated in CSS (motion-reduce: utilities and the global rule in globals.css).
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(QUERY).matches;
}

/**
 * True when the visitor asked for reduced motion. Gate every JavaScript-driven motion on it
 * (autoplay, timers that move content). On the server it returns `true`, so markup never assumes
 * motion and nothing autoplays until the client has confirmed it is allowed.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
