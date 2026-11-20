# Portfolio & Dashboard Rebuild — Multi-Agent Plan

Nov 20, 2026 · Mohammed Salha

> Source of truth for every agent. Changes to this plan are recorded in
> [DECISIONS.md](DECISIONS.md); ticket status lives in [TASKS.md](TASKS.md).

## Overview

Rebuild `mohammed-salha-portfolio` into an Arabic-first editorial portfolio, and harden its dashboard, using an orchestrator and seven specialist agents. Every change passes an independent review before merge. The approved design is the **Editorial (CV version)** artboard on the design canvas.

## Goals

1. Ship the approved editorial design in Next.js: animated hero, featured-projects carousel, project archive, interactive skills, education block, contact.
2. Close the dashboard authentication hole and make content fully manageable from the dashboard: projects, featured order, skills, CV file.
3. Reach production quality: zero console errors, Lighthouse 95+ on all four scores, WCAG 2.2 AA, flawless at 360 px to 1920 px, in both Arabic and English.

## Scope

- Public site: `/ar` (default) and `/en`, home page, project case-study pages, 404.
- Dashboard: login, projects CRUD, image uploads, site settings, CV upload.
- Only projects that have a GitHub repository are shown.

## Non-goals

- No Salla content anywhere: code, copy, categories, database values.
- No blog, CMS migration or redesign of the dashboard's visual style beyond consistency fixes.

## Tech decisions

| Area           | Decision                                                                  | Why                                                              |
| -------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Framework      | Keep Next.js 15 App Router, React 19, TypeScript strict                   | Already in place; no migration risk                              |
| Styling        | Tailwind CSS 4 with design tokens in `globals.css` `@theme`               | One source for colours, type, spacing                            |
| Motion         | Framer Motion for component motion; CSS for marquee and rings             | Framer Motion handles enter/exit and `useReducedMotion`          |
| Scroll effects | Framer Motion `useScroll` / `whileInView` (no GSAP unless a need appears) | One motion library keeps the bundle small                        |
| Fonts          | `next/font/google`: Alexandria, IBM Plex Sans Arabic, IBM Plex Mono       | Self-hosted, no layout shift; drop the 4 unused local font files |
| i18n           | next-intl messages for every string; no hard-coded copy in components     | Current AR page still shows English labels                       |
| Data           | Supabase Postgres + Storage; server-only service-role client              | Existing setup                                                   |
| Auth           | Signed session cookie (HMAC via jose) or Supabase Auth                    | Replaces the forgeable static cookie                             |
| Validation     | Zod schemas shared by forms and server actions                            | One contract, checked on both sides                              |
| Testing        | Vitest (unit), Playwright (e2e + visual), axe-core (a11y), Lighthouse CI  | Automated gates for every PR                                     |

## Current-state audit

The repo has one critical security bug and several correctness bugs that the rebuild must fix first. Findings come from a full read of commit `0dd39f5` (2026-06-17). Re-verified by A0 on 2026-11-20; additions are in DECISIONS.md.

