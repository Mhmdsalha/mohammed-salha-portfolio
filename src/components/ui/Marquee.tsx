import clsx from "clsx";
import { Fragment } from "react";

type MarqueeProps = {
  items: string[];
  /** Accessible name for the list, e.g. "التقنيات". */
  label: string;
  /** Accessible name for the pause control, e.g. "إيقاف الحركة" / "Pause animation". */
  pauseLabel: string;
  /**
   * How many times the items repeat inside each copy. Each copy must be wider than the screen
   * for the loop to stay seamless: 2 covers about 3,800px with the design's 7 items.
   */
  repeat?: number;
  className?: string;
};

function Copy({
  items,
  repeat,
  hidden,
  label
}: {
  items: string[];
  repeat: number;
  hidden?: boolean;
  label?: string;
}) {
  const run = Array.from({ length: repeat }, () => items).flat();
  return (
    <ul
      className="flex shrink-0 items-center gap-11 pr-11"
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : label}
    >
      {run.map((item, i) => (
        <Fragment key={i}>
          {/* Screen readers get the list once; the repeats are for the eye only. */}
          <li aria-hidden={i >= items.length || undefined}>{item}</li>
          <li aria-hidden="true" className="text-accent">
            ✦
          </li>
        </Fragment>
      ))}
    </ul>
  );
}

/**
 * Full-bleed band of stack names that scrolls sideways (SPEC §4 marquee). Pure CSS, no JS.
 * - Always left-to-right, whatever the page direction, so it moves the same way in /ar and /en.
 * - Two identical copies loop seamlessly at -50%; the second is hidden from screen readers.
 * - Pauses on hover, on focus inside, and with the pause control: a real checkbox styled as a
 *   44px button, reachable by keyboard and touch (WCAG 2.2.2). The control is hidden under reduced
 *   motion, where the band does not move at all.
 * - `overflow-hidden` keeps the moving track from causing horizontal page scroll (R4).
 */
export function Marquee({ items, label, pauseLabel, repeat = 2, className }: MarqueeProps) {
  return (
    <div
      dir="ltr"
      className={clsx("group relative overflow-hidden bg-ink py-[22px] text-paper", className)}
    >
      <div
        className={clsx(
          "flex w-max animate-marquee font-display text-marquee font-extrabold whitespace-nowrap",
          "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
          "group-has-[input:checked]:[animation-play-state:paused]",
          "motion-reduce:animate-none"
        )}
      >
        <Copy items={items} repeat={repeat} label={label} />
        <Copy items={items} repeat={repeat} hidden />
      </div>

      <label
        className={clsx(
          "absolute inset-y-0 right-gutter my-auto flex size-11 cursor-pointer items-center justify-center",
          "rounded-full border border-paper/40 bg-ink text-paper",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
          "motion-reduce:hidden"
        )}
      >
        <input type="checkbox" className="peer sr-only" />
        <span className="sr-only">{pauseLabel}</span>
        {/* Pause bars while playing, a play triangle once paused. */}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4 fill-current peer-checked:hidden"
        >
          <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="hidden size-4 fill-current peer-checked:block"
        >
          <path d="M8 5l11 7-11 7z" />
        </svg>
      </label>
    </div>
  );
}
