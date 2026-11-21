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

const VARIANTS: Record<Variant, string> = {
  // Filled buttons lift on hover (SPEC §2 `.btn`).
  accent: "bg-accent text-on-accent hover:-translate-y-[3px] hover:shadow-lift",
  ink: "bg-ink text-paper hover:-translate-y-[3px] hover:shadow-lift",
  // Outlined buttons fill on hover (SPEC §2 `.ghost`).
  ghost: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-paper"
};

const SIZES: Record<Size, string> = {
  sm: "min-h-11 gap-2 px-[18px] text-sm",
  md: "min-h-12 gap-2 px-[22px] text-[15px]",
  lg: "min-h-[54px] gap-2.5 px-7 text-base"
};

const ICON_SIZES: Record<Size, string> = { sm: "size-4", md: "size-4", lg: "size-[18px]" };

/** Pill button or link from the design (P2-2). Renders a Next.js <Link> when `href` is set. */
export function Button(props: ButtonProps) {
  const { variant = "accent", size = "lg", icon, children, className, ...rest } = props;

  const classes = clsx(
    "group inline-flex items-center justify-center rounded-full font-body font-semibold whitespace-nowrap",
    "transition-[translate,box-shadow,background-color,color] duration-300 ease-reveal",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  const iconNode =
    icon === "arrow" ? (
      <ArrowIcon
        className={clsx(
          ICON_SIZES[size],
          "transition-[translate] duration-[400ms] ease-reveal motion-reduce:transition-none",
          "ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1",
          "motion-reduce:group-hover:translate-x-0"
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