| #   | Severity | Area    | Finding                                                                                                                                                                            | File                                                                |
| --- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A1  | Critical | Auth    | Session cookie is the constant `dashboard_token=authenticated`. Anyone can set it and call every server action with the service-role key.                                          | `src/actions/auth.ts`, `src/lib/dashboard-auth.ts`, `middleware.ts` |
| A2  | High     | Auth    | Password compared with `!==` (not timing-safe); no rate limit or lockout on login.                                                                                                 | `src/actions/auth.ts`                                               |
| A3  | High     | Uploads | Server checks only `file.type.startsWith("image/")`, which accepts `image/svg+xml` (stored XSS on a public bucket) and trusts client MIME.                                         | `src/actions/projects.ts`                                           |
| A4  | Medium   | Uploads | `src/lib/upload.ts` uploads from the browser with the anon key; it is unused, but only works if Storage allows anon writes. Delete it and verify bucket policies deny anon insert. | `src/lib/upload.ts`                                                 |
| B1  | High     | Caching | Mutations call `revalidatePath("/")` only; `/ar`, `/en` and `/[locale]/projects/[slug]` stay stale.                                                                                | `src/actions/projects.ts`                                           |
| B2  | Medium   | Data    | `getProjects` silently falls back to mock projects on any DB error, hiding outages and showing fake data in production.                                                            | `src/lib/projects.ts`                                               |
| B3  | Medium   | Data    | Deleting a project leaves its images in Storage (orphans).                                                                                                                         | `src/actions/projects.ts`                                           |
| B4  | Medium   | Data    | `category` enum still contains `salla`; DB rows and seed script carry Salla data.                                                                                                  | `src/types/index.ts`, `scripts/seed-projects.mjs`                   |
| B5  | Low      | Data    | `getProjectBySlug` fetches every project to find one.                                                                                                                              | `src/lib/projects.ts`                                               |
| I1  | High     | i18n    | Most copy is hard-coded in components; next-intl messages are barely used, so `/ar` shows English labels.                                                                          | `src/components/sections/*`                                         |
| I2  | Medium   | i18n    | Root `<html lang="en">` is fixed; `dir` is set on an inner div. Root redirects to `/en` although the audience is Arabic-first.                                                     | `src/app/layout.tsx`, `src/app/page.tsx`                            |
| P1  | Medium   | Perf    | Hero PNG is 1.0 MB; two unused 1.6 MB PNGs and an unused 264 KB font ship in `public/`.                                                                                            | `public/`                                                           |
| P2  | Medium   | Perf    | `filter: blur()` animations on every section are expensive on mobile.                                                                                                              | `src/app/globals.css`                                               |
| D1  | Medium   | Content | Skill percentage bars and the unverified "70+ clients" stat weaken credibility.                                                                                                    | `AboutSection.tsx`                                                  |
| D2  | Low      | SEO     | No per-locale metadata, Open Graph image, sitemap or robots.txt.                                                                                                                   | `src/app`                                                           |
| C1  | Low      | Code    | Dead branch in `middleware.ts`; no tests; no CI.                                                                                                                                   | repo                                                                |

## Agent roster

An orchestrator and seven specialists, each with one area of ownership; no agent reviews its own work. File ownership prevents two agents editing the same file in parallel.

| Agent              | Role                                                                                      | Owns (writes)                                                                                     | Hands off                                         | Must not                               |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| A0 Orchestrator    | Splits work into tickets, assigns agents, resolves conflicts, merges                      | `docs/PLAN.md`, `docs/TASKS.md`, `docs/DECISIONS.md`                                              | Ticket with scope, files, acceptance criteria     | Write feature code                     |
| A1 Security & Data | Auth, sessions, server actions, Supabase schema, migrations, RLS, Storage policies        | `src/actions/*`, `src/lib/auth/*`, `src/lib/supabase/*`, `supabase/migrations/*`, `middleware.ts` | Typed data API (`src/lib/data/*`) + Zod schemas   | Touch UI components                    |
| A2 Design System   | Tokens, fonts, primitives (Button, Tag, SectionHeader, Reveal), motion presets            | `src/app/globals.css`, `src/components/ui/*`, `src/lib/motion.ts`                                 | Documented primitives with usage examples         | Build page sections                    |
| A3 Public Site     | Hero, spec strip, featured carousel, archive, skills, education, contact, case-study page | `src/components/sections/*`, `src/components/projects/*`, `src/app/[locale]/*`                    | Sections wired to A1's data API and A4's messages | Hard-code copy or colours              |
| A4 Content & i18n  | All AR/EN copy from the CV, metadata, Open Graph, sitemap, robots                         | `src/messages/*.json`, `src/app/sitemap.ts`, `src/app/robots.ts`, metadata files                  | Complete, reviewed message files                  | Change layout or logic                 |
| A5 Dashboard       | Login UI, projects CRUD, ordering, featured toggle, uploads UX, settings, CV upload       | `src/app/dashboard/*`, `src/components/dashboard/*`                                               | Working dashboard on A1's API                     | Bypass A1's server actions             |
| A6 QA              | Unit, e2e, visual, a11y and performance tests; CI workflow                                | `tests/*`, `e2e/*`, `.github/workflows/*`, `playwright.config.ts`                                 | Test report per PR                                | Fix product code (files a bug instead) |
| A7 Reviewer        | Independent review of every PR against the checklists in QA gates                         | Review comments only                                                                              | Approve or request changes                        | Review a PR it contributed to          |

Every agent starts by reading `docs/PLAN.md`, `docs/DECISIONS.md` and its ticket, and ends by running `npm run lint && npm run typecheck && npm run test` locally.

## Workflow

