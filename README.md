# FreeInvoiceBuilder

React + Vite invoice builder. Works as a fully local, no-signup tool out
of the box; optionally add Supabase to enable accounts and cross-device
sync.

## Stack

- **Vite + React 19 + TypeScript**
- **React Router** for pages (`src/routes`)
- **TanStack Query** for data fetching/caching
- **Tailwind v4 + shadcn/ui** (components hand-added under `src/components/ui`,
  since this environment couldn't reach `ui.shadcn.com` — you can still use
  `npx shadcn@latest add <component>` normally on your own machine)
- **Dexie (IndexedDB)** for guest/local storage — zero-config, works offline
- **Supabase (Postgres + Auth)** for signed-in users — optional, free tier

## Getting started

```bash
npm install
npm run dev
```

The app works immediately in **guest mode**: invoices and clients are
stored in IndexedDB in the browser, no account needed.

## Enabling cloud sync (optional)

1. Create a free project at supabase.com.
2. Copy `.env.local.example` to `.env.local` and fill in your project URL
   and publishable key (Project Settings > API).
3. Run this SQL in the Supabase SQL editor to create the tables:

```sql
create table clients (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  contact_person text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  country text,
  currency text,
  gst_number text,
  vat_number text,
  pan_number text,
  bank_name text,
  bank_account_name text,
  bank_account_number text,
  bank_ifsc_swift text,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  client_id uuid,
  status text not null default 'draft',
  issue_date date,
  due_date date,
  items jsonb not null default '[]',
  tax_rate numeric,
  currency text,
  notes text,
  bill_to jsonb,
  bill_from jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients enable row level security;
alter table invoices enable row level security;

create policy "own clients" on clients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own invoices" on invoices for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

4. Restart `npm run dev`. A "Sign in" link will appear in the sidebar;
   sign-in uses GitHub OAuth (Supabase Dashboard → Authentication →
   Providers → GitHub — needs a GitHub OAuth App's Client ID/Secret, with
   the callback URL set to `<your-supabase-url>/auth/v1/callback`). Once
   signed in, the app reads/writes Supabase instead of IndexedDB — see
   `src/data/repository.ts` for the switch logic.

## Project structure

```
src/
  components/ui/   shadcn primitives (Button, Card, Dialog, Table, ...)
  data/            types.ts, db.ts (Dexie), supabase.ts, repository.ts
  hooks/           use-auth, use-clients, use-invoices (React Query)
  routes/          Landing, Invoices, InvoiceEditor, InvoicePreview, Clients, BusinessProfile
```

`repository.ts` is the single place that decides local vs. cloud per call
(based on whether a user is signed in) — pages and hooks never talk to
Dexie or Supabase directly.

## Why this stack for a free invoice tool

- No backend cost for guest users — Dexie/IndexedDB is entirely client-side.
- Supabase's free tier (500MB Postgres, 50k monthly active users) covers
  a long time before any billing is needed, and Postgres gives you real
  querying/exports later if the product grows.
- Firebase/Firestore was the other free-tier option; Supabase was chosen
  here because Postgres + SQL is easier to reason about for invoice data
  (numbers, totals, joins) than Firestore's document model.
