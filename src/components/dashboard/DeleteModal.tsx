import { GlassCard } from "@/components/ui/GlassCard";

export function DeleteModal() {
  return (
    <GlassCard className="hidden p-6" aria-hidden="true">
      <p className="font-semibold text-white">Are you sure?</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        This placeholder documents the intended delete confirmation modal pattern.
      </p>
    </GlassCard>
  );
}
