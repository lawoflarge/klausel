-- Enable extensions
create extension if not exists "uuid-ossp";

-- Lease uploads (PDFs awaiting analysis)
create table public.lease_uploads (
  id uuid primary key default uuid_generate_v4(),
  storage_path text not null,
  email text not null,
  bundesland text not null,
  base_rent_eur numeric(10, 2) not null,
  lease_start_date date,
  uploaded_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '30 days') not null
);

-- Orders (Stripe purchases)
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  stripe_session_id text unique not null,
  stripe_payment_intent text,
  email text not null,
  amount_eur numeric(10, 2) not null,
  product text not null check (product in ('lease_review_oneshot', 'pro_monthly', 'pro_annual')),
  lease_upload_id uuid references public.lease_uploads(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  created_at timestamptz default now() not null,
  paid_at timestamptz
);

-- Reports (AI analysis output)
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  risk_score text check (risk_score in ('GREEN', 'YELLOW', 'RED')),
  payload jsonb,
  pdf_storage_path text,
  model_used text,
  error_message text,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

create index on public.reports (order_id);
create index on public.lease_uploads (expires_at);
create index on public.orders (email);

-- Enable RLS deny-by-default on all tables
alter table public.lease_uploads enable row level security;
alter table public.orders enable row level security;
alter table public.reports enable row level security;

-- No policies = total deny. Service-role client bypasses RLS for backend ops.
-- (Pro tier policies will come in week 2 when accounts ship.)

-- =============================================================
-- Storage buckets (created via Supabase dashboard, documented here)
-- =============================================================
-- Bucket: lease-uploads (private)
-- Bucket: report-pdfs (private)
-- All access via service-role from API routes — no client-side RLS policies.
-- 30-day cleanup handled by Vercel Cron (see api/cron/cleanup).
