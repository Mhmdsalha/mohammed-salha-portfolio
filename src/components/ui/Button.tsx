import Link from "next/link";
import clsx from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowIcon, DownloadIcon } from "./Icon";

type Variant = "accent" | "ink" | "ghost";
type Size = "sm" | "md" | "lg";

type CommonProps = {
  variant?: Variant;
  /** sm 44px (header), md 48px (cards), lg 54px (hero). All meet the 44px touch target. */
  size?: Size;
  /** Trailing icon. "arrow" points in the reading direction and nudges forward on hover. */
  icon?: "arrow" | "download";
  children: ReactNode;
  className?: string;
};

type LinkProps = CommonProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className" | "children"
  >;
type NativeButtonProps = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

export type ButtonProps = LinkProps | NativeButtonProps;

// Movement is declared only under `motion-safe:`, so with reduced motion it does not exist at all
// (a motion-reduce: override can lose to a later direction rule; A7 review of P2-2).
const VARIANTS: Record<Variant, string> = {
  // Filled buttons lift and cast a shadow on hover (SPEC §2 `.btn`: .3s reveal easing).
  accent:
    "bg-accent text-on-accent hover:shadow-lift motion-safe:hover:-translate-y-[3px] motion-safe:transition-[translate,box-shadow] motion-safe:duration-300 motion-safe:ease-reveal",
  ink: "bg-ink text-paper hover:shadow-lift motion-safe:hover:-translate-y-[3px] motion-safe:transition-[translate,box-shadow] motion-safe:duration-300 motion-safe:ease-reveal",
  // Outlined buttons fill on hover (SPEC §2 `.ghost`: background and colour, .3s, default ease).
  ghost:
    "border-ink text-ink hover:bg-ink hover:text-paper motion-safe:transition-[background-color,color] motion-safe:duration-300 motion-safe:ease-[ease]"
};

// Paddings from Main.dc.html. Ghost buttons are 2px narrower to allow for their border.
const PADDING: Record<Variant, Record<Size, string>> = {
  accent: { sm: "px-[18px]", md: "px-[22px]", lg: "px-7" },
  ink: { sm: "px-[18px]", md: "px-[22px]", lg: "px-7" },
  ghost: { sm: "px-3.5", md: "px-[22px]", lg: "px-[26px]" }
};

const SIZES: Record<Size, string> = {
  sm: "min-h-11 gap-2 text-sm",
  md: "min-h-12 gap-2 text-[15px]",
  lg: "min-h-[54px] gap-2.5 text-base"
};

const ICON_SIZES: Record<Size, string> = { sm: "size-4", md: "size-4", lg: "size-[18px]" };

/** Pill button or link from the design (P2-2). Renders a Next.js <Link> when `href` is set. */
export function Button(props: ButtonProps) {
  const { variant = "accent", size = "lg", icon, children, className, ...rest } = props;

  const classes = clsx(
    "group inline-flex items-center justify-center rounded-full font-body font-semibold whitespace-nowrap",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
    VARIANTS[variant],
    PADDING[variant][size],
    SIZES[size],
    // The small ghost pill (header language switch) has a 1px border; the others 1.5px.
    variant === "ghost" && (size === "sm" ? "border" : "border-[1.5px]"),
    className
  );

  const iconNode =
    icon === "arrow" ? (
      <ArrowIcon
        className={clsx(
          ICON_SIZES[size],
          // Nudge 4px toward the line end: left in RTL, right in LTR (SPEC §2 `.bi`).
          "motion-safe:transition-[translate] motion-safe:duration-[400ms] motion-safe:ease-reveal",
          "motion-safe:ltr:group-hover:translate-x-1 motion-safe:rtl:group-hover:-translate-x-1"
        )}
      />
    ) : icon === "download" ? (
      <DownloadIcon className={ICON_SIZES[size]} />
    ) : null;

  // Download icon reads before the label (as in the header CV button); the arrow after it.
  const content =
    icon === "download" ? (
      <>
        {iconNode}
        {children}
      </>
    ) : (
      <>
        {children}
        {iconNode}
      </>
    );

  if (typeof rest.href === "string") {
    const { href, ...anchor } = rest as LinkProps;
    // Files (e.g. /cv.pdf) and downloads are plain links: <Link> would try to route to them as
    // pages and prefetch them.
    if (anchor.download !== undefined || /\.[a-z0-9]{2,5}$/i.test(href.split(/[?#]/)[0])) {
      return (
        <a href={href} className={classes} {...anchor}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchor}>
        {content}
      </Link>
    );
  }

  const { type = "button", ...button } = rest as NativeButtonProps;
  return (
    <button type={type} className={classes} {...button}>
      {content}
    </button>
  );
}
