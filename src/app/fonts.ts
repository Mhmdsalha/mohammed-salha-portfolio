import { Alexandria, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";

// The three design families (docs/design/SPEC.md §1), self-hosted by next/font with metric-matched
// fallbacks, so swapping in the real font does not shift layout (CLS).
// preload is off until a P4 section uses each family: preloading now would make today's site
// download fonts it does not show. P4-2 turns it on for the hero's fonts (D-021).
// This file and globals.css are the only places allowed to name fonts (scripts/design-tokens.mjs).

export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-alexandria",
  display: "swap",
  preload: false
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
