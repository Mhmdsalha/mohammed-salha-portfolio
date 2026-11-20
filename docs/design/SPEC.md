# Design spec — Editorial (CV version)

Source: [`editorial-cv/Main.dc.html`](editorial-cv/Main.dc.html), exported 2026-11-20 from the design canvas (artboard "أ — تحريري (نسخة السيرة الذاتية)", 1440 × 4100 preview). It is a **reference mockup**: replicate the values in our own tokens and components, do not copy the markup.

The export's runtime files (`support.js`, `vendor/react*.js`) were left out because ESLint lints them and fails `npm run lint`. To view the artboard, unzip the original export and serve the folder (`python -m http.server`), then open `Main.dc.html`. A6 can restore them once P0-1 adds `docs/design/**` to the ESLint and Prettier ignores.

Owners: A2 turns sections 1–3 into tokens and primitives (P2-1, P2-2); A3 builds sections 4–5 (P4-*); A4 moves every string in section 5 into the message files (P3-1).

## 1. Tokens

### Colour

| Token (proposed) | Value | Used for |
|---|---|---|
| `--color-paper` | `#F3EFE7` | Page background, text on dark |
| `--color-paper-raised` | `#FBF9F5` | Skill tiles, spec cell hover |
| `--color-paper-sunk` | `#E8E2D6` | Skills category hover |
| `--color-line` | `#CFC6B8` | Spec grid lines, tile borders, icon borders |
| `--color-ink` | `#141414` | Text, rules, dark blocks, primary button |
| `--color-ink-2` | `#3B3833` | Body copy |
| `--color-ink-3` | `#4A453E` | Mono labels, tile "used in" text |
| `--color-ink-4` | `#5A554D` | Meta lines, footer, stack line |
| `--color-ink-5` | `#6B655C` | Idle carousel tab |
| `--color-night-2` | `#24221F` | Carousel screenshot well |
| `--color-night-3` | `#3A3833` | Browser-chrome dots |
| `--color-night-muted` | `#A8A399` | Text on the carousel's dark frame |
| `--color-night-label` | `#C9C2B6` | Education row labels |
| `--color-night-hover` | `#D9D2C5` | Tile "used in" text on hover |
| `--color-accent` | `#C8302A` | Accent (default) |
| `--color-on-accent` | `#FFFFFF` | Text on accent |

The design offers alternative accents `#1F4FE0`, `#1B7A4B` and `#141414`; ship `#C8302A` only (one token, so it can change later).

Contrast checked by A0: white on accent ≈ 5.4:1; accent on paper ≈ 4.6:1 (passes, just, for the 14 px mono labels: do not lighten it); `#6B655C` on paper ≈ 5.0:1.

### Type

| Family | Weights used | Role |
|---|---|---|
| Alexandria | 500, 700, 800, 900 | Display: logo, headings, big numbers, marquee |
| IBM Plex Sans Arabic | 400, 500, 600, 700 | Body and UI (root font) |
| IBM Plex Mono | 500 | Section numbers, counters, stack lines, clock |

| Role | Size | Weight / line-height |
|---|---|---|
| Hero h1 | `clamp(40px, 5.8vw, 88px)` | 900 / 1.2 |
| Hero rotating line | `clamp(22px, 3vw, 40px)` | 700 |
| Section h2 | `clamp(36px, 5.4vw, 76px)` | 900 / 1.2 |
| Education h2 | `clamp(52px, 8vw, 124px)` | 900 / 1.15 |
| Contact "لنتحدث." | `clamp(44px, 9vw, 150px)` | 900 / 1.2 |
| Footer wordmark | `clamp(56px, 14vw, 220px)` | 900 / 1.3, outline |
| Carousel title h3 | `clamp(30px, 3.4vw, 46px)` | 800 / 1.3 |
| Archive row title | `clamp(24px, 3vw, 40px)` | 800 / 1.35 |
| Lead paragraph | `clamp(16px, 1.6vw, 19px)` | 400 / 1.9 |
| Body | 15–17px | 1.6–1.9 |
| Mono label | 13–15px | 500 |

