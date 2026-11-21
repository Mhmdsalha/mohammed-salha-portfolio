import clsx from "clsx";
import type { ReactNode } from "react";

type Variant = "accent" | "outline" | "chip";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // Project label pill ("مشروع تدريبي").
  accent: "bg-accent text-on-accent",
  // Kind pill and archive tag.
  outline: "border border-ink text-ink",
  // Stack chip: fills on hover (SPEC §2 `.chip`).
  chip: "border border-ink text-ink transition-colors duration-300 hover:bg-ink hover:text-paper motion-reduce:transition-none"
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-3.5 py-1.5 text-[13px]"
};

type TagProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

/**
 * Small pill for labels, kinds and stack names. `dir="auto"` isolates each tag's direction, so a
 * Latin stack name inside Arabic text (or the reverse) never reorders its neighbours (R15).
 */
export function Tag({ variant = "outline", size = "md", children, className }: TagProps) {
  return (
    <span
      dir="auto"
      className={clsx(
        "inline-flex items-center rounded-full font-body font-semibold leading-normal whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </span>
  );
}
