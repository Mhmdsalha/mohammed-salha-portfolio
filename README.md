# Mohammed Salha Portfolio

Premium bilingual portfolio for Mohammed Salha with Arabic/English routes, a modern animated hero, Supabase-backed projects, dashboard project management, image uploads, and editable contact settings.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:3000/ar
http://localhost:3000/en
```

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

Set the same variables in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DASHBOARD_PASSWORD=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for dashboard writes, image uploads, and editable contact settings. Keep it secret and never expose it in client code.

Contact details such as WhatsApp, email, GitHub, LinkedIn, X, Khamsat, and Mostaql are managed from `/dashboard/settings` after login.

## Supabase Setup

Create the `projects` table:

```sql
create table projects (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  category text not null,
  tags text[] default '{}',
  thumbnail_url text,
  images text[] default '{}',
  live_url text,
  github_url text,
  featured boolean default false,
  order_num integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;

create policy "Public read"
on projects for select to anon
using (true);

create policy "Service role full access"
on projects for all to service_role
using (true);
```

Create a public Storage bucket named `projects`.

The dashboard contact settings are stored automatically in a Supabase Storage bucket named `site-settings` as `settings.json`.

## Seed Projects

After setting `.env.local`, seed the selected portfolio projects:

```bash
node scripts/seed-projects.mjs
```

## Vercel

1. Import this GitHub repository in Vercel.
2. Add only the Supabase and dashboard password environment variables listed above.
3. Use the default Next.js build settings.
4. Deploy.

Build command:

```bash
npm run build
```

Output is handled by Next.js automatically.
