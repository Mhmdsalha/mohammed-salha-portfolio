import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export function LivePreviewFrame({
  title,
  liveUrl
}: {
  title: string;
  liveUrl: string | null;
}) {
  if (!liveUrl) {
    return (
      <GlassCard className="flex min-h-[420px] items-center justify-center p-8 text-center">
        <div>
          <p className="font-duran text-3xl font-black text-white">No live URL yet</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Add a live URL in the dashboard to display the project here.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/12 bg-[#050505] shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-0 z-10 rounded-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-[#0b0b0b]/95 px-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="min-w-0 flex-1 truncate rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-center font-mono text-[11px] text-white/55">
          {liveUrl}
        </p>
        <Link
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:text-white"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">Open</span>
        </Link>
      </div>
      <div className="relative h-[62vh] min-h-[420px] bg-white md:h-[72vh]">
        <iframe
          title={`${title} live preview`}
          src={liveUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          className="absolute inset-0 h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
