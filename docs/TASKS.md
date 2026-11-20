# Tasks

Owned by A0. Status values: `todo` · `ready` (all dependencies merged) · `in-progress` · `in-review` · `changes-requested` · `done` · `blocked`.
Branch per ticket: `feat/<ticket-id>` off `main`, squash-merged after CI is green and A7 approves.

Phase map (see DECISIONS.md D-001): **0** tooling and clean-up · **1** security and data (D1) · **2** design system (P2) · **3** content and i18n (P3) · **4** public site (P4) · **5** dashboard (D5) · **6** launch.

Inputs: design in [design/SPEC.md](design/SPEC.md) (D-012), content in [CONTENT.md](CONTENT.md) (D-014). Every A2/A3 ticket must also satisfy the SPEC deviations it touches (V-1 to V-12).

## Critical path

`P0-1` → `D1-1` → `D1-2` → (`D1-3`, `D1-4`) → `P4-4` / `P4-5` / `P4-6` / `P4-8` and `D5-*`.
Phases 1, 2 and 3 start together once `P0-1` is merged. **No data ticket starts before `D1-1` is merged.**

## Phase 0 — Tooling and clean-up

| ID   | Ticket                                                                                                                                                                                                      | Agent | Depends on | Acceptance criteria                               | Risks | Status                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- | ------------------------------------------------- | ----- | ---------------------------------------------------------- |
| P0-1 | Tooling: TS strict (already on), `typecheck` and `test` scripts, Prettier, Husky pre-commit, Vitest skeleton, GitHub Actions (lint, typecheck, test, build); ignore `docs/design/**` in ESLint and Prettier | A6    | —          | CI green on an empty PR; a type error fails CI    | R12   | done: PR #1 merged 2026-11-20 (merge commit, D-017)        |
| P0-2 | Baseline: Playwright screenshots of the current site at 360/768/1280/1920 px; Lighthouse scores recorded                                                                                                    | A6    | P0-1       | Baseline stored in `e2e/baseline/`                | —     | in-review: PR for `feat/P0-2`; baseline in `e2e/baseline/` |
| P0-3 | Clean-up: delete unused images, fonts, `src/lib/upload.ts`, Salla seed data (dead middleware branch already removed in D1-1)                                                                                | A1    | P0-1       | `public/` under 300 KB; no `salla` string in repo | R11   | todo                                                       |

## Phase 1 — Security and data (A1)

| ID   | Ticket                                                                                                                                                                    | Agent | Depends on | Acceptance criteria                                                                                                   | Risks        | Status                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- | --------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| D1-1 | Signed-session auth (jose JWT, bcrypt hash), `requireAdmin()` first line of every action, login rate limit                                                                | A1    | P0-1       | A forged cookie gets 401/redirect; e2e test proves it                                                                 | R8, R12, R16 | done: PR #2 merged 2026-11-20; verified on production (forged cookies redirected, 6th login refused) |
| D1-2 | `0000_baseline.sql` (current schema from README) + `0002_rebuild.sql` + typed data API (`getProjects`, `getFeatured`, `getSkills`, `getProjectBySlug` with `.eq('slug')`) | A1    | D1-1       | Generated Supabase types; no `any`; DB errors throw instead of returning mock data; anon cannot read unpublished rows | R9, R17      | todo                                                                                                 |
| D1-3 | Upload hardening: PNG/JPEG/WebP/AVIF by magic bytes (file-type), max 5 MB, re-encode to WebP with sharp, random file names, `upsert: false`                               | A1    | D1-1       | An SVG or a renamed .exe is rejected server-side                                                                      | R10, R11     | todo                                                                                                 |
| D1-4 | Revalidation: `revalidateTag('projects')` / `revalidateTag('skills')` / `revalidateTag('settings')` on every mutation; data fetches tagged                                | A1    | D1-2       | Edit in dashboard → `/ar`, `/en` and the case-study page update within one request                                    | R7, R18      | todo                                                                                                 |
| D1-5 | Delete cleanup: remove a project's Storage folder when the row is deleted                                                                                                 | A1    | D1-3       | No orphan files after delete (checked by test)                                                                        | —            | todo                                                                                                 |

