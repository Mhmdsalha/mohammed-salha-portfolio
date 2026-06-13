import { clsx } from "clsx";

export function SectionLabel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={clsx(
        "mb-5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[var(--neon)]",
        className
      )}
    >
      {children}
    </p>
  );
}