Work runs in seven phases (0 to 6) on short-lived branches (`feat/<ticket-id>`) off `main`, each merged by squash after the review loop.

Phases 1–3 start together once tooling is in; the public site and dashboard start when the data API and primitives exist. Inside every phase, a ticket that fails CI or review goes back to its owner, never to another agent.

## Public site tasks

Tickets run in phase order; tickets in the same phase run in parallel when their files do not overlap. Each ticket is one PR.

| ID   | Ticket                                                                                                                                                         | Agent | Depends on  | Acceptance criteria                                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| P0-1 | Tooling: TS strict, typecheck script, Prettier, Husky pre-commit, GitHub Actions (lint, typecheck, test, build)                                                | A6    | —           | CI green on an empty PR; a type error fails CI                                                                      |
| P0-2 | Baseline: Playwright screenshots of the current site at 360/768/1280/1920 px; Lighthouse scores recorded                                                       | A6    | P0-1        | Baseline stored in `e2e/baseline/`                                                                                  |
| P0-3 | Clean-up: delete unused images, fonts, `upload.ts`, dead middleware branch, Salla seed data                                                                    | A1    | P0-1        | `public/` under 300 KB; no `salla` string in repo                                                                   |
| P2-1 | Tokens + fonts: colours, type scale, spacing, radii, easing in `@theme`; next/font for the 3 families                                                          | A2    | P0-1        | No hex colour or font name outside `globals.css`; CLS 0                                                             |
| P2-2 | Primitives + motion presets: Button, Tag, SectionHeader, Reveal, LineReveal, Marquee; one `motion.ts` with durations and easings                               | A2    | P2-1        | Every motion respects `useReducedMotion`; Storybook-style demo page at `/dev/ui` (dev only)                         |
| P3-1 | AR/EN message files from the CV; ESLint rule blocking JSX string literals                                                                                      | A4    | P0-1        | `/ar` and `/en` show zero untranslated strings                                                                      |
| P3-2 | Locale plumbing: `<html lang dir>` from locale, `/` redirects to `/ar`, language switch keeps the current path                                                 | A4    | P3-1        | `curl /ar` shows `lang="ar" dir="rtl"` on `<html>`                                                                  |
| P3-3 | SEO: per-locale metadata, OG image (1200×630), `sitemap.ts`, `robots.ts`, hreflang                                                                             | A4    | P3-2        | Rich-results and OG debuggers pass                                                                                  |
| P4-1 | Header: sticky, mobile menu sheet with focus trap and Esc to close, CV download                                                                                | A3    | P2-2, P3-1  | Keyboard-only navigation works; no layout shift on scroll                                                           |
| P4-2 | Hero: line reveal, rotating role words, portrait clipped inside the circle, rotating text ring, two CTAs                                                       | A3    | P2-2        | LCP < 2.0 s on mobile; portrait never exceeds its circle at any width; rotating words have a static accessible name |
| P4-3 | Spec strip: 4 cells (specialty, role, core stack, status + Gaza clock)                                                                                         | A3    | P2-2        | One column below 560 px; clock hydrates without mismatch warnings                                                   |
| P4-4 | Featured carousel: `featured = true` ordered by `featured_order`; autoplay 6.5 s with progress bar; pause on hover, focus and hidden tab; arrow keys and swipe | A3    | A1 data API | Tabs follow the WAI-ARIA tabs pattern; reduced motion disables autoplay                                             |
| P4-5 | Archive: all projects with a `github_url`, hover fill, link to case study                                                                                      | A3    | A1 data API | Projects without a GitHub URL never render                                                                          |
| P4-6 | Skills: tabs + tiles from the skills table; each tile lists the projects that use it                                                                           | A3    | A1 data API | Tile count per tab matches the database                                                                             |
| P4-7 | Education, contact, footer                                                                                                                                     | A3    | P3-1        | Contrast 4.5:1 or more on the dark block                                                                            |
| P4-8 | Case-study page `/[locale]/projects/[slug]`: `generateStaticParams`, gallery, stack, links, `notFound()`                                                       | A3    | A1 data API | Unknown slug returns 404, not a crash                                                                               |
| P4-9 | `not-found.tsx`, `error.tsx`, `loading.tsx` per route group                                                                                                    | A3    | P2-2        | Forced DB error shows the error page, never mock data                                                               |

## Dashboard and data tasks

Auth is fixed first (D1-1) and blocks every other data ticket; nothing ships while A1 is open.

