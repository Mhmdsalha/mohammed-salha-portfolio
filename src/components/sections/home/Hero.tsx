import Image from "next/image";
import clsx from "clsx";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LineReveal } from "@/components/ui/LineReveal";
import type { Locale } from "@/types";

// P4-2: the hero from docs/design/SPEC.md §4.2. Server component; all motion is CSS and switches
// off under reduced motion. The portrait is the LCP element on mobile: it is preloaded with high
// priority and never starts transparent (V-1, R6).

const enter = "animate-fade-up motion-reduce:animate-none";

/** Latin runs inside Arabic lines stay whole and isolated (R15). */
const latin = (chunks: React.ReactNode) => <bdi className="whitespace-nowrap">{chunks}</bdi>;

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home.hero" });
  const words = t.raw("words") as string[];

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="flex flex-wrap-reverse items-center gap-[clamp(32px,5vw,64px)] pt-[clamp(40px,7vw,88px)] pb-[clamp(40px,5vw,64px)]"
    >
      <div className="min-w-0 flex-[1_1_520px]">
        <p
          className={clsx(
            "mb-6 flex flex-wrap items-center gap-2.5 text-[15px] font-semibold",
            enter
          )}
          style={{ animationDelay: "300ms" }}
        >
          <span
            aria-hidden="true"
            className="inline-block size-2.5 shrink-0 rounded-full bg-accent animate-dot-pulse motion-reduce:animate-none"
          />
          {t("availability")}
        </p>

        <LineReveal
          lines={[
            { text: t("titleLine1") },
            { text: t.rich("titleLine2", { latin }), outlined: true }
          ]}
          id="hero-title"
          className="text-hero"
          startMs={350}
          stepMs={150}
        />

        {/* Rotating role words: animated for the eye, one plain sentence for assistive tech. */}
        <p className="sr-only">{t("wordsSentence")}</p>
        <div
          aria-hidden="true"
          className={clsx(
            "mt-3.5 flex flex-wrap items-baseline gap-x-3.5 font-display text-rotator font-bold",
            enter
          )}
          style={{ animationDelay: "700ms" }}
        >
          <span>{t("builds")}</span>
          <span className="block h-[1.35em] overflow-hidden text-accent">
            <span className="flex flex-col animate-word-cycle motion-reduce:animate-none">
              {[...words, words[0]].map((word, i) => (
                <span key={i} className="h-[1.35em] leading-[1.35em] whitespace-nowrap">
                  {word}
                </span>
              ))}
            </span>
          </span>
        </div>

        <p
          className={clsx("mt-7 max-w-[600px] text-lead text-ink-2", enter)}
          style={{ animationDelay: "900ms" }}
        >
          {t("lead")}
        </p>

        <div
          className={clsx("mt-8 flex flex-wrap gap-3", enter)}
          style={{ animationDelay: "1050ms" }}
        >
          <Button href="#featured" icon="arrow">
            {t("ctaProjects")}
          </Button>
          {/* /cv.pdf is served once the dashboard CV upload exists (D5-5). */}
          <Button href="/cv.pdf" variant="ghost" download>
            {t("ctaCv")}
          </Button>
        </div>
      </div>

      <div className="flex flex-[1_1_380px] justify-center">
        <div
          data-hero-portrait
          className="relative aspect-square w-[clamp(280px,40vw,580px)] max-w-full"
        >
          {/* Rotating text ring and dashed ring: decoration only. Their square SVGs are clipped to a
              circle: while they turn, the corners would otherwise poke out and cause sideways
              scroll on small screens (R4). The ring's content lies inside the circle. */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-full">
            <svg
              viewBox="0 0 200 200"
              aria-hidden="true"
              className="absolute inset-0 size-full animate-ring-spin motion-reduce:animate-none"
            >
              <defs>
                <path
                  id={`hero-ring-${locale}`}
                  d="M100,100 m-91,0 a91,91 0 1,1 182,0 a91,91 0 1,1 -182,0"
                />
              </defs>
              {/* LTR base direction anchors the text at the path start; in an RTL page it would start at
                  the path end and run off it. Arabic words still read right-to-left (bidi). */}
              <text direction="ltr" className="fill-ink font-body text-[7.6px] font-semibold">
                <textPath href={`#hero-ring-${locale}`}>{t("ring")}</textPath>
              </text>
            </svg>
            <svg
              viewBox="0 0 200 200"
              aria-hidden="true"
              className="absolute inset-0 size-full animate-ring-spin-reverse motion-reduce:animate-none"
            >
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                className="stroke-ink"
                strokeWidth="0.6"
                strokeDasharray="2 5"
              />
            </svg>
          </div>

          {/* The circle clips the photo, so it can never spill outside at any width. */}
          <div
            data-hero-circle
            className="absolute inset-[11%] overflow-hidden rounded-full bg-accent shadow-portrait animate-portrait-in motion-reduce:animate-none"
          >
            <div aria-hidden="true" className="absolute inset-0 bg-dot-grid" />
            <Image
              src="/images/portrait.webp"
              alt={t("portraitAlt")}
              width={700}
              height={750}
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 70vw, 460px"
              className="absolute inset-x-0 bottom-0 mx-auto h-auto w-[88%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
