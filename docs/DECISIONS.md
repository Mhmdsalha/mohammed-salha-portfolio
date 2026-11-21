# Decisions

Owned by A0. Every decision that changes or fills a gap in [PLAN.md](PLAN.md) is recorded here. Status: **Accepted** (agents follow it) · **Open** (needs the owner's answer before the named ticket starts).

---

## D-001 Phase numbering — Accepted (2026-11-20)

The plan names "seven phases (0 to 6)" but labels tickets P0, D1, P2, P3, P4, D5. Mapping used in TASKS.md: 0 tooling and clean-up, 1 security and data, 2 design system, 3 content and i18n, 4 public site, 5 dashboard, 6 launch.

## D-002 Category migration breaks on existing `pos` / `other` rows — Open (blocks D1-2)

Code today allows `salla | webapp | pos | other` (`src/types/index.ts`, `src/actions/projects.ts`). The draft `0002_rebuild.sql` remaps only `salla`, then adds `check (category in ('webapp','system','platform','store'))`, so any `pos` or `other` row makes the migration fail.

Proposal: `pos → system`, `other → webapp`, run before the constraint is added, inside one transaction. Owner to confirm the mapping.

## D-003 No baseline migration exists — Accepted

There is no `supabase/` folder; the current schema lives only in README.md. A1 writes `supabase/migrations/0000_baseline.sql` (idempotent `create table if not exists`, matching README) so `0002_rebuild.sql` applies to a fresh database as well as production. (Renamed from `0001_baseline.sql`: D1-1 took `0001` for `login_attempts`; see D-018.)

## D-004 Unpublished and GitHub-less projects stay publicly readable — Accepted

The existing policy `"Public read" ... using (true)` lets anyone read every row through the public Supabase REST endpoint with the anon key, so `published = false` would hide a project from the site but not from the API. In `0002_rebuild.sql`:

- `published boolean not null default true`.
- Replace the policy with `using (published and github_url is not null)`; this also enforces "only projects with a GitHub repository are shown" at the database.
- The redundant `"Service role full access"` policy can stay (service role bypasses RLS anyway).

## D-005 Site settings and CV storage — Accepted unless the owner objects

Settings are stored today as `settings.json` in the `site-settings` Storage bucket (`src/lib/site-settings.ts`); the plan does not mention this. Decision:

- Move settings to a single-row `site_settings` table in `0002_rebuild.sql` (RLS: anon select, service role write), tagged `settings` for revalidation.
- CV is stored in a `cv` bucket and served by a route handler at `/cv.pdf` (A5 owns the handler under D5-5; A1 owns the upload action).

## D-006 Auth implementation choices — Accepted

- jose-signed JWT, not Supabase Auth: there is one admin and no user table.
- `bcryptjs` (pure JS) instead of native `bcrypt`, so no native build on Vercel. `compare` runs in the server action (Node runtime), never in middleware.
- Rate limit backed by a Supabase `login_attempts` table (no new vendor account). Key: IP from `x-forwarded-for` (first hop) on Vercel.
- Cookie moves from `path=/dashboard` to `path=/`, `sameSite=strict`, 8 h expiry, as in the plan.
- `requireAdmin()` lives in `src/lib/auth/` and returns/throws a 401-equivalent result for actions; pages use a redirecting variant.

## D-007 bcrypt hash in env files is mangled by `$` expansion — Accepted

Next.js loads `.env*` files with variable expansion, so a value like `$2b$12$abc…` is read as variable references and silently truncated, and every login fails. Store the hash base64-encoded as `DASHBOARD_PASSWORD_HASH` and decode it in `src/lib/env.ts`; the Zod env schema checks it decodes to a `$2` prefix. A1 documents the one-line hash command in README.

## D-008 Tagged caching with Supabase — Accepted

`supabase-js` calls are not tagged automatically, and `createServerSupabaseClient()` reads `cookies()`, which cannot run inside a cached function. The public data API wraps each read in `unstable_cache(fn, key, { tags: [...] })` and uses a cookie-less anon client. Dashboard reads stay uncached and use the service-role client after `requireAdmin()`.

## D-009 Risks added to the register — Accepted

| #   | Likely bug                                                                                                           | Where                                 | Prevention                                                                                     | Catching test                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| R16 | bcrypt hash truncated by `$` expansion; login always fails                                                           | Env, D1-1                             | D-007 (base64)                                                                                 | Unit test on env parsing with a real hash                                    |
| R17 | Unpublished or GitHub-less project readable via the anon REST API                                                    | RLS, D1-2                             | D-004 policy                                                                                   | Integration test: anon `select` on an unpublished row returns nothing        |
| R18 | `cookies()` called inside a cached data function, so the build fails or caching is silently off                      | Data API, D1-4                        | D-008                                                                                          | Build in CI + e2e for R7                                                     |
| R19 | Framer Motion's full bundle blows the 180 KB JS budget                                                               | Public site                           | CSS-first motion (D-013); if Framer Motion is used, `LazyMotion` + `domAnimation` + `m.*` only | Lighthouse CI JS budget                                                      |
| R20 | `-webkit-text-stroke` outline text shows seams where Arabic glyphs join, or vanishes in forced-colours mode          | Hero h1, section h2s, footer wordmark | Check Alexandria at 800/900; `forced-colors` fallback to solid text                            | Visual snapshot at 360 and 1280 px, AR and EN                                |
| R21 | Logo, ring text or physical-direction keyframes copied from the RTL-only mockup animate from the wrong side in `/en` | All sections                          | SPEC.md §3 and V-2                                                                             | Visual snapshots of `/en` mid-animation (animations paused at a fixed frame) |

## D-010 Ownership gaps — Accepted

Files no agent owned in the roster are assigned here. Only the named owner edits them; anyone else files a request with A0.

| File(s)                                                                                                                                                      | Owner                          | Reason                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/layout.tsx`, `src/app/page.tsx`, `src/i18n/*`                                                                                                       | A4                             | Locale plumbing (P3-2)                                                                                                                 |
| Route-group root layouts `src/app/(site)/`, `src/app/(dashboard)/`                                                                                           | A4 creates, A3 / A5 fill       | `<html lang dir>` must come from the locale while the dashboard stays outside `[locale]`; this needs two root layouts via route groups |
| `next.config.ts`, `src/types/*`, `src/lib/env.ts`, `src/lib/projects.ts`, `src/lib/site-settings.ts`, `src/data/*`, `scripts/*`, `.env.example`, `README.md` | A1                             | Data, env and config                                                                                                                   |
| `package.json`, `package-lock.json`                                                                                                                          | Ticket owner, serialised by A0 | Merge one dependency change at a time to avoid lockfile conflicts                                                                      |

## D-011 Open questions for the owner

1. **D-002** category mapping for `pos` and `other`.
2. ~~**Design source**~~: received 2026-11-20, stored at `docs/design/editorial-cv/`, spec in `docs/design/SPEC.md` (D-012).
3. ~~**CV text**~~: received 2026-11-20, summarised in `docs/CONTENT.md`. Still needed: real project screenshots before P4-4, and answers to CONTENT.md C-1 to C-10.
4. **Supabase access:** who applies migrations to production (L-1), and is there a staging project for e2e tests?
5. **GitHub URLs** for Arzaq, Saree3, the graduation project and Al-Amanah (CONTENT.md, Project inventory). Without them, only Al-Nakhba is publishable and the featured carousel is empty.

## D-012 Design source of truth — Accepted (2026-11-20)

The approved artboard is the export in `docs/design/editorial-cv/Main.dc.html`; `docs/design/SPEC.md` lists its tokens, sections and the required deviations V-1 to V-12. A7 reviews against both. The runtime JS from the export is not committed because the repo-wide `eslint` run lints it and fails; P0-1 should add `docs/design/**` to the ESLint and Prettier ignores.

## D-013 Motion: CSS first, Framer Motion only where needed — Accepted (changes PLAN Tech decisions)

Every effect in the mockup is plain CSS (keyframes, transitions, `animation-timeline: view()`), including scroll reveals. Rebuilding them in Framer Motion would add about 30 KB+ of JS and move work onto the main thread. Decision:

- A2 implements entrances, hover effects, rings, marquee, word cycle and scroll reveals as CSS utilities and keyframes in `globals.css`, gated by `prefers-reduced-motion`.
- Scroll reveals use `animation-timeline: view()` inside `@supports`; browsers without support show content without animation (never hidden).
- Framer Motion is added only if a component needs enter/exit sequencing CSS cannot do (likely candidate: carousel slide change). It then goes through `LazyMotion` (R19).
- `src/lib/motion.ts` still exists: shared durations, easings and the `useReducedMotion` gate for JS timers (carousel autoplay, clock).

## D-014 Content rules — Accepted

The CV is the source of truth for facts; the mockup for tone and structure (see `docs/CONTENT.md`). Contact details are dashboard settings, not copy. The CV PDF itself stays out of the repo; it is uploaded through the dashboard (D5-5) and served at `/cv.pdf`.

## D-015 Seed data contradicts the scope — Accepted

`scripts/seed-projects.mjs` seeds three Salla stores (Lamsa, Oud, Lolo) and leaves `github_url` null for Arzaq and Saree3, although the CV links both repos. P0-3 removes the Salla rows from the seed; D1-2 adds the missing projects once the owner supplies URLs (D-011 item 5). Under D-004's policy, rows without a GitHub URL are invisible to the public site.

## D-016 Portrait asset — Accepted

Use the design's 45 KB cut-out WebP (`docs/design/editorial-cv/assets/…webp`) as the hero portrait, copied into `public/images/` by A3 in P4-2. P0-3 deletes the three old PNGs (4.3 MB).

## D-017 Tooling conventions from P0-1 — Accepted (2026-11-20)

- **One-time reformat:** P0-1 ran Prettier over the whole repo (30 files, formatting only) before any parallel work starts, so later PRs carry no formatting noise. Style keeps the existing code's choices: double quotes, semicolons, no trailing commas, 100-column lines.
- **Merge method exception:** PR #1 merges with a **merge commit**, not squash or rebase, so the reformat commit keeps the hash listed in `.git-blame-ignore-revs`. Every other PR squash-merges as planned.
- **Line endings:** `.gitattributes` forces LF in the working copy; without it, Windows checkouts get CRLF and `prettier --check` fails locally. It does not rewrite files already checked out: an existing Windows clone with `core.autocrlf=true` needs one re-checkout on a clean tree, `git rm --cached -r . && git reset --hard`.
- **Lint:** `npm run lint` fails on any warning. `no-console` (except `warn`/`error`) applies to `src/**` and `middleware.ts`; CLI scripts under `scripts/` may print. ESLint and `tsc` skip `.claude/**` (agent worktrees). lint-staged passes `--no-warn-ignored`, so staging an ignored file never blocks a commit.
- **Node:** 22 (`.nvmrc`, `engines: "22.x"`), so Vercel picks the same major as CI.
- **Build warnings:** CI fails if `next build` prints a `⚠` line (QA gate 1); Next itself exits 0 on warnings.
- **Vitest:** `vitest.config.mts` (ESM, so Vite loads it without warnings); tests live in `tests/**` (A6) and may sit next to code; both `.test.ts` and `.test.tsx` run.
- **Prettier scope:** everything except `docs/design/**` (the mockup export), so the planning docs are format-checked too.
- **CI build without secrets:** the CI build runs with no Supabase env and currently passes on the mock fallback. When D1-2 removes the fallback and R12 makes missing env fail the build, CI needs either repository secrets or explicit dummy values; A1 and A6 settle this in D1-2.
- **Pre-commit:** Husky runs `lint-staged` (ESLint `--fix` + Prettier on staged files). Typecheck and tests run in CI, not in the hook, to keep commits fast.

## D-018 How D1-1 was built — Accepted (2026-11-20)

- **Guard shape:** `requireAdmin()` returns `null` for a valid session or the `{ success: false, message: "Unauthorized." }` result, so the first two lines of every action are `const denied = await requireAdmin(); if (denied) return denied;`. It does not throw, because the dashboard forms (A5) already render result objects and a thrown error would surface as an unhandled rejection. Pages use `requireAdminPage()` (redirects). `src/lib/dashboard-auth.ts` stays as a one-line re-export so A5's pages need no edits.
- **Cookie:** renamed to `dashboard_session`. The old `dashboard_token` is never read; login, logout and the middleware clear it.
- **Fail closed:** without `SESSION_SECRET` (32+ chars), a valid `DASHBOARD_PASSWORD_HASH`, or a reachable `login_attempts` table, login is refused and every dashboard page redirects to login. This makes deploying D1-1 safe even before the env vars are set: the dashboard is locked, not open. It also means local dashboard login needs Supabase env and the migration applied.
- **Migrations:** `0000_baseline` (D1-2), `0001_login_attempts` (D1-1), `0002_rebuild` (D1-2), applied in name order.
- **Rate limit (revised after A7 review):** every attempt is recorded **before** the password is checked, through one Postgres function, `register_login_attempt`, that takes an advisory lock, inserts the attempt and returns the counts including it. A parallel burst is therefore counted in full: the 6th and later attempts are refused without running bcrypt. Limits: 5 attempts per client and 100 from all clients per 15 minutes. A missing table or function, or any unexpected result, is an error, so login fails closed; nothing reads "no answer" as "zero attempts".
- **Lockout resistance (re-review N1):** an attempt from a client already at 5 is refused **without being stored**, and each client counts for at most 5 in the global total. One address can never lock the admin out on its own; doing so takes 20 addresses each at their limit, and only for as long as they keep it up. If it happens, unlock by running `delete from public.login_attempts;` in the Supabase SQL editor.
- **Client key:** the IP only on Vercel (`VERCEL=1`), where `x-real-ip` / `x-forwarded-for` are set by the platform; anywhere else these headers are client-controlled, so all clients share one bucket. Consequence: if Vercel's "Automatically expose System Environment Variables" setting is off, or the app runs anywhere else, every visitor shares one bucket and 5 bad attempts by anyone lock the login for 15 minutes. Keep that setting on (it is the default). Stored as a salted SHA-256 hash; the salt is `SESSION_SECRET`, so rotating it also resets every bucket.
- **Sessions are stateless:** logout clears the cookie, but a stolen token stays valid until it expires (8 h; `maxTokenAge` also refuses any token older than 8 h whatever its `exp`). Rotating `SESSION_SECRET` ends every session at once, as PLAN.md intends.
- **Middleware location:** with an `src/app` directory Next only loads `src/middleware.ts`; the old root `middleware.ts` was never compiled (A7 finding, also true before D1-1). It now lives in `src/`, and `npm run build` fails through `scripts/check-build.mjs` (`postbuild`) if the middleware manifest is empty. The check runs only through `npm run build`: keep Vercel's Build Command at its default (`npm run build`), because overriding it to `next build` silently skips the check. It also assumes the default `.next` output directory. jose is imported from `jose/jwt/sign` and `jose/jwt/verify` only, because its main entry pulls in compression APIs the Edge runtime lacks and triggers build warnings.
- **Middleware rewrite** also removed the dead branch from audit C1 (part of P0-3).
- **E2E proof:** Vitest covers the middleware (8 forged-token variants), every exported action without and with forged sessions (a missing guard fails the test), a 30-request parallel burst, the store's error handling, and the migration SQL itself, run in PGlite (real Postgres in WASM) including role permissions. HTTP probes against a production build confirmed both layers: forged cookies on dashboard pages get a 307 to login with the cookie cleared; a server action POSTed to a public route is forwarded by Next to its dashboard page, where the middleware stops it before it runs. The Playwright version of the "Attacker" path lands with P0-2, which sets Playwright up.
- **Verified on production (2026-11-20):** a forged `dashboard_token=authenticated` cookie on `/dashboard` got a 307 to login with both cookies cleared; 7 empty-password logins returned "Invalid password." five times, then "Too many attempts." twice; `login_attempts` held 5 rows (refused attempts not stored). The test rows were deleted afterwards. Per-IP bucketing on Vercel was not separately verified (all attempts came from one address).

## D-019 Playwright setup and baseline (P0-2) — Accepted (2026-11-20)

- **Two projects** in `playwright.config.ts`: `e2e` (behaviour tests, `npm run e2e`) and `baseline` (`npm run e2e:baseline`, opt-in through `CAPTURE_BASELINE`, so a plain `playwright test` never overwrites the committed baseline; partial runs never rewrite `metrics.json`). Both target `BASE_URL` (default `http://localhost:3000`), so the same tests run against a local build, a Vercel preview or production.
- **Browser:** `PW_CHANNEL=msedge` uses the installed Edge locally, avoiding a separate browser download. CI does not run e2e yet; when it does (backlog) it installs Playwright's Chromium.
- **Baseline images are references, not snapshots:** full-page JPEGs (quality 60, 2.5 MB total) of the pre-rebuild site, plus `metrics.json` and a Lighthouse summary. Pixel-diff visual tests (QA gate 3) start with the new design in P4, with PNG snapshots stored by Playwright.
- **Attacker path in a browser:** `e2e/security.spec.ts` checks forged cookies (legacy constant, `alg:none`, garbage) and no cookie on three dashboard routes, plus the locale-prefixed redirect. It makes no login attempts, so it never touches the rate limit and is safe to run against production.
- **Not in CI yet:** e2e needs a running deployment. Wiring `npm run e2e` to the Vercel preview URL in CI is a follow-up for A6 (backlog).

## D-020 P0-3 scope: what the clean-up removes now and what waits — Accepted (2026-11-20)

Numbered D-020 because D-019 is on the open P0-2 branch.

- **Removed:** the two unused avatar PNGs (3.2 MB) and the unused `LenosGX.ttf` (264 KB); `src/lib/upload.ts` and `src/lib/supabase/client.ts`, the browser anon-key upload path (audit A4) and its only caller; the three Salla stores (Lamsa, Oud, Lolo) from `scripts/seed-projects.mjs` and `src/data/mock-projects.ts`. The dead middleware branch went with D1-1.
- **`public/` went from 4.7 MB to 1.2 MB, not yet under 300 KB.** What remains is in use by the current site: `mohammed-avatar-hero.png` (1.0 MB, the hero) and three local fonts (189 KB). They go with P4-10, which swaps the new home page in (D-023; P4-2 builds the hero on a preview route, so the old hero still uses the PNG), and with the last old component using the local fonts. The 300 KB criterion is checked again after P2-1 and P4-2.
- **"No salla string in repo" is not met by P0-3 alone**, because the remaining mentions belong to other owners or need a data migration:
  - Copy in `HeroSection`, `AboutSection`, `ServicesSection`, `ProjectFilter` and the message files (A3/A4): removed when P3-1 and P4 rewrite them.
  - Site metadata in `src/app/layout.tsx` (A4): P3-3.
  - The `salla` category in `src/types`, the project Zod schema and the dashboard form, plus the Salla rows in the production database (Lamsa and Lolo are still live on the site): D1-2, together with the category migration (D-002), because dropping the enum before the rows are remapped would break editing those projects. Deleting production rows needs the owner's confirmation.
  - **Ownership exception (A7 review):** removing `salla` from `ProjectCategory` makes `src/components/projects/ProjectFilter.tsx` (A3; its `Record<Filter, …>` has a `salla` key) and `src/components/dashboard/ProjectForm.tsx` (A5; enum, default value and option) fail to compile. D1-2 may edit only those `salla` references in both files, in the same PR, so typecheck never breaks between tickets.
  - Mentions in `docs/` are intentional (they describe the rule).
- **Check:** `git grep -il salla -- src scripts` must be empty once P3-1, P4 and D1-2 are merged. Each follow-up is written into its ticket's acceptance in TASKS.md, and L-2 runs the final check; P0-3 stays "partial" until then.
- **Unused code outside A1's files**, found in review: `src/components/projects/ProjectCardFeatured.tsx` and `src/components/dashboard/DeleteModal.tsx` have no importers. They go with P4 (A3) and D5-6 (A5).
- **Risk note:** deleting `upload.ts` removes dead code, not the risk. The anon key is public by design, so only the Storage bucket policies stop anonymous uploads; that check is L-1 (launch checklist).

## D-021 Design tokens and fonts (P2-1) — Accepted (2026-11-20)

D-019 and D-020 were taken by P0-2 and P0-3 while this was open.

- **Tokens** live in one `@theme static` block at the top of `src/app/globals.css`, using the names from `docs/design/SPEC.md` §1: colours (`paper`, `line`, `ink-2…5`, `night-*`, `accent`, `on-accent`); families (`font-display`, `font-body`, `font-label`); a named type scale with line-heights (`text-hero`, `text-section`, `text-statement`, `text-contact`, `text-wordmark`, `text-slide-title`, `text-row-title`, `text-rotator`, `text-closing`, `text-lead`, `text-marquee`, `text-frame-title`); `max-w-page`, `px-gutter`, `py-section`; `rounded-frame/tile/tab/box`; `shadow-lift`, `shadow-portrait`; `--stroke-outline` (1.5px) and `--stroke-outline-thin` (1.2px) for outlined text; `ease-reveal/sweep/pop`. `static` keeps every token as a CSS variable even before a utility uses it. Durations live in `src/lib/motion.ts` (P2-2).
- **No clashes with the old site:** every name is new (the old `--neon`, `--bg-*`, `--radius-card`, `font-mono` stay untouched), so today's site looks the same until each P4 section replaces its old component. The old block in `globals.css` is marked and goes with the last P4 ticket.
- **Fonts:** `src/app/fonts.ts` loads Alexandria (500/700/800/900), IBM Plex Sans Arabic (400/500/600/700) and IBM Plex Mono (500), the weights the design uses, with `next/font/google`, Arabic + Latin subsets, `display: swap` and metric-matched fallbacks. Their variables are set on `<html>`, and each family token gives its `var()` a fallback so it stays valid outside `<html>`. `font-label` falls back to Plex Arabic because Plex Mono has no Arabic glyphs (the design sets Arabic in the label face). **`preload: false`** for now, so the current site does not download fonts it does not use (verified in a browser: requests are identical to `main`); P4-2 turns preload on for the hero's families. The three local fonts in `public/fonts/` stay until the old components that use them are gone.
- **Enforcement:** `npm run lint` (and so CI) also runs `scripts/design-tokens.mjs` over every `src/**/*.{js,jsx,ts,tsx,mjs,cjs,css}` file except `globals.css` and `fonts.ts`. It fails on: hex colours (also inside Tailwind arbitrary values such as `border-[1.5px_solid_#141414]`); `rgb/hsl/hwb/lab/lch/oklch/oklab()` with literal channels, any case; `color()` with a colour space; Tailwind palette utilities (`text-white`, `bg-black`, `text-red-500`…); named colours in `color:`/`background:`-style declarations; any `font-family`/`fontFamily`/`font-[…]` declaration; any `next/font` import. Comments are ignored, and so are link targets (`href="#add"`, `` `${path}#id` ``). Colours derived from tokens (`color-mix(…var(--color-ink)…)`, `rgb(from var(…) …)`) pass. **Known limits:** a hex-looking id used outside an `href` (e.g. `querySelector('#add')`) is flagged, and a named colour used as a bare string outside a colour declaration is not. The 29 old files that already break the rule are in `scripts/design-tokens-legacy.json`; the check fails when a listed file becomes clean or is deleted, so the list only shrinks. Public-site files leave the list with P4; dashboard files with the D5 tickets that touch them (the dashboard keeps its own look under the non-goals, so D5-6 decides whether to tokenise or keep them listed). Unit-tested in `tests/unit/design-tokens.test.ts`, including every bypass the review found.
- **CLS 0:** no element uses the new fonts yet, so CLS is unchanged by this ticket (baseline 0.001 / 0.008). It is measured again when P4-2 first applies them.
- **Layout ownership:** `src/app/layout.tsx` (A4, D-010) only gains the font-variable class on `<html>`; P3-2 restructures it.
- **Tailwind sources:** `globals.css` excludes `tests/`, `e2e/`, `scripts/` and `docs/` with `@source not`, so class names in test strings and docs never add utilities to the production CSS.

## D-022 Design primitives and motion (P2-2) — Accepted (2026-11-21)

- **Primitives** in `src/components/ui/`, all server components and CSS-only (D-013), so they add no client JavaScript:
  - `Button`: accent / ink / ghost, sizes sm 44px, md 48px, lg 54px (all ≥ 44px touch targets); renders a Next `<Link>` when `href` is set; optional `arrow` or `download` icon.
  - `Tag`: accent / outline / chip pills with `dir="auto"` (R15).
  - `SectionHeader`: numbered eyebrow, heading with optional outlined words, aside slot, light/dark tone.
  - `Reveal`: scroll reveal through `animation-timeline: view()`, visible without support.
  - `LineReveal`: hero-style lines rising out of a clip with 0.08em/0.14em padding for Arabic (R3) and a space between lines for screen readers.
  - `Marquee`: always LTR, two copies for a seamless loop (the second hidden from assistive tech), `overflow-hidden` (R4). Each copy repeats the items (`repeat`, default 2) so it stays wider than the screen up to about 3,800px; a single run left a blank band at 1920px and wider (A7 review). Pauses on hover, on focus inside, and with a 44px pause control: a real checkbox, so it works by keyboard and touch with no JavaScript (WCAG 2.2.2). The control is hidden under reduced motion, where nothing moves. Needs a localised `pauseLabel`.
- **Motion tokens** in `globals.css`: `animate-line-rise`, `animate-fade-up`, `animate-rule-draw`, `animate-marquee`, plus the `reveal-on-scroll`, `text-outline` and `text-outline-light` utilities. `src/lib/motion.ts` holds the matching durations (carousel 6.5 s, word cycle 10 s, marquee 30 s, clock 30 s), staggers and easing names; it is server-safe. The reduced-motion hook for JavaScript timers is in `src/lib/use-reduced-motion.ts` (client only). Next refuses a server import of any module that contains a hook, so the two must stay split. On the server the hook returns "reduce", so nothing autoplays before hydration.
- **Reduced motion (R13):** hover movement and transitions are declared only under `motion-safe:`, so with reduced motion they do not exist. The first version used `motion-reduce:` overrides, and one of them lost to a later direction rule: the arrow still slid 4px on hover (A7 review). Animations use `motion-reduce:animate-none`, and the existing global rule in `globals.css` cuts anything else to 0.001ms. Browser tests now hover under reduced motion and check that nothing moves.
- **RTL/LTR (R2, R21):** `rtl:` and `ltr:` are redefined with `@custom-variant` to use `:dir()`, the element's real direction. Tailwind's default matched any `[dir="rtl"]` ancestor, so both variants applied inside an LTR block nested in an RTL page. The arrow icon points to the line end in LTR and is mirrored with `rtl:-scale-x-100`; its hover nudge moves 4px toward the reading direction. Browser tests check both page directions and a nested block. Every animation is vertical or LTR-only (marquee), so nothing else needs mirroring.
- **Outlined text and Arabic seams (R20 confirmed):** a plain `-webkit-text-stroke` draws visible seams where connected Arabic letters overlap (seen in Alexandria at 900). The `text-outline` utilities paint the stroke first and then fill the letters with the background colour (`paint-order: stroke fill`, stroke doubled to 3px because the fill covers its inner half). This hides the inner overlaps; on screen at 1280px the visible outline is about 1.5px, as in the design. Fallbacks: solid text in forced-colours mode and without text-stroke support. **Limits (A7 review):** CSS can only test whether `paint-order` parses, not whether a browser applies it to HTML text. A browser that parses it but ignores it would show a heavy 3px outline with the seams back. Current Chrome, Edge, Firefox and Safari apply it; Firefox and Safari were not checked by hand. **Consequence:** outlined text must sit on the colour given as `--outline-fill` (paper by default, ink for `text-outline-light`); on any other background the letters show as filled blocks.
- **Demo page** `/dev/ui`: every primitive in RTL and LTR, plus a block in the opposite direction nested in each. It returns a plain 404 in production (no demo title; checked on a production build) and is `noindex` in development. Its utility classes are part of the site-wide CSS (about 7.5 KB raw, A7 review); accepted, because the P4 sections will use most of the same utilities.
- **Design sizes** (A7 review): ghost buttons use the design's 26px (lg) and 22px (md) padding and a 1.5px border; the small ghost pill is 14px with a 1px border. Outline tags are 5px/14px and chips 5px/11px, so every md pill is the same height. Colour transitions on ghost buttons and chips use the design's default `ease`. `SectionHeader` has no outer margin: each section sets it (36, 32 or 40px in the design).
- **Tests:** 16 render tests (`tests/unit/ui-primitives.test.tsx`) and 12 browser tests (`e2e/ui-primitives.spec.ts`, against `next dev`). The page tests skip where `/dev/ui` is a 404; the last test checks that 404 is plain. E2E is not in CI yet (D-019 backlog), so run it locally. The browser tests check:
  - motion on and off with reduced motion, including hovering a button under reduced motion;
  - arrow mirroring and hover direction, in both page directions and in a nested block;
  - marquee pause on hover and with the keyboard-operated control, the control hidden under reduced motion, and a seamless loop at 1920px;
  - no horizontal scroll at 360px;
  - the Alexandria font loading;
  - the outline paint order.
- **Seen in the demo, for P4:** a mixed line such as "ومطوّر Full-Stack" can wrap with the Latin word split across lines at 360px. P4-2 should wrap Latin runs in `<bdi>`/`whitespace-nowrap` or choose break points. The old unlayered `[dir="rtl"] { font-family … }` rule in `globals.css` beats Tailwind utilities on any element that carries `dir`, so P4 sections must set `font-body` on a child of the `dir` element, until P3-2 moves `dir` to `<html>` and the old rule is removed.

## D-023 Build the new home page on a preview route; hero findings (P4-2) — Accepted (2026-11-21)

- **Preview route, not a live swap:** the new sections are assembled on `/[locale]/preview` (noindex, unlinked), one P4 ticket at a time. The live home page keeps the old design until **P4-10** swaps the preview in, so the live site never shows a light editorial hero on top of the old dark sections. P4-10 also:
  - deletes the old sections, components and `globals.css` block;
  - removes `mohammed-avatar-hero.png` (moved here from P4-2's P0-3 follow-up) and the old local fonts;
  - moves `fontVariables` to `<html>`.
- **Hero** (`src/components/sections/home/Hero.tsx`): a server component, CSS-only motion, with copy in `home.hero` in both message files. A4's message files gained these keys under an A0 exception: the hero cannot ship without copy, and P3-1 will review them. It has:
  - the availability line with a pulsing dot;
  - `LineReveal` h1 (`id="hero-title"`, which labels the section), with the second line outlined;
  - rotating role words: animated words are `aria-hidden`, and one sentence is announced instead;
  - the lead paragraph;
  - two CTAs. The CV button points at `/cv.pdf`, which exists once D5-5 ships;
  - the portrait: the design's 45 KB WebP, clipped by a `rounded-full overflow-hidden` circle, `priority` + `fetchPriority="high"`, a scale-in that never starts transparent (V-1);
  - a rotating text ring and a dashed ring.
- **Bugs found in the browser while building:**
  1. In an RTL page the SVG ring text starts at the end of the path and runs off it, so nothing was drawn. The text now has `direction="ltr"`; Arabic still reads right-to-left by the bidi rules.
  2. While turning, the square ring SVGs' corners caused 10px of sideways scroll at 360px (R4). They are now clipped by a round wrapper. The test freezes them at 45°, the worst angle.
  3. `Button` now renders a plain `<a>` for real file types (pdf, images, docs) and `download` links; other links, domains and dotted routes keep `<Link>`.
  4. `LineReveal` lines get 0.06em of horizontal slack, so an outline at the end of a line is not shaved by the clip.
- **Ring text:** Arabic repeats the phrase three times to go round the circle (letter-spacing would break the joins, R3). English uses `textLength` with `lengthAdjust="spacing"` to fill it, as the design's 0.6 letter-spacing did. "Full-Stack" is spelt the same in the ring and the title.
- **Fonts were broken in the first version (A7 review).** Moving `fontVariables` from `<html>` to the page left the `static` family tokens resolving on `:root`, where the next/font variables did not exist, so everything rendered in Segoe UI and no web font loaded. The family tokens are now an `@theme inline` block: each `font-*` utility carries the `var()` chain and resolves on the element. Browser tests now check that the title is in Alexandria and the ring in IBM Plex Sans Arabic, and that both font files really loaded.
- **Font preloading:** only Alexandria is preloaded (one variable font, 2 files). Preloading IBM Plex Sans Arabic would add 8 files (about 220 KB) on mobile. **Windows builds emit no preloads at all:** Next 15.5 writes an empty `next-font-manifest.json` there, because it matches the loader path with `/` only (found by the reviewer). Linux builds (CI, Vercel) are unaffected, and nothing in this repo disables preloading.
- **LCP does not meet the 2.0 s budget.** Lighthouse 12.8.2, mobile, local production build with the fonts working, three runs each:

  | Page          | Performance | Accessibility | FCP    | LCP         | CLS | Font files |
  | ------------- | ----------- | ------------- | ------ | ----------- | --- | ---------- |
  | `/ar/preview` | 92          | 100           | 2.13 s | 3.01–3.02 s | 0   | 6          |
  | `/en/preview` | 96–97       | 100           | 1.38 s | 2.52–2.60 s | 0   | 3          |

  The live page's baseline was 65 / 62 performance and 2.9 / 3.4 s LCP. The earlier 2.1 s figure was measured with the fonts broken and is withdrawn. The LCP element is the decorative ring text. On the Arabic page, Lighthouse's simulated slow 4G counts the six font files the first paint needs (Arabic and Latin subsets of Alexandria and of Plex Arabic 400/600), which pushes FCP itself past 2.0 s. These are local Windows numbers without Alexandria's preload, so they are a pessimistic case. **Open for the owner** (P4-2 stays open): accept a higher LCP budget for `/ar`, or cut first-paint font bytes, for example by drawing the decorative ring in a system font, dropping a family or weight from the hero, or self-subsetting. Re-measure on the Vercel production build (Linux, with preloads) once merged. SEO 63 on the preview is expected (its own `noindex`). `/favicon.ico` is a 404 site-wide (P3-3).

- **Local measuring pitfall:** `next dev` and `next start` share `.next`. Starting a dev server while a production server runs overwrites the built CSS, and pages then render in Times New Roman. One measurement was discarded for this reason. Never run both from the same checkout at once.
- **Tests:** `e2e/hero.spec.ts`, 10 tests, which run against production builds too. They check:
  - the portrait stays inside its circle at 360, 768, 1280 and 1920px in both locales;
  - no sideways scroll, with the rings frozen at their worst angle;
  - the accessible heading and words;
  - the LCP-safe portrait (high priority, preloaded, opacity 1 from the start);
  - motion is off under reduced motion and on otherwise;
  - the CV link is a plain download link;
  - `noindex`.

## Backlog (not in scope until A0 schedules it)

- Run `npm run e2e` in CI against each PR's Vercel preview URL (D-019).
- Report the Windows `next-font-manifest.json` path bug upstream, or measure on Linux only (D-023).
- Content-Security-Policy and security headers in `next.config.ts` (A1).
- Slug redirects table if slugs ever change after publish (R9 alternative).