### Auth design (D1-1)

- On login, verify the password with `bcrypt.compare` (constant-time) against `DASHBOARD_PASSWORD_HASH`; never compare plain text with `!==`.
- Issue a JWT signed with `SESSION_SECRET` (32+ random bytes) via jose: `{ sub: "admin", iat, exp: 8h }`, cookie `httpOnly`, `secure`, `sameSite=strict`, `path=/`.
- Verify the signature in `middleware.ts` (edge-safe jose) AND again inside every server action via `requireAdmin()`; middleware alone is not enough.
- Rate-limit login: 5 attempts per 15 minutes per IP (Upstash Ratelimit or a Supabase table).
- Logout clears the cookie; rotating `SESSION_SECRET` logs out every session.

### Data model changes (migration `0002_rebuild.sql`)

```sql
-- projects: drop salla, add GitHub-first fields
alter table projects drop constraint if exists projects_category_check;
update projects set category = 'webapp' where category = 'salla';
alter table projects add constraint projects_category_check
  check (category in ('webapp','system','platform','store'));
alter table projects
  add column if not exists label text check (label in ('training','graduation','applied')),
  add column if not exists featured_order int,
  add column if not exists highlights_ar text[] default '{}',
  add column if not exists highlights_en text[] default '{}',
  add column if not exists published boolean default true;

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbr text not null,
  category text not null check (category in ('frontend','backend','database','infra')),
  order_num int default 0
);
create table if not exists project_skills (
  project_id uuid references projects(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (project_id, skill_id)
);
alter table skills enable row level security;
alter table project_skills enable row level security;
create policy "public read skills" on skills for select to anon using (true);
create policy "public read project_skills" on project_skills for select to anon using (true);
```

> Note: this draft has known gaps (pos/other rows, published visibility, no 0001 baseline). See DECISIONS.md D-002 to D-004 before applying.

| ID   | Ticket                                                                                                                                | Agent | Depends on | Acceptance criteria                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- | ---------------------------------------------------------------------------------- |
| D1-1 | Signed-session auth, `requireAdmin()` in every action, login rate limit                                                               | A1    | P0-1       | A forged cookie gets 401/redirect; e2e test proves it                              |
| D1-2 | Migration `0002_rebuild.sql` + typed data API (`getProjects`, `getFeatured`, `getSkills`, `getProjectBySlug` with `.eq('slug')`)      | A1    | D1-1       | Generated Supabase types; no `any`; DB errors throw instead of returning mock data |
| D1-3 | Upload hardening: allow only PNG/JPEG/WebP/AVIF by magic bytes (file-type), max 5 MB, re-encode to WebP with sharp, random file names | A1    | D1-1       | An SVG or a renamed .exe is rejected server-side                                   |
| D1-4 | Revalidation: `revalidateTag('projects')` / `revalidateTag('skills')` on every mutation; data fetches tagged                          | A1    | D1-2       | Edit in dashboard → `/ar`, `/en` and the case-study page update within one request |
| D1-5 | Delete cleanup: remove a project's Storage folder when the row is deleted                                                             | A1    | D1-3       | No orphan files after delete (checked by test)                                     |
| D5-1 | Projects table: search, published toggle, featured toggle, drag-to-reorder for `order_num` and `featured_order`                       | A5    | D1-2       | Reorder persists after reload; optimistic UI rolls back on error                   |
| D5-2 | Project form: AR/EN tabs, label, highlights, skills multi-select, GitHub URL required, slug auto-generated and editable               | A5    | D1-2       | Zod errors show next to each field in both languages; unsaved-changes warning      |
| D5-3 | Image manager: drag-and-drop, preview, reorder, set cover, delete; progress per file                                                  | A5    | D1-3       | Upload of 6 images at 5 MB each succeeds on a slow 3G profile                      |
| D5-4 | Skills manager: CRUD + category + order                                                                                               | A5    | D1-2       | Changes appear in the public Skills tabs                                           |
| D5-5 | Settings: contact links (validated URLs/phone), CV upload (PDF only, 5 MB) served at `/cv.pdf`                                        | A5    | D1-3       | Header CV button downloads the current file                                        |
| D5-6 | Dashboard polish: empty states, toasts, confirm dialogs, keyboard shortcuts, RTL-correct layout                                       | A5    | D5-1       | axe-core shows zero serious issues on every dashboard page                         |