## Phase 2 — Design system (A2)

| ID   | Ticket                                                                                                                                 | Agent | Depends on | Acceptance criteria                                                                                      | Risks                      | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------- | -------------------------------------------------------------------------------------------------------- | -------------------------- | ------ |
| P2-1 | Tokens + fonts: colours, type scale, spacing, radii, easing in `@theme`; next/font for Alexandria, IBM Plex Sans Arabic, IBM Plex Mono | A2    | P0-1       | No hex colour or font name outside `globals.css`; CLS 0                                                  | R3                         | todo   |
| P2-2 | Primitives + motion presets (CSS-first, D-013): Button, Tag, SectionHeader, Reveal, LineReveal, Marquee; `src/lib/motion.ts`           | A2    | P2-1       | Every motion respects reduced motion; demo page at `/dev/ui` (dev only); motion mirrors correctly in LTR | R4, R6, R13, R19, R20, R21 | todo   |

## Phase 3 — Content and i18n (A4)

| ID   | Ticket                                                                                                         | Agent | Depends on | Acceptance criteria                                | Risks | Status |
| ---- | -------------------------------------------------------------------------------------------------------------- | ----- | ---------- | -------------------------------------------------- | ----- | ------ |
| P3-1 | AR/EN message files from the CV; ESLint rule blocking JSX string literals                                      | A4    | P0-1       | `/ar` and `/en` show zero untranslated strings     | R15   | todo   |
| P3-2 | Locale plumbing: `<html lang dir>` from locale, `/` redirects to `/ar`, language switch keeps the current path | A4    | P3-1       | `curl /ar` shows `lang="ar" dir="rtl"` on `<html>` | R2    | todo   |
| P3-3 | SEO: per-locale metadata, OG image (1200×630), `sitemap.ts`, `robots.ts`, hreflang                             | A4    | P3-2       | Rich-results and OG debuggers pass                 | —     | todo   |

## Phase 4 — Public site (A3)

| ID   | Ticket                                                                                                                                     | Agent | Depends on | Acceptance criteria                                                                                                                        | Risks           | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------ |
| P4-1 | Header: sticky, mobile menu sheet with focus trap and Esc, CV download                                                                     | A3    | P2-2, P3-1 | Keyboard-only navigation works; no layout shift on scroll                                                                                  | R14             | todo   |
| P4-2 | Hero: line reveal, rotating role words, portrait clipped inside circle, rotating text ring, two CTAs; design's WebP portrait (D-016)       | A3    | P2-2       | LCP < 2.0 s mobile; portrait never exceeds its circle; rotating words have a static accessible name; portrait visible at first paint (V-1) | R3, R4, R6, R20 | todo   |
| P4-3 | Spec strip: specialty, role, core stack, status + Gaza clock                                                                               | A3    | P2-2       | One column below 560 px; clock hydrates without mismatch warnings                                                                          | R1, R15         | todo   |
| P4-4 | Featured carousel: `featured` ordered by `featured_order`; autoplay 6.5 s with progress; pause on hover/focus/hidden tab; arrows and swipe | A3    | D1-2, P2-2 | WAI-ARIA tabs pattern; reduced motion disables autoplay                                                                                    | R2, R5, R13     | todo   |
| P4-5 | Archive: all projects with a `github_url`, hover fill, link to case study                                                                  | A3    | D1-2, P2-2 | Projects without a GitHub URL never render                                                                                                 | R2              | todo   |
| P4-6 | Skills: tabs + tiles from the skills table; each tile lists projects using it                                                              | A3    | D1-2, P2-2 | Tile count per tab matches the database                                                                                                    | R15             | todo   |
| P4-7 | Education, contact, footer                                                                                                                 | A3    | P2-2, P3-1 | Contrast ≥ 4.5:1 on the dark block                                                                                                         | R4              | todo   |
| P4-8 | Case-study page `/[locale]/projects/[slug]`: `generateStaticParams`, gallery, stack, links, `notFound()`                                   | A3    | D1-2       | Unknown slug returns 404, not a crash                                                                                                      | R11             | todo   |
| P4-9 | `not-found.tsx`, `error.tsx`, `loading.tsx` per route group                                                                                | A3    | P2-2       | Forced DB error shows the error page, never mock data                                                                                      | —               | todo   |

