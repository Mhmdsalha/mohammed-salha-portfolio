import clsx from "clsx";
import { Fragment } from "react";

type MarqueeProps = {
  items: string[];
  /** Accessible name for the list, e.g. "التقنيات". */
  label: string;
  className?: string;
};

function Copy({ items, hidden, label }: { items: string[]; hidden?: boolean; label?: string }) {
  return (
    <ul
      className="flex shrink-0 items-center gap-11 pr-11"
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : label}
    >
      {items.map((item) => (
        <Fragment key={item}>
          <li>{item}</li>
          <li aria-hidden="true" className="text-accent">
            ✦
          </li>
        </Fragment>
      ))}
    </ul>
  );
}

/**
 * Full-bleed band of stack names that scrolls sideways (SPEC §4 marquee). Pure CSS.
 * Always left-to-right, whatever the page direction, so it moves the same way in /ar and /en.
 * Two identical copies loop seamlessly; the second is hidden from screen readers. Pauses on hover
 * and when anything inside has focus; reduced motion shows a still band. `overflow-hidden` keeps
 * the moving track from causing horizontal page scroll (R4).
 */
export function Marquee({ items, label, className }: MarqueeProps) {
  return (
    <div dir="ltr" className={clsx("group overflow-hidden bg-ink py-[22px] text-paper", className)}>
      <div
        className={clsx(
          "flex w-max animate-marquee font-display text-marquee font-extrabold whitespace-nowrap",
          "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
          "motion-reduce:animate-none"
        )}
      >
        <Copy items={items} label={label} />
        <Copy items={items} hidden />
      </div>
    </div>
  );
}
