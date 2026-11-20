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

| # | Likely bug | Where | Prevention | Catching test |
|---|---|---|---|---|
| R16 | bcrypt hash truncated by `$` expansion; login always fails | Env, D1-1 | D-007 (base64) | Unit test on env parsing with a real hash |
| R17 | Unpublished or GitHub-less project readable via the anon REST API | RLS, D1-2 | D-004 policy | Integration test: anon `select` on an unpublished row returns nothing |
| R18 | `cookies()` called inside a cached data function, so the build fails or caching is silently off | Data API, D1-4 | D-008 | Build in CI + e2e for R7 |
| R19 | Framer Motion's full bundle blows the 180 KB JS budget | Public site | CSS-first motion (D-013); if Framer Motion is used, `LazyMotion` + `domAnimation` + `m.*` only | Lighthouse CI JS budget |
| R20 | `-webkit-text-stroke` outline text shows seams where Arabic glyphs join, or vanishes in forced-colours mode | Hero h1, section h2s, footer wordmark | Check Alexandria at 800/900; `forced-colors` fallback to solid text | Visual snapshot at 360 and 1280 px, AR and EN |
| R21 | Logo, ring text or physical-direction keyframes copied from the RTL-only mockup animate from the wrong side in `/en` | All sections | SPEC.md §3 and V-2 | Visual snapshots of `/en` mid-animation (animations paused at a fixed frame) |

## D-010 Ownership gaps — Accepted

Files no agent owned in the roster are assigned here. Only the named owner edits them; anyone else files a request with A0.

| File(s) | Owner | Reason |
|---|---|---|
| `src/app/layout.tsx`, `src/app/page.tsx`, `src/i18n/*` | A4 | Locale plumbing (P3-2) |
| Route-group root layouts `src/app/(site)/`, `src/app/(dashboard)/` | A4 creates, A3 / A5 fill | `<html lang dir>` must come from the locale while the dashboard stays outside `[locale]`; this needs two root layouts via route groups |
| `next.config.ts`, `src/types/*`, `src/lib/env.ts`, `src/lib/projects.ts`, `src/lib/site-settings.ts`, `src/data/*`, `scripts/*`, `.env.example`, `README.md` | A1 | Data, env and config |
| `package.json`, `package-lock.json` | Ticket owner, serialised by A0 | Merge one dependency change at a time to avoid lockfile conflicts |

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
- **Line endings:** `.gitattributes` forces LF in the working copy; without it, Windows checkouts get CRLF and `prettier --check` fails locally.
- **Lint:** `npm run lint` fails on any warning. `no-console` (except `warn`/`error`) applies to `src/**` and `middleware.ts`; CLI scripts under `scripts/` may print.
- **Node:** 22 (`.nvmrc`, `engines >=22.12`), used by CI and Vercel.
- **Vitest:** `vitest.config.mts` (ESM, so Vite loads it without warnings); tests live in `tests/**` (A6) and may sit next to code as `src/**/*.test.ts`.
- **CI build without secrets:** the CI build runs with no Supabase env and currently passes on the mock fallback. When D1-2 removes the fallback and R12 makes missing env fail the build, CI needs either repository secrets or explicit dummy values; A1 and A6 settle this in D1-2.
- **Pre-commit:** Husky runs `lint-staged` (ESLint `--fix` + Prettier on staged files). Typecheck and tests run in CI, not in the hook, to keep commits fast.

## D-018 How D1-1 was built — Accepted (2026-11-20)

- **Guard shape:** `requireAdmin()` returns `null` for a valid session or the `{ success: false, message: "Unauthorized." }` result, so the first two lines of every action are `const denied = await requireAdmin(); if (denied) return denied;`. It does not throw, because the dashboard forms (A5) already render result objects and a thrown error would surface as an unhandled rejection. Pages use `requireAdminPage()` (redirects). `src/lib/dashboard-auth.ts` stays as a one-line re-export so A5's pages need no edits.
- **Cookie:** renamed to `dashboard_session`. The old `dashboard_token` is never read; login, logout and the middleware clear it.
- **Fail closed:** without `SESSION_SECRET` (32+ chars), a valid `DASHBOARD_PASSWORD_HASH`, or a reachable `login_attempts` table, login is refused and every dashboard page redirects to login. This makes deploying D1-1 safe even before the env vars are set: the dashboard is locked, not open. It also means local dashboard login needs Supabase env and the migration applied.
- **Migrations:** `0000_baseline` (D1-2), `0001_login_attempts` (D1-1), `0002_rebuild` (D1-2), applied in name order.
- **Rate limit scope:** per client IP, salted SHA-256 hash only. An attacker rotating IPs is limited only by bcrypt cost (12) and password strength; `scripts/hash-password.mjs` requires 12+ characters. A global limit is in the backlog.
- **Middleware:** rewritten for the signed session, which also removed the dead branch from audit C1 (part of P0-3).
- **E2E proof:** acceptance is covered by Vitest (middleware with 7 forged-token variants; every exported action called without and with forged sessions, with a check that a missing guard fails the test) and by HTTP probes against a production build. The Playwright version of the "Attacker" path lands with P0-2, which sets Playwright up.

## Backlog (not in scope until A0 schedules it)

- Global login limit across all IPs (D-018).

- Content-Security-Policy and security headers in `next.config.ts` (A1).
- Slug redirects table if slugs ever change after publish (R9 alternative).
