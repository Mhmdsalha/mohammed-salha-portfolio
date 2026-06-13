export function DashboardHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--neon)]">
          Dashboard
        </p>
        <h1 className="mt-3 font-duran text-4xl font-black text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
