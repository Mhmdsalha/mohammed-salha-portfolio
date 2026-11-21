import { Alexandria, IBM_Plex_Mono, IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";

// The three design families (docs/design/SPEC.md §1), self-hosted by next/font with metric-matched
// fallbacks, so swapping in the real font does not shift layout (CLS).
// Preload (D-023): only Alexandria (one variable font, 2 files: title and rotating words). Plex
// Arabic has 4 weights x 2 subsets = 8 files (~220 KB); preloading them all would compete with
// the LCP on mobile, so it loads on demand with `swap` (text paints at once in the fallback).
// Next emits preload links only on routes that use these fonts, so the variables are applied by
// the new pages (preview, /dev/ui), not yet on <html>: the old live home page downloads none of
// them. P4-10 moves fontVariables to <html>.
// Note: on Windows builds Next 15.5 writes an empty next-font-manifest.json (it matches the
// loader path with "/" only), so local builds emit no font preloads at all; Linux builds (CI,
// Vercel) are unaffected.
// This file and globals.css are the only places allowed to name fonts (scripts/design-tokens.mjs).

export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-alexandria",
  display: "swap",
  preload: true
});

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false
});

/** Class names that define the three --font-* variables; apply once on <html>. */
export const fontVariables = [alexandria.variable, plexArabic.variable, plexMono.variable].join(
  " "
);

/**
 * The old site's and the dashboard's `font-mono` (Tailwind's --font-mono). Kept until P4-10 and
 * the D5 tickets replace those components.
 */
export const legacyMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});