**Design freeze:** after P4-2 merges (see PLAN.md, Project risks). **Content gate:** before P4-4 starts, A4 delivers real project screenshots and the owner supplies GitHub URLs for the featured projects (D-011 item 5); otherwise the carousel has nothing to show.

## Phase 5 — Dashboard (A5)

| ID   | Ticket                                                                                                      | Agent | Depends on | Acceptance criteria                                                      | Risks   | Status |
| ---- | ----------------------------------------------------------------------------------------------------------- | ----- | ---------- | ------------------------------------------------------------------------ | ------- | ------ |
| D5-1 | Projects table: search, published/featured toggles, drag-to-reorder `order_num` and `featured_order`        | A5    | D1-2       | Reorder persists after reload; optimistic UI rolls back on error         | R14     | todo   |
| D5-2 | Project form: AR/EN tabs, label, highlights, skills multi-select, GitHub URL required, slug auto + editable | A5    | D1-2       | Zod errors next to each field in both languages; unsaved-changes warning | R9      | todo   |
| D5-3 | Image manager: drag-and-drop, preview, reorder, set cover, delete; per-file progress                        | A5    | D1-3       | 6 × 5 MB upload succeeds on slow 3G                                      | R10     | todo   |
| D5-4 | Skills manager: CRUD + category + order                                                                     | A5    | D1-2       | Changes appear in the public Skills tabs                                 | R7      | todo   |
| D5-5 | Settings: contact links (validated URLs/phone), CV upload (PDF only, 5 MB) served at `/cv.pdf`              | A5    | D1-3       | Header CV button downloads the current file                              | R7      | todo   |
| D5-6 | Dashboard polish: empty states, toasts, confirm dialogs, shortcuts, RTL-correct layout                      | A5    | D5-1       | axe-core zero serious issues on every dashboard page                     | R2, R14 | todo   |

## Phase 6 — Launch

| ID  | Ticket                                                                                                    | Agent      | Depends on | Acceptance criteria               | Risks    | Status                                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------- | ---------- | ---------- | --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L-1 | Production env + Supabase: apply migrations, verify RLS and Storage policies, remove `DASHBOARD_PASSWORD` | Owner + A1 | all D1     | Launch checklist items 2–3 ticked | R12, R16 | in-progress: `0001_login_attempts` applied and verified, `DASHBOARD_PASSWORD_HASH` and `SESSION_SECRET` set, old `DASHBOARD_PASSWORD` removed (2026-11-20) |
| L-2 | Production QA: gates 1–5 on production, real-device test in AR and EN, analytics on                       | A6 + A7    | all        | Launch checklist fully ticked     | all      | todo                                                                                                                                                       |

## Audit coverage

| Finding                         | Closed by                                 |
| ------------------------------- | ----------------------------------------- |
| A1 Forgeable cookie             | D1-1                                      |
| A2 Plain compare, no rate limit | D1-1                                      |
| A3 SVG / client MIME uploads    | D1-3                                      |
| A4 Anon upload helper           | P0-3 (delete) + L-1 (bucket policy check) |
| B1 Stale pages                  | D1-4                                      |
| B2 Mock fallback                | D1-2, P4-9                                |
| B3 Orphan files                 | D1-5                                      |
| B4 Salla data                   | P0-3, D1-2                                |
| B5 Fetch-all by slug            | D1-2                                      |
| I1 Hard-coded copy              | P3-1, P4-*                                |
| I2 `<html lang>`, `/` → `/en`   | P3-2                                      |
| P1 Heavy `public/`              | P0-3, P4-2                                |
| P2 `filter: blur()` animations  | P2-1, P2-2                                |
| D1 Skill bars, "70+ clients"    | P3-1, P4-6                                |
| D2 SEO                          | P3-3                                      |
| C1 Dead branch, no tests, no CI | P0-1, P0-3                                |
