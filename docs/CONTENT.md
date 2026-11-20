# Content brief

Owner: A4. Inputs: the CV (`Mohammed Salha Junior Full-Stack Developer - CV.pdf`, received 2026-11-20, kept outside the repo) and the design mockup ([design/SPEC.md](design/SPEC.md)).

**Rule:** the CV is the source of truth for facts (dates, stack, claims). The mockup is the source of truth for tone, structure and Arabic phrasing. When they disagree, follow the CV and list the conflict below for the owner. Contact values (email, phone, WhatsApp, LinkedIn) are **not** copy: they come from dashboard settings (D5-5) and are not written into message files or docs.

## Facts from the CV

- **Name:** Mohammed Majed M Salha (site uses "محمد صالحة" / "Mohammed Salha").
- **Title:** Junior Full-Stack Developer. Based in Gaza, Palestine.
- **Summary:** Computer Engineering graduate; builds complete web apps with TypeScript (Next.js, React) and Python (FastAPI). Shipped a real-time POS with WebSocket barcode scanning and an Arabic RTL marketplace with auth, real-time messaging and subscription billing. Strong fundamentals in data structures, algorithms, databases and testing.
- **Skills:**
  - Languages: TypeScript, Python, SQL
  - Frontend: Next.js, React, Tailwind CSS, Framer Motion, responsive design, RTL (Arabic) UI
  - Backend: FastAPI, Node.js, REST APIs, WebSockets, authentication (NextAuth.js), role-based access control
  - Databases: PostgreSQL (Neon), SQLite, Alembic migrations
  - Tools: Git, GitHub, Cloudflare R2, Upstash Redis, unit testing
- **Education:** Islamic University of Gaza, B.Eng. Computer Engineering, Aug 2020 – Jun 2025, GPA 82.49% (Very Good).
- **Experience:** Data Entry & Data Coordinator, Ofoq Academy (Afaq), Gaza, Jan 2026 – Jun 2026; 2,000+ monthly records across 5+ projects at 99% accuracy; automated Excel reporting that saved 10+ hours per cycle.
- **Languages:** Arabic (native), English (B2).

### Projects in the CV

**Saree3 POS: full-stack point-of-sale platform** (GitHub link in CV)
Stack: FastAPI, TypeScript, WebSockets, PostgreSQL, SQLite, PWA.

- FastAPI backend, REST APIs, desktop cashier interface, mobile PWA that scans barcodes over WebSocket.
- Returns, invoicing, role-based access control, Telegram alerts; local-first architecture with local SSL deployment.
- Dual database support (PostgreSQL and SQLite) with Alembic migrations and async SQLAlchemy; 20+ unit tests.

**Arzaq: Arabic RTL services marketplace** (GitHub link in CV)
Stack: Next.js, TypeScript, Neon PostgreSQL, NextAuth.js v5, Cloudflare R2, Upstash Redis.

- Full-stack RTL marketplace connecting service seekers and providers; relational PostgreSQL schema.
- Auth and sessions with NextAuth.js v5, with security hardening across the auth and data layers.
- Real-time messaging and a subscription revenue model; R2 for storage, Upstash Redis for caching.

## Project inventory

Scope rule: a project is published only if it has a GitHub URL and no Salla content (D-004, non-goals).

| Project                                          | In CV | In mockup               | In seed / DB today                                         | GitHub URL known                     | Publishable now           |
| ------------------------------------------------ | ----- | ----------------------- | ---------------------------------------------------------- | ------------------------------------ | ------------------------- |
| Arzaq                                            | Yes   | Featured 01, archive 01 | `arzaq-marketplace`, live `arzaq-ps.vercel.app`            | **No** (CV links one; seed has none) | Needs URL                 |
| Saree3 POS                                       | Yes   | Featured 02, archive 02 | `saree3-pos` (category `pos`), live `saree3pos.vercel.app` | **No** (CV links one; seed has none) | Needs URL                 |
| Graduation project (project-management platform) | No    | Featured 03, archive 03 | No                                                         | No                                   | Needs URL + details       |
| Al-Amanah car showroom                           | No    | Featured 04, archive 04 | No                                                         | No                                   | Needs URL + details       |
| Al-Nakhba real estate                            | No    | Archive 05              | `al-nakhba-real-estate`                                    | Yes                                  | Yes                       |
| Lamsa beauty store                               | No    | Archive 06              | `lamsa-beauty-store`, category **`salla`**                 | No                                   | **No**: Salla and no repo |
| Oud abaya store                                  | No    | No                      | category `salla`                                           | No                                   | Remove (P0-3)             |
| Lolo kids store                                  | No    | No                      | category `salla`                                           | No                                   | Remove (P0-3)             |

## Conflicts for the owner

| #    | Conflict                           | Mockup says                                           | CV / repo says                                            | A0 proposal                                                                            |
| ---- | ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| C-1  | Saree3 stack                       | FastAPI · React · WebSocket · Python                  | FastAPI, TypeScript, WebSockets, PostgreSQL, SQLite, PWA  | Use the CV list; add React only if the cashier UI is React                             |
| C-2  | Saree3 and Arzaq labels            | "مشروع تدريبي" (training)                             | CV says "shipped"; Arzaq copy says complete and published | Confirm the label; "training" undersells shipped work                                  |
| C-3  | Arzaq URL                          | `arzaq.app`                                           | Seed: `arzaq-ps.vercel.app`                               | Use whichever is live                                                                  |
| C-4  | Saree3 URL                         | `saree3-pos.local`                                    | Seed: `saree3pos.vercel.app`                              | Use the Vercel URL, or hide "live preview"                                             |
| C-5  | Skills not in the CV               | Prisma, MongoDB, Express, Socket.IO, Supabase, Vercel | Absent from CV                                            | Keep only those tied to a published project (each tile must list real projects)        |
| C-6  | Skills in the CV not in the mockup | —                                                     | SQL, Node.js, REST APIs, RBAC, Alembic, unit testing      | Add Node.js, Alembic, testing tiles; leave concepts (REST, RBAC) in project highlights |
| C-7  | Lamsa in the archive               | Shown as a store                                      | Salla, no GitHub                                          | Drop it, unless there is a non-Salla repo                                              |
| C-8  | Experience (Ofoq Academy)          | Not shown                                             | In CV                                                     | Leave off the site (not a dev role); it stays in the downloadable CV                   |
| C-9  | GPA, dates, languages              | Not shown                                             | In CV                                                     | Optional: add dates to the education rows; skip GPA                                    |
| C-10 | Hero claim "مهندس حاسوب"           | Used as title                                         | B.Eng. Computer Engineering                               | Fine as-is                                                                             |

## Message-file structure (for P3-1)

`nav`, `hero` (availability, title lines, rotating words, lead, CTAs, portrait alt, ring text), `spec` (4 cells), `marquee`, `featured` (heading, counter label, prev/next labels, case-study and live buttons), `archive`, `skills` (heading, intro, total label, category names), `education` (rows, closing statement), `contact`, `footer`, `meta` (title, description per locale), `common` (CV download, language switch). Project and skill text lives in the database (AR/EN columns), not in message files.