Arabic display line-heights are already ≥ 1.15 and letter-spacing is 0, matching R3. Keep them.

### Layout, radii, motion

- Container: `max-width: 1280px`, inline padding `clamp(16px, 4vw, 32px)`. Section block padding mostly `clamp(64px, 9vw, 120px)`.
- Radii: pill `999px`; 24px (spec grid, carousel frame); 20px (tile); 16px (skills tab); 14px (icon box, screenshot well).
- Touch targets: every button and link chip has `min-height` 44px or more; keep that.
- Easings: `out` = `cubic-bezier(.2,.8,.2,1)`; `in-out` = `cubic-bezier(.7,0,.2,1)`; `back` = `cubic-bezier(.3,1.3,.5,1)`.
- Durations: 0.3s (colour), 0.4–0.6s (hover transforms), 0.8–1.2s (entrances), 6.5s (carousel), 10s (word cycle), 28s / 40s (rings), 30s (marquee).
- Global `prefers-reduced-motion: reduce` kills every animation and transition. Keep that, and also stop the JS autoplay (R13).

## 2. Motion inventory

| Effect | Where | Mechanism in the mockup |
|---|---|---|
| `rise` line reveal | Hero h1 lines | CSS keyframe, staggered delays .35s / .5s |
| `fade` | Header, hero copy | CSS keyframe |
| `draw` rule | Header bottom rule | `scaleX` from the right |
| `zoom` + `up` | Hero portrait and image | CSS keyframe from opacity 0 (see deviation V-1) |
| `spin` / `spinr` | Text ring 28s, dashed ring 40s | CSS |
| `pulse` | Availability dots | box-shadow pulse |
| `cycle` | Rotating role words | `translateY` steps over 1.35em rows |
| `marquee` | Stack band | `translateX(-50%)`, pauses on hover |
| `slidein` / `visin` | Carousel copy and visual | CSS on slide change |
| `progress` | Active carousel tab bar | `scaleX` over 6.5s, paused with the stage |
| Row fill | Archive rows | `::before` `scaleY` with accent, title shifts 14px |
| Tile wipe | Skill tiles | `clip-path: circle()` from the top corner |
| Cell bar | Spec cells | `::after` accent bar `scaleX` |
| `.sr` scroll reveal | Section heads, rows | CSS `animation-timeline: view()` inside `@supports` |

Everything is CSS. See DECISIONS.md D-013.

## 3. RTL notes for A2 and A3

The mockup is RTL-only and uses physical properties everywhere: `transform-origin: right`, `text-align: right`, `margin-left`, `padding-right`, `translateX(-14px)` on hover, `clip-path: inset(0 0 0 100%)`, `circle(... at 100% 0%)`, `left: 50%; margin-left: -44%`. Every one must become logical (`inline-start` / `inline-end`) or be mirrored under `[dir="ltr"]`, otherwise `/en` animates from the wrong side (R2). Arrow icons must flip in LTR.

## 4. Sections (in page order)