## Bug forecast and risk register

These are the bugs most likely to appear in this stack, each paired with the test that catches it before merge. A7 checks every PR against this list.

| #   | Likely bug                                                                                                  | Where                 | Prevention                                                                     | Catching test                                          |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| R1  | Hydration mismatch from the live Gaza clock or `Date.now()` in render                                       | Spec strip, education | Render the clock only after mount (`useEffect`), server renders `--:--`        | Playwright: zero console errors on load                |
| R2  | RTL breakage: arrows point the wrong way, left/right instead of logical properties, carousel swipe reversed | All sections          | Use start/end, `ps-`/`pe-`, `ms-`/`me-`; mirror icons with `rtl:-scale-x-100`  | Visual snapshots of `/ar` and `/en`                    |
| R3  | Arabic glyphs clipped or lines overlapping from tight line-height or negative letter-spacing                | Headlines             | line-height 1.2+ for Arabic display; `letter-spacing: 0` on Arabic             | Visual snapshot at 360 px                              |
| R4  | Horizontal scroll on mobile from the marquee, rotated elements or `100vw` widths                            | Hero, marquee, footer | `overflow-x: clip` on the root; avoid `100vw`                                  | e2e: `scrollWidth === clientWidth` at 360 px           |
| R5  | Carousel timer leaks or double-fires after navigation; keeps running in a hidden tab                        | Featured              | Clear the interval in cleanup; pause on `visibilitychange`                     | Unit test with fake timers                             |
| R6  | Framer Motion runs on the server or blocks LCP                                                              | Hero                  | Motion in client leaves only; the LCP portrait is not opacity-0 at first paint | Lighthouse LCP budget                                  |
| R7  | Stale public pages after a dashboard edit                                                                   | Caching               | Tag-based revalidation (D1-4)                                                  | e2e: edit title, reload `/ar`, see new title           |
| R8  | Server action callable without a session                                                                    | Every action          | `requireAdmin()` as the first line; a test that lists all exported actions     | e2e: call each action with a forged cookie, expect 401 |
| R9  | Slug collision or slug change breaks links                                                                  | Projects              | Unique index; lock the slug after publish or keep a redirect                   | Unit test on duplicate slug                            |
| R10 | Large uploads exceed the server-action body limit (8 MB) and fail silently                                  | Image manager         | Client-side size check + one file per request + visible error                  | e2e with a 9 MB file                                   |
| R11 | `next/image` refuses a new Supabase host                                                                    | Images                | Keep `remotePatterns` in sync with the project URL                             | Build-time check                                       |
| R12 | Env vars missing in Vercel preview, so the site renders empty                                               | Deploy                | Validate env with Zod at boot (`src/lib/env.ts`); fail the build               | CI build with an empty `.env` fails loudly             |
| R13 | Reduced-motion users still get autoplay and parallax                                                        | All motion            | Shared `useReducedMotion` gate in `motion.ts`                                  | Playwright with `reducedMotion: 'reduce'`              |
| R14 | Focus lost or trapped after closing the mobile menu or a dashboard dialog                                   | Header, dashboard     | Return focus to the trigger; use a tested dialog primitive                     | axe + keyboard e2e                                     |
| R15 | Mixed-direction text (English stack names inside Arabic) renders out of order                               | Tags, meta lines      | Wrap Latin runs in `<bdi>` or `dir="ltr"` spans                                | Visual snapshot                                        |

R16–R21 were added by A0 on 2026-11-20; see DECISIONS.md D-009. The Motion and Scroll-effects rows in Tech decisions are superseded by D-013 (CSS first).

### Project risks

- Scope creep from design tweaks: A0 freezes the design after P4-2; later ideas go to a backlog.
- Agents editing the same file: the ownership table prevents it; A0 rejects tickets that cross owners.
- Missing screenshots for project cards: A4 collects real screenshots before P4-4 starts; placeholders never ship.

## QA gates

A PR merges only when all five gates pass; A6 automates gates 1–4 in CI and A7 runs gate 5 by hand.

