-- Create bookings table
-- Run this in your Supabase project: Dashboard → SQL Editor → New Query → paste & run

create table if not exists public.bookings (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  name            text        not null,
  phone           text        not null,
  service         text        not null,
  preferred_date  date        not null,
  preferred_time  time        not null,
  notes           text,
  status          text        not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Enable Row Level Security (important for security)
alter table public.bookings enable row level security;

-- Only service role (Edge Function) can insert rows — no public access
create policy "Edge function insert only"
  on public.bookings
  for insert
  to service_role
  with check (true);

-- Only service role can read rows
create policy "Edge function read only"
  on public.bookings
  for select
  to service_role
  using (true);

-- Add an index on created_at for easy sorting in dashboard
create index bookings_created_at_idx on public.bookings (created_at desc);

-- Comment for clarity
comment on table public.bookings is 'Booking enquiries received via the Kayaal website form.';
comment on column public.bookings.status is 'pending | confirmed | cancelled | completed';
