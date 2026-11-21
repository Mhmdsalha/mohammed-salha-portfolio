import clsx from "clsx";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  /** Section number shown before the eyebrow, e.g. "01". */
  index: string;
  /** Eyebrow label, e.g. "أبرز الأعمال". */
  eyebrow: ReactNode;
  /** Solid part of the title. */
  title: ReactNode;
  /** Optional outlined continuation of the title (SPEC §4, e.g. "المشاريع الرئيسية"). */
  outlined?: ReactNode;
  /** Right-hand slot (inline-end): counter and arrows, a short intro, a count. */
  aside?: ReactNode;
  /** id for the heading, so the section can use aria-labelledby. */
  id?: string;
  as?: "h1" | "h2" | "h3";
  /** "dark" is for the ink education block: light eyebrow and outline. */
  tone?: "light" | "dark";
  className?: string;
};

/** Numbered section heading with optional outlined words and an aside (P2-2). */
export function SectionHeader({
  index,
  eyebrow,
  title,
  outlined,
  aside,
  id,
  as: Heading = "h2",
  tone = "light",
  className
}: SectionHeaderProps) {
  return (
    <header
      className={clsx("flex flex-wrap items-end justify-between gap-5 reveal-on-scroll", className)}
    >
      <div className="min-w-0">
        <p
          className={clsx(
            "mb-2.5 font-label text-sm",
            tone === "dark" ? "text-paper" : "text-accent"
          )}
        >
          <bdi>{index}</bdi> — {eyebrow}
        </p>
        <Heading id={id} className="font-display text-section font-black">
          {title}
          {outlined ? (
            <>
              {" "}
              <span className={tone === "dark" ? "text-outline-light" : "text-outline"}>
                {outlined}
              </span>
            </>
          ) : null}
        </Heading>
      </div>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </header>
  );
}
