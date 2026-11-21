import clsx from "clsx";
import type { ElementType, ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

/**
 * Rises in as it scrolls into view (SPEC §2 `.sr`). Pure CSS, no JavaScript: it uses
 * `animation-timeline: view()` where supported and the visitor allows motion; elsewhere the
 * content is just visible. Never wrap the LCP element in this (R6).
 */
export function Reveal({ as: Component = "div", children, className }: RevealProps) {
  return <Component className={clsx("reveal-on-scroll", className)}>{children}</Component>;
}
