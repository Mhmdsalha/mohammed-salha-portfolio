import clsx from "clsx";
import type { ReactNode } from "react";
import { STAGGER, staggerDelay } from "@/lib/motion";

type Line = { text: ReactNode; outlined?: boolean };

type LineRevealProps = {
  lines: Line[];
  as?: "h1" | "h2" | "p";
  /** Delay before the first line, in ms (the hero starts at 350). */
  startMs?: number;
  stepMs?: number;
  className?: string;
};

/**
 * Lines that rise out of a clip, one after another (SPEC §2 `rise`, hero h1). Pure CSS.
 * The clip box keeps 0.08em above and 0.14em below so Arabic ascenders and descenders are not cut
 * (R3). A space before each later line keeps the words apart for screen readers.
 * Reduced motion: no animation, lines are simply shown.
 */
export function LineReveal({
  lines,
  as: Component = "h1",
  startMs = 350,
  stepMs = STAGGER.line,
  className
}: LineRevealProps) {
  return (
    <Component className={clsx("font-display font-black", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pt-[0.08em] pb-[0.14em]">
          {i > 0 ? " " : null}
          <span
            className={clsx(
              "inline-block animate-line-rise motion-reduce:animate-none",
              line.outlined && "text-outline"
            )}
            style={{ animationDelay: staggerDelay(i, stepMs, startMs) }}
          >
            {line.text}
          </span>
        </span>
      ))}
    </Component>
  );
}
