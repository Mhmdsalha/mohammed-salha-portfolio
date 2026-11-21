import clsx from "clsx";

type IconProps = { className?: string };

/**
 * Arrow pointing in the reading direction: right in LTR, mirrored to point left in RTL (R2).
 * Decorative: the surrounding link or button carries the accessible name.
 */
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
      className={clsx("shrink-0 rtl:-scale-x-100", className)}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Download arrow (not directional). Decorative. */
export function DownloadIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
      className={clsx("shrink-0", className)}
    >
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}
