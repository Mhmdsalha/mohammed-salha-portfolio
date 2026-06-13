import { clsx } from "clsx";

export function TagPill({
  children,
  active = false,
  className
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] leading-none",
        active
          ? "border-[var(--border-neon)] bg-[rgba(0,245,255,0.12)] text-white"
          : "border-[var(--border)] bg-white/[0.03] text-[var(--text-secondary)]",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--neon)] shadow-[0_0_12px_rgba(0,245,255,0.8)]" />
      {children}
    </span>
  );
}
