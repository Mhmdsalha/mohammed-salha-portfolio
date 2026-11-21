// Motion presets (P2-2). Motion is CSS first (D-013): entrances, hovers, the marquee and scroll
// reveals are CSS animations from globals.css. This module holds the numbers JavaScript needs
// (carousel autoplay, clock). Server-safe: no hooks here; the reduced-motion hook for JavaScript
// timers is in ./use-reduced-motion.ts (client only, R13).
/** Durations in milliseconds, matching the --animate-* tokens in globals.css and SPEC.md §1. */
export const DURATION = {
  colour: 300,
  hover: 500,
  fadeUp: 900,
  lineRise: 1000,
  ruleDraw: 1200,
  /** Featured carousel: time per slide (P4-4). */
  carousel: 6500,
  /** Rotating role words: one full cycle (P4-2). */
  wordCycle: 10_000,
  marquee: 30_000,
  /** Gaza clock refresh (P4-3). */
  clockTick: 30_000
} as const;

/** Stagger between consecutive items, e.g. hero lines (SPEC §2). */
export const STAGGER = { line: 150, cell: 100, tile: 60 } as const;

/** CSS easing tokens (values live in globals.css @theme). */
export const EASE = {
  reveal: "var(--ease-reveal)",
  sweep: "var(--ease-sweep)",
  pop: "var(--ease-pop)"
} as const;

/** Delay for item `index` in a staggered sequence, as a CSS time value. */
export function staggerDelay(index: number, stepMs: number, startMs = 0): string {
  return `${startMs + index * stepMs}ms`;
}
