import { clsx } from "clsx";
import Image from "next/image";

export function ProjectVisual({
  title,
  imageUrl,
  featured = false
}: {
  title: string;
  imageUrl?: string | null;
  featured?: boolean;
}) {
  if (imageUrl && featured) {
    return (
      <div className="overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${title} live preview`}
          className="block h-auto w-full"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(0,245,255,0.2),transparent_28%),linear-gradient(135deg,#071113,#0a0a0a_55%,#111)]",
        featured ? "aspect-[21/10]" : "aspect-[16/10]"
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${title} live preview`}
          fill
          quality={100}
          sizes={featured ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 768px) 100vw, 33vw"}
          className={clsx(
            "object-top transition duration-700",
            featured ? "object-contain" : "object-cover group-hover:scale-105"
          )}
        />
      ) : (
        <>
          <div className="absolute inset-6 rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex gap-2">
              <span className="size-2 rounded-full bg-red-400/70" />
              <span className="size-2 rounded-full bg-yellow-300/70" />
              <span className="size-2 rounded-full bg-emerald-300/70" />
            </div>
            <div className="mt-6 grid grid-cols-[0.7fr_1fr] gap-4">
              <div className="space-y-3">
                <div className="h-3 rounded-full bg-[rgba(0,245,255,0.45)]" />
                <div className="h-3 w-2/3 rounded-full bg-white/12" />
                <div className="h-20 rounded-xl border border-white/10 bg-white/[0.04]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[rgba(0,245,255,0.18)] bg-[rgba(0,245,255,0.08)]" />
                <div className="rounded-xl border border-white/10 bg-white/[0.05]" />
                <div className="col-span-2 h-16 rounded-xl border border-white/10 bg-white/[0.035]" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:26px_26px]" />
        </>
      )}
    </div>
  );
}
