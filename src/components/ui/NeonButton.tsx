import Link from "next/link";
import { clsx } from "clsx";

type NeonButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

export function NeonButton({
  href,
  children,
  variant = "primary",
  className
}: NeonButtonProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "focus-ring group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full px-6 text-sm font-semibold transition duration-200",
        variant === "primary"
          ? "border border-[var(--border-neon)] bg-[rgba(0,245,255,0.08)] text-white shadow-[0_0_24px_rgba(0,245,255,0.12)] hover:-translate-y-0.5 hover:shadow-[0_0_34px_rgba(0,245,255,0.2)]"
          : "border border-[var(--border)] bg-white/[0.03] text-[var(--text-secondary)] hover:border-[var(--border-neon)] hover:text-white",
        className
      )}
    >
      {variant === "primary" ? (
        <span className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition group-hover:animate-[shimmer_900ms_ease]" />
      ) : null}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