1. **Header**: sticky, translucent paper with `backdrop-filter: blur(10px)`; logo "محمد صالحة." (accent dot); nav: projects, skills, education, contact (hidden below 900px, so the mobile sheet from P4-1 is needed); EN pill; CV button (ink, download icon). A 1px ink rule draws in under it.
2. **Hero**: `flex-wrap: wrap-reverse`, so on mobile the portrait sits above the copy. Availability line with pulsing dot; h1 in two lines, the second outlined; "أبني" + rotating words (4 phrases); lead paragraph; CTAs "استعرض المشاريع" (accent) and "تحميل السيرة الذاتية" (ghost). Portrait: `clamp(280px, 40vw, 580px)` square, rotating text ring, dashed ring, accent circle at `inset: 11%` with dot texture, photo bottom-anchored at 88% width.
3. **Spec strip**: 4 cells in an auto-fit grid (`minmax(min(100%, 250px), 1fr)`), 1px line gaps, 24px radius. Cells: 01 specialty, 02 role, 03 core stack chips, 04 status + Gaza clock.
4. **Marquee**: full-bleed ink band, LTR, stack names separated by accent ✦.
5. **01 Featured**: header with counter "01 / 04" and next / prev buttons; tab row (number + short name, progress bar on the active tab); slide = dark "browser" frame with URL and screenshot well (3 parts) + copy (2 parts): label pill (accent), kind pill, title, description, 3 bullet points, mono stack line, "دراسة الحالة" and "معاينة مباشرة" buttons.
6. **02 Archive**: count "(06)"; full-width rows: number, title, meta, tag pill, arrow; accent fill on hover. Number and arrow hide below 640px.
7. **03 Skills**: vertical category tabs with counts (4 categories), total count below; tile grid (`minmax(min(100%, 210px), 1fr)`), each tile: abbr box, index, name, "used in" projects line.
8. **04 Education**: full-bleed ink block; big two-line h2 (second line outlined in paper); 4 label/value rows (degree, university, graduation project, its stack); closing statement with an accent underline.
9. **Contact**: question line, huge "لنتحدث." mailto link, row of links (email, WhatsApp, GitHub, LinkedIn).
10. **Footer**: giant outlined wordmark (`aria-hidden`), © line, "صُمّم وبُني في غزة".

## 5. Mockup data (to be replaced by DB and messages)

The featured slides, archive rows and skills in the mockup are hard-coded in its script. In the build they come from the `projects`, `skills` and `project_skills` tables (A1) and the message files (A4). The mockup's project facts conflict with the CV and the seed data in places; see [CONTENT.md](../CONTENT.md) before using any of them.

## 6. Required deviations from the mockup

| # | Mockup does | Build must | Why |
|---|---|---|---|
| V-1 | Portrait circle and photo start at `opacity: 0` with .4s / .9s delays | Keep the scale-in, but the photo is visible (opacity 1) at first paint; no delay on the image | The portrait is the LCP element on mobile; an opacity-0 start pushes LCP past 2.0s (R6) |
| V-2 | Physical left/right everywhere | Logical properties, mirrored motion in LTR | R2 |
| V-3 | Carousel tabs without `aria-controls`, panels without ids or `aria-labelledby`, no arrow-key handling | Full WAI-ARIA tabs pattern, roving tabindex, arrow keys | P4-4 acceptance, R14 |
| V-4 | Skills tabs: same gaps as V-3 | Same fix | WCAG 2.2 AA |
| V-5 | Clock computed in the constructor | Server renders `--:--`, client fills it after mount | R1 |
| V-6 | Autoplay keeps running under reduced motion and in a hidden tab | Stop on reduced motion; pause on `visibilitychange`, focus within and hover | R5, R13 |
| V-7 | Rotating words are 5 stacked spans read in full by screen readers | Static accessible name (`aria-label` or visually hidden full sentence), animated spans `aria-hidden` | P4-2 acceptance |
| V-8 | Screenshot well shows "[ لقطة شاشة المشروع ]" | Real screenshot via `next/image`; the placeholder never ships | Project risk: placeholders |
| V-9 | "معاينة مباشرة" always shown | Render only when the project has a `live_url` | No dead links |
| V-10 | `-webkit-text-stroke` outline on Arabic display text | Keep, but check overlap seams at glyph joins in Alexandria at every weight; fall back to a solid lighter fill if seams show | R20 |
| V-11 | Nav hidden below 900px with no replacement | Mobile menu sheet (P4-1) | Navigation on phones |
| V-12 | Header `backdrop-filter: blur(10px)` | Keep, but no animated `filter` anywhere (audit P2); drop the blur if mobile scroll jank shows in Lighthouse | Performance |

## 7. Assets

- `editorial-cv/assets/83acccce65888d11e9adb4c9d93d275f.webp` (45 KB): the cut-out portrait used in the hero. It replaces the 1.0 MB `public/images/mohammed-avatar-hero.png` (P0-3 / P4-2).