1. **Static:** lint, typecheck, `next build` with zero warnings; no `any`, no `// @ts-ignore`, no `console.log`.
2. **Tests:** Vitest for utilities, schemas and the carousel timer; Playwright e2e for the critical paths below; coverage of `src/lib` and `src/actions` at 80% or more.
3. **Visual:** Playwright screenshots of `/ar` and `/en` at 360, 768, 1280 and 1920 px; any diff over 0.1% needs A7's approval.
4. **Quality budgets:** Lighthouse CI on the Vercel preview (mobile): Performance 95, Accessibility 100, Best Practices 100, SEO 100; LCP under 2.0 s, CLS under 0.05, total JS under 180 KB gzipped on `/ar`; axe-core zero serious or critical issues.
5. **Independent review (A7):** reads the diff cold, runs the preview, and checks the list below.

### Critical e2e paths

- **Visitor:** `/` → `/ar`, carousel advances, archive link opens a case study, language switch keeps the path, CV downloads.
- **Admin:** login → create project with images → feature it → public carousel shows it → delete it → files gone.
- **Attacker:** forged cookie, SVG upload, 6th login attempt, direct server-action POST without session — all rejected.

### Reviewer checklist (A7)

- [ ] Matches the approved design at every breakpoint; no overlapping lines, no clipped Arabic glyphs.
- [ ] Logical CSS properties only; correct in RTL and LTR.
- [ ] Every string comes from the message files, in both languages.
- [ ] Every interactive element is reachable by keyboard, has a visible focus ring and an accessible name.
- [ ] Contrast 4.5:1 for text, 3:1 for large text and UI borders.
- [ ] Motion respects reduced-motion; no animation blocks content.
- [ ] Server actions start with `requireAdmin()` and validate input with Zod.
- [ ] No secret, service-role key or hash reaches the client bundle (grep the `.next` output).
- [ ] Errors are handled and shown; nothing falls back to mock data in production.
- [ ] The R-list risks touched by this PR have a test.

## Launch checklist

The rebuild is done when every box below is ticked on the production URL, not on a preview.

- [ ] All Critical, High and Medium audit findings closed, each with a linked PR.
- [ ] `SESSION_SECRET`, `DASHBOARD_PASSWORD_HASH`, Supabase keys set in Vercel Production and Preview; old `DASHBOARD_PASSWORD` removed.
- [ ] Supabase: migration applied, RLS on every table, Storage buckets deny anon writes, old Salla rows gone.
- [ ] Real screenshots uploaded for every featured project; no placeholder visible.
- [ ] Only projects with a GitHub URL are published.
- [ ] CV PDF uploaded and downloadable from the header.
- [ ] QA gates 1–5 green on the production deploy.
- [ ] Tested by hand on a real Android phone and iPhone, in Arabic and English.
- [ ] Vercel Analytics or Speed Insights on; 404 and error pages checked.

## Agent prompts

### Orchestrator kickoff prompt (A0)

```text
You are the orchestrator for the mohammed-salha-portfolio rebuild.
Read docs/PLAN.md (this plan) and the repo. Do not write feature code.
1. Create docs/TASKS.md with every ticket from the plan: ID, agent, depends on, acceptance criteria, status.
2. Start Phase 0, then D1-1 (auth) before any other data ticket.
3. For each ticket, brief the owning agent with: goal, files it may edit, files it must not edit, acceptance criteria, risks from the R-list.
4. After each PR, send it to the Reviewer (A7). Merge only after CI is green and A7 approves.
5. Record every decision that changes the plan in docs/DECISIONS.md.
```

### Specialist ticket prompt (A1–A6)

```text
Ticket: <ID> — <title>
You own: <files/folders>. Do not edit anything else; if you need a change elsewhere, stop and report it.
Goal: <one sentence>
Acceptance criteria: <copied from the plan>
Risks to guard against: <R-numbers>
Before you finish:
- Run lint, typecheck, tests and build; fix every error and warning.
- Add or update tests that prove each acceptance criterion.
- Check RTL and LTR at 360, 768 and 1280 px.
- List what you changed, what you could not verify, and any bug you expect.
```

### Reviewer prompt (A7)

```text
You are reviewing PR <number> cold. You did not write it.
Assume it has at least one bug and find it.
1. Read the ticket and the diff. Check every acceptance criterion with evidence.
2. Run the preview at 360/768/1280/1920 px in /ar and /en; look for overlap, clipping, RTL errors, layout shift.
3. Walk the reviewer checklist and the R-list items this PR touches.
4. Try to break it: bad input, slow network, keyboard only, reduced motion, forged session.
5. Reply APPROVE or REQUEST CHANGES with a numbered list: file, line, problem, fix.
```
