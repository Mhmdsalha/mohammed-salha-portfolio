// P2-2 primitives: markup, accessibility and the reduced-motion / RTL hooks they rely on.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/Button";
import { LineReveal } from "@/components/ui/LineReveal";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { DURATION } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Button", () => {
  it("renders a link with href and a type=button button without", () => {
    expect(html(<Button href="/ar#featured">Go</Button>)).toMatch(/^<a [^>]*href="\/ar#featured"/);
    expect(html(<Button>Go</Button>)).toMatch(/^<button type="button"/);
    expect(html(<Button type="submit">Go</Button>)).toMatch(/^<button type="submit"/);
  });

  it("keeps a 44px+ touch target at every size", () => {
    expect(html(<Button size="sm">x</Button>)).toContain("min-h-11");
    expect(html(<Button size="md">x</Button>)).toContain("min-h-12");
    expect(html(<Button size="lg">x</Button>)).toContain("min-h-[54px]");
  });

  it("declares hover movement only when motion is allowed (behaviour is checked in e2e)", () => {
    const markup = html(<Button icon="arrow">x</Button>);
    expect(markup).toContain("motion-safe:hover:-translate-y-[3px]");
    expect(markup).not.toMatch(/(?<!motion-safe:)hover:-translate-y/);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("rtl:-scale-x-100");
    expect(markup).toContain("motion-safe:ltr:group-hover:translate-x-1");
    expect(markup).toContain("motion-safe:rtl:group-hover:-translate-x-1");
    expect(markup).not.toMatch(/(?<!motion-safe:)(?:ltr|rtl):group-hover:/);
  });

  it("uses the design's paddings and border widths", () => {
    expect(html(<Button variant="ghost">x</Button>)).toContain("px-[26px]");
    expect(html(<Button variant="ghost">x</Button>)).toContain("border-[1.5px]");
    expect(
      html(
        <Button variant="ghost" size="sm">
          x
        </Button>
      )
    ).toMatch(/px-3\.5[^"]* border(?![-\w])/);
    expect(html(<Button>x</Button>)).toContain("px-7");
  });

  it("puts the download icon before the label and the arrow after it", () => {
    expect(html(<Button icon="download">CV</Button>)).toMatch(/<svg[\s\S]*<\/svg>CV/);
    expect(html(<Button icon="arrow">Next</Button>)).toMatch(/Next<svg/);
  });
});

describe("Tag", () => {
  it("isolates its text direction (R15)", () => {
    expect(html(<Tag>Next.js</Tag>)).toMatch(/^<span dir="auto"/);
  });
});

describe("SectionHeader", () => {
  it("renders the numbered eyebrow, the heading and the outlined words", () => {
    const markup = html(
      <SectionHeader
        index="01"
        eyebrow="أبرز الأعمال"
        title="المشاريع"
        outlined="الرئيسية"
        id="featured-title"
      />
    );
    expect(markup).toContain("<bdi>01</bdi> — أبرز الأعمال");
    expect(markup).toMatch(
      /<h2 id="featured-title"[^>]*>المشاريع <span class="text-outline">الرئيسية<\/span><\/h2>/
    );
    expect(markup).toContain("reveal-on-scroll");
  });

  it("uses the light outline on the dark block and supports other heading levels", () => {
    const markup = html(
      <SectionHeader index="04" eyebrow="e" title="t" outlined="o" tone="dark" as="h3" />
    );
    expect(markup).toContain('<span class="text-outline-light">o</span>');
    expect(markup).toMatch(/^<header[\s\S]*<h3/);
  });
});

describe("LineReveal", () => {
  const markup = html(
    <LineReveal lines={[{ text: "مهندس حاسوب" }, { text: "ومطوّر Full-Stack", outlined: true }]} />
  );

  it("renders one clipped line per entry with staggered delays", () => {
    expect(markup.match(/overflow-hidden/g)).toHaveLength(2);
    expect(markup).toContain("animation-delay:350ms");
    expect(markup).toContain("animation-delay:500ms");
  });

  it("keeps the words apart for screen readers and outlines the second line", () => {
    expect(markup.replace(/<[^>]+>/g, "")).toBe("مهندس حاسوب ومطوّر Full-Stack");
    expect(markup).toMatch(/text-outline"[^>]*>ومطوّر/);
  });

  it("stops the animation under reduced motion", () => {
    expect(markup).toContain("motion-reduce:animate-none");
  });
});

describe("Reveal", () => {
  it("is CSS only and keeps the chosen element", () => {
    expect(html(<Reveal as="section">x</Reveal>)).toBe(
      '<section class="reveal-on-scroll">x</section>'
    );
  });
});

describe("Marquee", () => {
  const markup = html(<Marquee items={["Next.js", "React"]} label="Stack" pauseLabel="Pause" />);

  it("is always left-to-right and has a pausing hook for hover, focus and the control", () => {
    expect(markup).toMatch(/^<div dir="ltr"/);
    expect(markup).toContain("group-hover:[animation-play-state:paused]");
    expect(markup).toContain("group-has-[input:checked]:[animation-play-state:paused]");
    expect(markup).toContain("motion-reduce:animate-none");
  });

  it("exposes the items once to screen readers, with a labelled pause checkbox", () => {
    expect(markup.match(/<ul/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="Stack"');
    expect(markup.match(/<ul[^>]*aria-hidden="true"/g)).toHaveLength(1);
    // First copy: the first run is readable, its repeat is hidden.
    const firstCopy = markup.slice(markup.indexOf('aria-label="Stack"'), markup.indexOf("</ul>"));
    expect(firstCopy.match(/<li>[^<]+<\/li>/g)).toEqual(["<li>Next.js</li>", "<li>React</li>"]);
    expect(firstCopy.match(/<li aria-hidden="true">(Next\.js|React)<\/li>/g)).toHaveLength(2);
    expect(markup).toMatch(
      /<label[\s\S]*<input type="checkbox"[\s\S]*<span class="sr-only">Pause<\/span>/
    );
  });
});

describe("motion", () => {
  it("assumes reduced motion on the server, so nothing autoplays before hydration", () => {
    function Probe() {
      return <span>{String(usePrefersReducedMotion())}</span>;
    }
    expect(html(<Probe />)).toBe("<span>true</span>");
  });

  it("matches the CSS durations", () => {
    expect(DURATION.carousel).toBe(6500);
    expect(DURATION.marquee).toBe(30_000);
  });
});
