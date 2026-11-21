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
  chip: "border border-ink text-ink hover:bg-ink hover:text-paper motion-safe:transition-colors motion-safe:duration-300 motion-safe:ease-[ease]"
};

// Paddings from Main.dc.html: bordered pills are 1px shorter so all md pills share one height.
const SIZES: Record<Size, Record<Variant, string>> = {
  sm: { accent: "px-3 py-1 text-xs", outline: "px-3 py-1 text-xs", chip: "px-3 py-1 text-xs" },
  md: {
    accent: "px-3.5 py-1.5 text-[13px]",
    outline: "px-3.5 py-[5px] text-[13px]",
    chip: "px-[11px] py-[5px] text-[13px]"
  }
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
        SIZES[size][variant],
        className
      )}
    >
      {children}
    </span>
  );
}
